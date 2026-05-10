/**
 * Script di migrazione — esegui con: npm run migrate
 * Applica schema.sql al database PostgreSQL configurato in DATABASE_URL.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Client } = pg;

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL non impostata nel file .env');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connesso al database');

    const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    await client.query(sql);

    console.log('✅ Schema applicato con successo');
    console.log('   Tabelle: streamers, bot_configs, bot_memories, bot_daily_usage');
  } catch (err) {
    console.error('❌ Errore durante la migrazione:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
