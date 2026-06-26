/**
 * setup-db.js — Initialise la table users dans PostgreSQL
 * Run: node setup-db.js
 * Lit PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT depuis l'env
 */
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host:     process.env.PGHOST     || 'localhost',
  user:     process.env.PGUSER     || 'lecak',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'appdb',
  port:     process.env.PGPORT     || 5432,
});

async function init() {
  const client = await pool.connect();
  try {
    // ── Supprimer et recréer la table (setup initial) ──
    await client.query('DROP TABLE IF EXISTS users');
    await client.query(`
      CREATE TABLE users (
        id           SERIAL PRIMARY KEY,
        username     VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(150) NOT NULL,
        password_hash TEXT NOT NULL,
        role         VARCHAR(20) NOT NULL DEFAULT 'user',
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ Table users créée');

    // ── Migration de l'admin depuis USERS_JSON ──
    const usersJson = process.env.USERS_JSON || '[]';
    const users = JSON.parse(usersJson);

    for (const u of users) {
      // Nettoyer le hash (les $ echappes en env deviennent $$)
      const hash = u.passwordHash.replace(/\$\$/g, '$');

      const existing = await client.query(
        'SELECT id FROM users WHERE username = $1',
        [u.username]
      );

      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO users (username, display_name, password_hash, role)
           VALUES ($1, $2, $3, 'admin')`,
          [u.username, u.displayName || u.username, hash]
        );
        console.log(`✅ Utilisateur "${u.username}" importé (role: admin)`);
      } else {
        console.log(`ℹ️  Utilisateur "${u.username}" existe déjà, ignoré`);
      }
    }

    console.log('\n🎉 Base de données initialisée avec succès');
  } finally {
    client.release();
    await pool.end();
  }
}

init().catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
