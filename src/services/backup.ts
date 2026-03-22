import {
  save,
  open as openDialog,
  ask,
  message,
} from "@tauri-apps/plugin-dialog";
import { readFile, writeFile } from "@tauri-apps/plugin-fs";
import { relaunch } from "@tauri-apps/plugin-process";
import { appConfigDir } from "@tauri-apps/api/path";

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
    const data = await readFile(filePath);
    await writeFile(dbPath, data);
    await message("Geri yükleme tamamlandı. Uygulama yeniden başlatılacak.", {
      title: "Başarılı",
      kind: "info",
    });
    await relaunch();
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
