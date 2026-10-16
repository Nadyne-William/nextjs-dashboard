import 'server-only';
import postgres from 'postgres';

// One shared connection pool for the whole app, instead of a new client per file.
// Hosted databases (Neon, Vercel Postgres, Supabase) require SSL; a local
// Postgres usually doesn't support it, so SSL is turned off for localhost.
const url = process.env.POSTGRES_URL;

if (!url) {
  throw new Error('POSTGRES_URL is not set. Copy .env.example to .env and fill it in.');
}

const isLocal = /@(localhost|127\.0\.0\.1)(:|\/)/.test(url);

export const sql = postgres(url, {
  ssl: isLocal ? false : 'require',
  // Postgres sends NOTICEs for harmless things like "table already exists, skipping".
  onnotice: () => {},
});
