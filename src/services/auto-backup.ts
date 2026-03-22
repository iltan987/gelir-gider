import {
  readFile,
  writeFile,
  readDir,
  remove,
  exists,
  mkdir,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";
import { appConfigDir, appDataDir } from "@tauri-apps/api/path";
import { getMetadata, setMetadata } from "@/services/db";
import { getISOWeek, getISOWeekYear } from "date-fns";

const BACKUP_DIR = "auto-backups";

const RETENTION = {
  session: 5,
  daily: 7,
  weekly: 4,
  monthly: 6,
} as const;

const SESSION_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

let intervalId: ReturnType<typeof setInterval> | null = null;

async function ensureBackupDir(): Promise<void> {
  const dirExists = await exists(BACKUP_DIR, {
    baseDir: BaseDirectory.AppData,
  });
  if (!dirExists) {
    await mkdir(BACKUP_DIR, {
      baseDir: BaseDirectory.AppData,
      recursive: true,
    });
  }
}

async function createBackup(filename: string): Promise<void> {
  await ensureBackupDir();
  const configDir = await appConfigDir();
  const dbPath = `${configDir}/gelir-gider.db`;
  const data = await readFile(dbPath);
  const dataDir = await appDataDir();
  await writeFile(`${dataDir}/${BACKUP_DIR}/${filename}`, data);
}

async function pruneByPrefix(prefix: string, keep: number): Promise<void> {
  const entries = await readDir(BACKUP_DIR, {
    baseDir: BaseDirectory.AppData,
  });

  const matching = entries
    .filter((e) => e.isFile && e.name.startsWith(prefix))
    .map((e) => e.name)
    .sort();

  if (matching.length <= keep) return;

  const toDelete = matching.slice(0, matching.length - keep);
  for (const name of toDelete) {
    await remove(`${BACKUP_DIR}/${name}`, {
      baseDir: BaseDirectory.AppData,
    });
  }
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

async function createSessionBackup(): Promise<void> {
  await createBackup(`auto-${timestamp()}.db`);
  await pruneByPrefix("auto-", RETENTION.session);
}

export async function runStartupBackups(): Promise<void> {
  try {
    // Always create a session backup
    await createSessionBackup();

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const weekStr = `${getISOWeekYear(now)}-W${String(getISOWeek(now)).padStart(2, "0")}`;
    const monthStr = todayStr.slice(0, 7);

    // Daily
    const lastDaily = await getMetadata("last_daily_backup");
    if (lastDaily !== todayStr) {
      await createBackup(`daily-${todayStr}.db`);
      await setMetadata("last_daily_backup", todayStr);
      await pruneByPrefix("daily-", RETENTION.daily);
    }

    // Weekly
    const lastWeekly = await getMetadata("last_weekly_backup");
    if (lastWeekly !== weekStr) {
      await createBackup(`weekly-${weekStr}.db`);
      await setMetadata("last_weekly_backup", weekStr);
      await pruneByPrefix("weekly-", RETENTION.weekly);
    }

    // Monthly
    const lastMonthly = await getMetadata("last_monthly_backup");
    if (lastMonthly !== monthStr) {
      await createBackup(`monthly-${monthStr}.db`);
      await setMetadata("last_monthly_backup", monthStr);
      await pruneByPrefix("monthly-", RETENTION.monthly);
    }

    // Update last auto-backup timestamp
    await setMetadata("last_auto_backup", new Date().toISOString());
  } catch (err) {
    // Auto-backup failure must not block startup
    console.error("Auto-backup failed:", err);
  }
}

export function startPeriodicBackup(): void {
  if (intervalId) return;
  intervalId = setInterval(async () => {
    try {
      await createSessionBackup();
      await setMetadata("last_auto_backup", new Date().toISOString());
    } catch (err) {
      console.error("Periodic backup failed:", err);
    }
  }, SESSION_INTERVAL_MS);
}

export function stopPeriodicBackup(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export async function createPreMigrationBackup(
  migrationVersion: string,
): Promise<void> {
  try {
    await ensureBackupDir();
    await createBackup(`pre-migration-${migrationVersion}-${timestamp()}.db`);
  } catch (err) {
    console.error("Pre-migration backup failed:", err);
  }
}
