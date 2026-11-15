import { createClient, Client } from "@libsql/client";

let client: Client | null = null;

export function getTursoClient(): Client | null {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    return null;
  }

  if (!client) {
    client = createClient({
      url,
      authToken: authToken || undefined,
    });
  }

  return client;
}

export async function initTursoSchema(db: Client): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_sync (
      sync_code TEXT PRIMARY KEY,
      state_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
}
