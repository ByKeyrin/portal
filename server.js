require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { createClient } = require('redis');
const { RedisStore } = require('connect-redis');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Redis client ──────────────────────────────────────────
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379'
});
redisClient.connect().catch(console.error);

redisClient.on('error', (err) => console.error('Redis error:', err));
redisClient.on('connect', () => console.log('Redis connecté'));

// ── PostgreSQL client ─────────────────────────────────────
const pgPool = new Pool({
  host:     process.env.PGHOST     || 'localhost',
  user:     process.env.PGUSER     || 'lecak',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'appdb',
  port:     process.env.PGPORT     || 5432,
});

pgPool.query('SELECT 1').then(() => {
  console.log('PostgreSQL connecté');
}).catch(err => {
  console.error('Erreur PostgreSQL:', err.message);
});

// ── Session ───────────────────────────────────────────────
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'change-me-en-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // mettre true avec HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Services disponibles ──────────────────────────────────
const SERVICES = [
  {
    id: 'portainer',
    icon: '<i class="fa-brands fa-docker"></i>',
    title: 'Portainer',
    desc: 'Gestion des conteneurs Docker',
    url: '/portainer/'
  },
  {
    id: 'netdata',
    icon: '<i class="fa-solid fa-chart-line"></i>',
    title: 'Netdata',
    desc: 'Monitoring en temps réel du serveur',
    url: '/netdata/'
  },
  {
    id: 'pgadmin',
    icon: '<i class="fa-solid fa-database"></i>',
    title: 'pgAdmin',
    desc: 'Suivi de mes bases de données Postgres',
    url: '/pgadmin/'
  },
  {
    id: 'mimo',
    icon: '<i class="fa-solid fa-brain"></i>',
    title: 'MiMo API',
    desc: 'Plateforme Xiaomi MiMo — solde de tokens',
    url: 'https://platform.xiaomimimo.com/console/profile'
  }
];

// ── Middleware auth ────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/');
}

// ── Routes ────────────────────────────────────────────────

// Page de connexion
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Traitement login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pgPool.query(
      'SELECT username, display_name, password_hash, role FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.sendFile(path.join(__dirname, 'views', 'login.html'));
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.sendFile(path.join(__dirname, 'views', 'login.html'));
    }

    req.session.user = {
      username: user.username,
      displayName: user.display_name,
      role: user.role
    };
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Erreur login:', err.message);
    return res.sendFile(path.join(__dirname, 'views', 'login.html'));
  }
});

// Dashboard (protégé)
app.get('/dashboard', requireAuth, (req, res) => {
  const name = req.session.user.displayName;
  const role = req.session.user.role;
  const roleLabel = role === 'admin' ? 'Administrateur' : 'Utilisateur';
  let cards = '';
  for (const svc of SERVICES) {
    cards += `
      <a class="mini-card" href="${svc.url}" target="_blank">
        <div class="mini-card-icon">${svc.icon}</div>
        <h2>${svc.title}</h2>
        <p>${svc.desc}</p>
        <span class="mini-card-arrow"><i class="fa-solid fa-arrow-up-right-from-square"></i></span>
      </a>`;
  }

  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Portail Serveur</title>
  <link rel="stylesheet" href="/style.css"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"/>
</head>
<body class="dashboard-body">

  <!-- Fond animé -->
  <div class="bg-anim">
    <div class="bg-grid"></div>
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>
    <div class="bg-orb bg-orb-3"></div>
    <canvas id="particles"></canvas>
  </div>

  <div class="container dash-container">

    <!-- Carte principale -->
    <div class="card dash-card">
      <div class="header-bar">
        <div class="header-left">
          <div class="dash-logo">
            <i class="fa-solid fa-rocket"></i>
          </div>
          <div>
            <h1>Serveur Ubuntu</h1>
            <span class="header-sub">Portail d'administration</span>
          </div>
        </div>
        <div class="user-info">
          <div class="user-avatar">
            <i class="fa-solid fa-circle-user"></i>
          </div>
          <div class="user-meta">
            <span class="user-name">${name}</span>
            <span class="user-role">${roleLabel}</span>
          </div>
          <a href="/reset-password" class="btn-change-pwd" title="Changer le mot de passe">
            <i class="fa-solid fa-key"></i>
          </a>
          <a href="/logout" class="btn-logout">
            <i class="fa-solid fa-right-from-bracket"></i>
            <span>Déconnexion</span>
          </a>
        </div>
      </div>

      <div class="dash-status-bar">
        <div class="status-badge">
          <span class="status-dot"></span>
          Tous les services sont opérationnels
        </div>
      </div>

      <footer>
        <i class="fa-solid fa-shield-halved"></i>
        Hébergé sur Ubuntu Server &bull; Nginx &bull; Node.js
      </footer>
    </div>

    <!-- Mini-cards services -->
    <div class="cards">
      ${cards}
    </div>

  </div>

  <script>
    (function() {
      var canvas = document.getElementById('particles');
      var ctx = canvas.getContext('2d');
      var w, h, particles = [];

      function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
      }
      resize();
      window.addEventListener('resize', resize);

      function Particle() { this.reset(); }
      Particle.prototype.reset = function() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.r = Math.random() * 1.8 + 0.4;
        this.dx = (Math.random() - 0.5) * 0.25;
        this.dy = (Math.random() - 0.5) * 0.25;
        this.opacity = Math.random() * 0.3 + 0.05;
      };
      Particle.prototype.update = function() {
        this.x += this.dx;
        this.y += this.dy;
        if (this.x < 0 || this.x > w) this.dx *= -1;
        if (this.y < 0 || this.y > h) this.dy *= -1;
      };
      Particle.prototype.draw = function() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + this.opacity + ')';
        ctx.fill();
      };

      for (var i = 0; i < 35; i++) particles.push(new Particle());

      function animate() {
        ctx.clearRect(0, 0, w, h);
        for (var j = 0; j < particles.length; j++) {
          particles[j].update();
          particles[j].draw();
        }
        requestAnimationFrame(animate);
      }
      animate();
    })();
  </script>

</body>
</html>`);
});

// ── Page reset password (depuis login "mot de passe oublié") ──
app.get('/reset-password', (req, res) => {
  // Accessible sans session (mot de passe oublie) OU avec session (dashboard)
  res.sendFile(path.join(__dirname, 'views', 'reset-password.html'));
});

// ── Traitement reset password ──
app.post('/reset-password', async (req, res) => {
  const { username, current_password, new_password, confirm_password } = req.body;

  // Validation coté serveur
  if (!username || !current_password || !new_password || !confirm_password) {
    return res.status(400).sendFile(path.join(__dirname, 'views', 'reset-password.html'));
  }

  if (new_password !== confirm_password) {
    return res.status(400).sendFile(path.join(__dirname, 'views', 'reset-password.html'));
  }

  if (new_password.length < 6) {
    return res.status(400).sendFile(path.join(__dirname, 'views', 'reset-password.html'));
  }

  try {
    // Verifier l'utilisateur et le mot de passe actuel
    const result = await pgPool.query(
      'SELECT id, password_hash FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).sendFile(path.join(__dirname, 'views', 'reset-password.html'));
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) {
      return res.status(401).sendFile(path.join(__dirname, 'views', 'reset-password.html'));
    }

    // Hasher le nouveau mot de passe
    const SALT_ROUNDS = 12;
    const newHash = await bcrypt.hash(new_password, SALT_ROUNDS);

    // Mettre a jour en base
    await pgPool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newHash, user.id]
    );

    console.log(`✅ Mot de passe modifié pour "${username}"`);

    // Rediriger vers la page de connexion avec un message de succes
    res.redirect('/?reset=success');
  } catch (err) {
    console.error('Erreur reset password:', err.message);
    res.status(500).sendFile(path.join(__dirname, 'views', 'reset-password.html'));
  }
});

// Déconnexion
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ── Démarrage ─────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Portal démarré sur le port ${PORT}`);
});
