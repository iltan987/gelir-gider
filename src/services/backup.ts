import {
  save,
  open as openDialog,
  ask,
  message,
} from "@tauri-apps/plugin-dialog";
import { readFile, writeFile, copyFile, remove } from "@tauri-apps/plugin-fs";
import { appConfigDir } from "@tauri-apps/api/path";
import Database from "@tauri-apps/plugin-sql";
import { closeDb } from "@/services/db";

async function getDbPath(): Promise<string> {
  const dir = await appConfigDir();
  return `${dir}/gelir-gider.db`;
}

export async function backupToFile(): Promise<boolean> {
  const dbPath = await getDbPath();
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const defaultName = `gelir-gider-yedek-${ts}.db`;

  const savePath = await save({
    defaultPath: defaultName,
    filters: [{ name: "SQLite Database", extensions: ["db"] }],
  });

  if (!savePath) return false;

  try {
    const data = await readFile(dbPath);
    await writeFile(savePath, data);
    await message("Yedekleme tamamlandı.", { title: "Başarılı", kind: "info" });
    return true;
  } catch (err) {
    console.error("Backup failed:", err);
    await message(`Yedekleme başarısız: ${err}`, {
      title: "Hata",
      kind: "error",
    });
    return false;
  }
}

export async function restoreFromFile(): Promise<boolean> {
  const filePath = await openDialog({
    multiple: false,
    filters: [{ name: "SQLite Database", extensions: ["db"] }],
  });

  if (!filePath) return false;

  const confirmed = await ask(
    "Tüm mevcut veriler yedek dosyasındaki verilerle değiştirilecektir. Devam edilsin mi?",
    { title: "Geri Yükleme", kind: "warning" },
  );

  if (!confirmed) return false;

  try {
    const dbPath = await getDbPath();
    const backupPath = `${dbPath}.pre-restore`;
    const data = await readFile(filePath);

    // Validate the file is a valid SQLite DB with expected schema
    const tempPath = `${dbPath}.validate`;
    await writeFile(tempPath, data);
    try {
      const testDb = await Database.load(`sqlite:${tempPath}`);
      await testDb.select(
        "SELECT id, date, type, amount, category FROM transactions LIMIT 1",
      );
      await testDb.close();
    } catch {
      await remove(tempPath);
      await message("Seçilen dosya geçerli bir yedek değil veya bozuk.", {
        title: "Hata",
        kind: "error",
      });
      return false;
    }
    await remove(tempPath);

    // Close current DB, backup current file, then overwrite
    await closeDb();
    await copyFile(dbPath, backupPath);
    try {
      await writeFile(dbPath, data);
    } catch (writeErr) {
      // Restore the original if write fails
      await copyFile(backupPath, dbPath);
      await remove(backupPath);
      throw writeErr;
    }
    await remove(backupPath);

    await message("Geri yükleme tamamlandı. Sayfa yeniden yüklenecek.", {
      title: "Başarılı",
      kind: "info",
    });
    window.location.reload();
    return true;
  } catch (err) {
    console.error("Restore failed:", err);
    await message(`Geri yükleme başarısız: ${err}`, {
      title: "Hata",
      kind: "error",
    });
    return false;
  }
}
