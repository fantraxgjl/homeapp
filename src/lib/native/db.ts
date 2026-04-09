/**
 * Capacitor SQLite connection singleton for standalone native mode.
 * Only call getDb() from client-side code after isNative() === true.
 */
import { SCHEMA_SQL } from "./schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SQLiteDBConnection = any;

let _db: SQLiteDBConnection | null = null;
let _initPromise: Promise<SQLiteDBConnection> | null = null;

export async function getDb(): Promise<SQLiteDBConnection> {
  if (_db) return _db;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const { CapacitorSQLite, SQLiteConnection } = await import(
      "@capacitor-community/sqlite"
    );
    const sqlite = new SQLiteConnection(CapacitorSQLite);

    const db = await sqlite.createConnection(
      "homeapp",
      false,
      "no-encryption",
      1,
      false
    );
    await db.open();

    // Run schema (all CREATE IF NOT EXISTS — safe to call every launch)
    await db.execute(SCHEMA_SQL, false);

    _db = db;
    return db;
  })();

  return _initPromise;
}

/** Generate a UUID v4 for use as a row ID. */
export function uid(): string {
  return crypto.randomUUID();
}

/** ISO 8601 timestamp string. */
export function now(): string {
  return new Date().toISOString();
}

/** Run a SELECT and return rows as plain objects. */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const db = await getDb();
  const result = await db.query(sql, params);
  return (result.values ?? []) as T[];
}

/** Run an INSERT / UPDATE / DELETE. */
export async function run(
  sql: string,
  params: unknown[] = []
): Promise<{ lastId: number; changes: number }> {
  const db = await getDb();
  const result = await db.run(sql, params, false);
  return result.changes ?? { lastId: 0, changes: 0 };
}
