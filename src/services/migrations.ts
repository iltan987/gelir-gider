import { getMetadata } from "./db";

/**
 * Migrations are handled natively by tauri-plugin-sql via `add_migrations()` in Rust.
 * They run automatically when Database.load() is called.
 *
 * This module provides version reading for the auto-backup service
 * (pre-migration backup decisions).
 */

export async function getCurrentVersion(): Promise<number> {
  const version = await getMetadata("schema_version");
  return version ? parseInt(version, 10) : 0;
}
