/**
 * widgets.js — Horloge + Météo injectés sur toutes les pages
 * Inclure avec : <script src="/widgets.js"></script>
 */
(function() {

  // ── Styles (injectés une seule fois) ──
  var CSS = `
    <style id="widgets-css">
      .dash-widgets {
        display: flex;
        gap: 12px;
        justify-content: stretch;
        margin: 20px 0 0 0;
        position: relative;
        z-index: 2;
        width: 100%;
      }

      .dash-widget {
        flex: 1;
        min-width: 0;

        background: rgba(255, 255, 255, 0.55);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);

        border-radius: 16px;
        padding: 16px 18px;

        box-shadow:
          0 12px 30px rgba(0,0,0,0.1),
          0 0 0 1px rgba(255,255,255,0.25),
          inset 0 1px 0 rgba(255,255,255,0.4);

        display: flex;
        align-items: center;
        gap: 12px;

        position: relative;
        overflow: hidden;

        animation: dwEnter 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      .dash-widget:nth-child(1) { animation-delay: 0.1s; }
      .dash-widget:nth-child(2) { animation-delay: 0.25s; }

      @keyframes dwEnter {
        from { opacity: 0; transform: translateY(15px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      .dash-widget::before {
        content: '';
        position: absolute;
        top: -50%; left: -50%;
        width: 200%; height: 200%;
        background: radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%);
        pointer-events: none;
      }

      .dw-icon {
        width: 44px; height: 44px;
        border-radius: 14px;
        background: linear-gradient(145deg, #053580, #032658);
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 18px; flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(3,38,88,0.2);
      }

      .dw-body { min-width: 0; flex: 1; }

      /* Horloge */
      .dw-clock-time {
        font-size: 28px; font-weight: 700;
        color: #1a3a6e; letter-spacing: -1px; line-height: 1;
        font-variant-numeric: tabular-nums;
      }
      .dw-clock-greet { font-size: 13px; color: #5a6a8a; margin-top: 2px; }
      .dw-clock-date  { font-size: 11px; color: #8a9abc; margin-top: 2px; text-transform: capitalize; }

      /* Météo */
      .dw-weather-temp { font-size: 28px; font-weight: 700; color: #1a3a6e; letter-spacing: -1px; line-height: 1; }
      .dw-weather-desc { font-size: 12.5px; color: #5a6a8a; margin-top: 2px; }
      .dw-weather-city { font-size: 11px; color: #8a9abc; margin-top: 2px; }

      /* Responsive */
      @media (max-width: 480px) {
        .dash-widgets { flex-direction: column; }
      }
    </style>
  `;

  // ── HTML ──
  var HTML = `
    <div class="dash-widgets" id="dash-widgets">

      <div class="dash-widget">
        <div class="dw-icon"><i class="fa-regular fa-clock"></i></div>
        <div class="dw-body">
          <div class="dw-clock-time" id="dw-time">--:--</div>
          <div class="dw-clock-greet" id="dw-greet">Bonjour</div>
          <div class="dw-clock-date"  id="dw-date">--</div>
        </div>
      </div>

      <div class="dash-widget">
        <div class="dw-icon" id="dw-wx-icon"><i class="fa-solid fa-cloud-sun"></i></div>
        <div class="dw-body">
          <div class="dw-weather-temp" id="dw-wx-temp">--°C</div>
          <div class="dw-weather-desc" id="dw-wx-desc">Chargement...</div>
          <div class="dw-weather-city" id="dw-wx-city"></div>
        </div>
      </div>

    </div>
  `;

  // ── Injection ──
  function inject() {
    if (document.getElementById('dash-widgets')) return; // déjà injecté
    if (!document.getElementById('widgets-css')) {
      document.head.insertAdjacentHTML('beforeend', CSS);
    }

    // Trouver le point d'insertion : après la carte de login
    var anchor = document.querySelector('.login-card');
    if (anchor) {
      anchor.insertAdjacentHTML('afterend', HTML);
    }
  }

  // ── Horloge ──
  function startClock() {
    var days = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
    var months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

    function pad(n) { return n < 10 ? '0' + n : n; }

    function tick() {
      var now = new Date();
      var h = now.getHours();

      var el = document.getElementById('dw-time');
      if (el) el.textContent = pad(h) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());

      var greet = 'Bonsoir';
      if (h >= 5 && h < 12) greet = 'Bonjour';
      else if (h >= 12 && h < 18) greet = 'Bon après-midi';
      var el2 = document.getElementById('dw-greet');
      if (el2) el2.textContent = greet + ' ☀️';

      var el3 = document.getElementById('dw-date');
      if (el3) el3.textContent = days[now.getDay()] + ' ' + now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();
    }

    tick();
    setInterval(tick, 1000);
  }

  // ── Météo ──
  var WX_CODES = {
    0:'fa-sun', 1:'fa-sun', 2:'fa-cloud-sun', 3:'fa-cloud',
    45:'fa-smog', 48:'fa-smog',
    51:'fa-cloud-rain', 53:'fa-cloud-rain', 55:'fa-cloud-rain',
    61:'fa-cloud-showers-heavy', 63:'fa-cloud-showers-heavy', 65:'fa-cloud-showers-heavy',
    71:'fa-snowflake', 73:'fa-snowflake', 75:'fa-snowflake',
    80:'fa-cloud-rain', 81:'fa-cloud-rain', 82:'fa-cloud-rain',
    95:'fa-bolt', 96:'fa-bolt', 99:'fa-bolt'
  };
  var WX_DESC = {
    0:'Ciel dégagé', 1:'Principalement dégagé', 2:'Partiellement nuageux', 3:'Couvert',
    45:'Brouillard', 48:'Brouillard givrant',
    51:'Bruine légère', 53:'Bruine modérée', 55:'Bruine dense',
    61:'Pluie légère', 63:'Pluie modérée', 65:'Pluie forte',
    71:'Neige légère', 73:'Neige modérée', 75:'Neige forte',
    80:'Averses', 81:'Averses modérées', 82:'Averses fortes',
    95:'Orage', 96:'Orage avec grêle', 99:'Orage violent'
  };

  function fetchWeather(lat, lon, cityLabel) {
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,weather_code&timezone=auto';

    fetch(url)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var temp = Math.round(data.current.temperature_2m);
        var code = data.current.weather_code;
        var icon = WX_CODES[code] || 'fa-cloud';
        var desc = WX_DESC[code] || 'Inconnu';

        var el1 = document.getElementById('dw-wx-temp');
        var el2 = document.getElementById('dw-wx-desc');
        var el3 = document.getElementById('dw-wx-icon');
        var el4 = document.getElementById('dw-wx-city');

        if (el1) el1.textContent = temp + '°C';
        if (el2) el2.textContent = desc;
        if (el3) el3.innerHTML = '<i class="fa-solid ' + icon + '"></i>';
        if (el4) el4.textContent = cityLabel || '';
      })
      .catch(function() {
        var el = document.getElementById('dw-wx-desc');
        if (el) el.textContent = 'Indisponible';
      });
  }

  function startWeather() {
    // 1. Essayer la géolocalisation navigateur
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function(pos) {
          fetchWeather(pos.coords.latitude, pos.coords.longitude, 'Ma position');
        },
        function() {
          // Refusé → fallback IP
          fallbackWeather();
        },
        { timeout: 5000 }
      );
    } else {
      fallbackWeather();
    }
  }

  function fallbackWeather() {
    // 2. Géolocalisation par IP (gratuit)
    fetch('https://ipapi.co/json/')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.latitude && data.longitude) {
          fetchWeather(data.latitude, data.longitude, data.city || '');
        } else {
          fetchWeather(48.85, 2.35, 'Paris');
        }
      })
      .catch(function() {
        fetchWeather(48.85, 2.35, 'Paris');
      });
  }

  // ── Démarrage ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      inject();
      startClock();
      startWeather();
    });
  } else {
    inject();
    startClock();
    startWeather();
  }

})();
