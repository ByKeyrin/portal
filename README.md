<p align="center">
  <img src="https://img.shields.io/badge/🚀_Portal-v1.0.0-002f78?style=for-the-badge&labelColor=d8a3b0&color=6d6fa8" alt="Portal v1.0.0"/>
</p>

<h1 align="center">Portail Serveur</h1>

<p align="center">
  Interface d'authentification et tableau de bord pour la gestion des services auto-hébergés.<br/>
  <em>Express · Redis · PostgreSQL · Nginx · Docker</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express&logoColor=white" alt="Express"/>
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis"/>
  <img src="https://img.shields.io/badge/PostgreSQL-17-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Nginx-1.31-009639?style=flat-square&logo=nginx&logoColor=white" alt="Nginx"/>
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker"/>
  <img src="https://img.shields.io/badge/Ubuntu-26.04-E95420?style=flat-square&logo=ubuntu&logoColor=white" alt="Ubuntu"/>
</p>

---

## 📸 Aperçu

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              ╭──────────────╮                         │
│              │   👤 Avatar  │                         │
│              ╰──────┬───────╯                         │
│         ┌───────────┴────────────┐                    │
│         │                        │                    │
│         │  ┌────┐  Identifiant   │                    │
│         │  │ 👤 │  ▓▓▓▓▓▓▓▓▓▓▓  │                    │
│         │  └────┘                │                    │
│         │  ┌────┐  Mot de passe  │                    │
│         │  │ 🔒 │  ▓▓▓▓▓▓▓▓▓▓▓  │                    │
│         │  └────┘                │                    │
│         │                        │                    │
│         │  ☐ Se souvenir de moi  │                    │
│         │                        │                    │
│         │  ┌──────────────────┐  │                    │
│         │  │    CONNEXION     │  │                    │
│         │  └──────────────────┘  │                    │
│         └────────────────────────┘                    │
│                                                      │
│     Ubuntu 26.04 · Node.js + Nginx · UFW + Tailscale │
└──────────────────────────────────────────────────────┘
```

## 🏗️ Architecture

```
                         ┌─────────────┐
                         │  Internet   │
                         │ (Tailscale) │
                         └──────┬──────┘
                                │
                         ┌──────▼──────┐
                         │    Nginx    │
                         │   :80/443   │
                         └──────┬──────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                  │
       ┌──────▼──────┐  ┌──────▼──────┐  ┌───────▼───────┐
       │  Portal     │  │  Services   │  │   Reverse     │
       │  Node.js    │  │  (proxied)  │  │   Proxy       │
       │  :3000      │  │             │  │   Routes      │
       └──────┬──────┘  └─────────────┘  └───────────────┘
              │
     ┌────────┼────────┐
     │                 │
┌────▼────┐     ┌──────▼──────┐
│  Redis  │     │  PostgreSQL │
│ Session │     │    :5432    │
│  :6379  │     │             │
└─────────┘     └─────────────┘
```

## 🗂️ Structure du projet

```
portal/
├── server.js            # Application Express (routes, auth, sessions)
├── views/
│   └── login.html       # Page de connexion
├── public/
│   └── style.css        # Styles (login + dashboard)
├── Dockerfile           # Image Docker (node:22-alpine)
├── package.json         # Dépendances Node.js
├── .gitignore           # Fichiers exclus du repo
└── .env                 # Variables d'environnement (non versionné)
```

## 🚀 Services gérés

| Service | URL | Description |
|---------|-----|-------------|
| 🧰 **Portainer** | `/portainer/` | Gestion des conteneurs Docker |
| 📊 **Netdata** | `/netdata/` | Monitoring en temps réel du serveur |
| 🗄️ **pgAdmin** | `/pgadmin/` | Administration des bases PostgreSQL |

## ⚙️ Installation

### Prérequis

- Docker et Docker Compose
- Un serveur Ubuntu (ou compatible)
- Tailscale (optionnel, pour l'accès mesh)

### 1. Cloner le dépôt

```bash
git clone https://github.com/ByKeyrin/portal.git
cd portal
```

### 2. Configurer les variables d'environnement

Créer un fichier `.env` à la racine :

```env
PORT=3000
REDIS_URL=redis://redis:6379
SESSION_SECRET=votre-secret-ici
USERS_JSON=[{"username":"admin","passwordHash":"$2a$10$...","displayName":"Administrateur"}]
```

> ⚠️ Générer un hash bcrypt pour le mot de passe :
> ```bash
> node -e "require('bcryptjs').hash('votre-mot-de-passe', 10).then(console.log)"
> ```

### 3. Lancer avec Docker Compose

```bash
docker compose up -d
```

Le portail sera accessible sur `http://localhost`

## 🔧 Développement

```bash
# Installer les dépendances
npm install

# Lancer en mode développement (auto-reload)
npm run dev

# Lancer en production
npm start
```

## 🔐 Sécurité

- **Sessions** : stockées dans Redis avec expiration 24h
- **Mots de passe** : hashés avec bcrypt (salt rounds: 10)
- **Cookies** : httpOnly, pas de secure (à activer avec HTTPS)
- **Réseau** : UFW firewall + Tailscale mesh
- **Secrets** : fichier `.env` exclu du versioning (`.gitignore`)

## 📋 Stack technique

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| Backend | Express 4.21 | Serveur HTTP, routes, API |
| Sessions | express-session + connect-redis | Stockage des sessions dans Redis |
| Auth | bcryptjs | Hash et vérification des mots de passe |
| Cache/Session | Redis 7 | Stockage clé-valeur rapide |
| Base de données | PostgreSQL 17 | Données applicatives |
| Reverse proxy | Nginx | Routage, SSL termination |
| Conteneurisation | Docker + Docker Compose | Isolation et orchestration |
| Monitoring | Netdata | Métriques système en temps réel |
| Administration DB | pgAdmin | Interface web pour PostgreSQL |

## 📄 Licence

Projet personnel — usage privé.

---

<p align="center">
  <sub>Hébergé sur Ubuntu Server · Nginx · Docker</sub>
</p>
