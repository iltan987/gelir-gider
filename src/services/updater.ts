import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import type { UpdateStatus } from "@/types";

export async function checkForUpdate(): Promise<UpdateStatus> {
  const update = await check();
  if (!update) {
    return { status: "upToDate" };
  }
  return {
    status: "available",
    version: update.version,
    body: update.body ?? null,
    date: update.date ?? null,
  };
}

export async function installUpdate(
  onProgress: (progress: number) => void,
): Promise<void> {
  const update = await check();
  if (!update) return;

  let downloaded = 0;
  let contentLength = 0;

  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case "Started":
        contentLength = event.data.contentLength ?? 0;
        break;
      case "Progress":
        downloaded += event.data.chunkLength;
        if (contentLength > 0) {
          onProgress(Math.round((downloaded / contentLength) * 100));
        }
        break;
      case "Finished":
        onProgress(100);
        break;
    }
  });

  await relaunch();
}
