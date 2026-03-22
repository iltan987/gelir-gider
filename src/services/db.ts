import Database, { type QueryResult } from "@tauri-apps/plugin-sql";

const DB_PATH = "sqlite:gelir-gider.db";

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load(DB_PATH);
  }
  return db;
}

export async function closeDb(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}

export async function execute(
  query: string,
  bindValues?: unknown[],
): Promise<QueryResult> {
  const conn = await getDb();
  return conn.execute(query, bindValues);
}

export async function select<T>(
  query: string,
  bindValues?: unknown[],
): Promise<T> {
  const conn = await getDb();
  return conn.select<T>(query, bindValues);
}

export async function getMetadata(key: string): Promise<string | null> {
  const rows = await select<Array<{ value: string }>>(
    "SELECT value FROM app_metadata WHERE key = $1",
    [key],
  );
  return rows.length > 0 ? rows[0].value : null;
}

export async function setMetadata(key: string, value: string): Promise<void> {
  await execute(
    "INSERT INTO app_metadata (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, value],
  );
}
