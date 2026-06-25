require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { createClient } = require('redis');
const { RedisStore } = require('connect-redis');
const bcrypt = require('bcryptjs');
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

// ── Config utilisateur (depuis les variables d'environnement) ──
const USERS = JSON.parse(process.env.USERS_JSON || '[]');

// ── Services disponibles ──────────────────────────────────
const SERVICES = [
  {
    id: 'portainer',
    icon: '🧰',
    title: 'Portainer',
    desc: 'Gestion des conteneurs Docker',
    url: '/portainer/'
  },
  {
    id: 'netdata',
    icon: '📊',
    title: 'Netdata',
    desc: 'Monitoring en temps réel du serveur',
    url: '/netdata/'
  },
  {
    id: 'pgadmin',
    icon: '🗄️',
    title: 'pgAdmin',
    desc: 'Suivi de mes bases de données Postgres',
    url: '/pgadmin/'
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

  const user = USERS.find(u => u.username === username);
  if (!user) {
    return res.sendFile(path.join(__dirname, 'views', 'login.html'));
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.sendFile(path.join(__dirname, 'views', 'login.html'));
  }

  req.session.user = { username: user.username, displayName: user.displayName || user.username };
  res.redirect('/dashboard');
});

// Dashboard (protégé)
app.get('/dashboard', requireAuth, (req, res) => {
  let html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Portail Serveur</title>
  <link rel="stylesheet" href="/style.css"/>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header-bar">
        <h1>🚀 Serveur Ubuntu</h1>
        <div class="user-info">
          <span class="user-name">👤 ${req.session.user.displayName}</span>
          <a href="/logout" class="btn-logout">Déconnexion</a>
        </div>
      </div>
      <p>Bienvenue, ${req.session.user.displayName}.<br/>Tous les services sont opérationnels.</p>
      <div class="status">En ligne</div>
      <footer>Hébergé sur Ubuntu Server &bull; Nginx &bull; Node.js</footer>
    </div>
    <div class="cards">`;

  for (const svc of SERVICES) {
    html += `
      <a class="mini-card" href="${svc.url}" target="_blank">
        <h2>${svc.icon} ${svc.title}</h2>
        <p>${svc.desc}</p>
      </a>`;
  }

  html += `
    </div>
  </div>
</body>
</html>`;
  res.send(html);
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
