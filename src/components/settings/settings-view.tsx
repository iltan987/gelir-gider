import { useState, useEffect } from "react";
import {
  FileUp,
  AlertTriangle,
  CheckCircle,
  Download,
  Upload,
  Sun,
  Moon,
  Monitor,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { getVersion } from "@tauri-apps/api/app";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Theme, UpdateStatus } from "@/types";
import { formatDateTR, formatCurrency } from "@/lib/format";
import { useAppStore } from "@/stores/app-store";
import { getMetadata } from "@/services/db";
import { backupToFile, restoreFromFile } from "@/services/backup";
import { checkForUpdate, installUpdate } from "@/services/updater";
import {
  pickAndParseFile,
  insertRows,
  type ImportResult,
} from "@/services/import";

type ImportState =
  | { step: "idle" }
  | { step: "preview"; result: ImportResult }
  | { step: "importing" }
  | { step: "done"; inserted: number };

export function SettingsView() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const [importState, setImportState] = useState<ImportState>({ step: "idle" });
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [updateState, setUpdateState] = useState<UpdateStatus>({
    status: "idle",
  });
  const [appVersion, setAppVersion] = useState<string>("");

  useEffect(() => {
    getMetadata("last_auto_backup").then(setLastBackup);
    getVersion().then(setAppVersion);
  }, []);

  async function handleCheckUpdate() {
    setUpdateState({ status: "checking" });
    try {
      const result = await checkForUpdate();
      setUpdateState(result);
    } catch {
      setUpdateState({ status: "error", error: "Sunucuya ulasilamadi" });
    }
  }

  async function handleInstallUpdate() {
    if (updateState.status !== "available") return;
    const { version } = updateState;
    setUpdateState({ status: "downloading", version, progress: 0 });
    try {
      await installUpdate((progress) => {
        setUpdateState({ status: "downloading", version, progress });
      });
    } catch {
      setUpdateState({ status: "error", error: "Guncelleme yuklenemedi" });
    }
  }

  async function handlePickFile() {
    const result = await pickAndParseFile();
    if (!result) return;
    setImportState({ step: "preview", result });
  }

  async function handleConfirmImport() {
    if (importState.step !== "preview") return;
    const { result } = importState;
    setImportState({ step: "importing" });
    const inserted = await insertRows(result.validRows);
    setImportState({ step: "done", inserted });
  }

  function handleCancel() {
    setImportState({ step: "idle" });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Ayarlar</h2>

      {/* Theme */}
      <Card className="space-y-3 p-4">
        <div>
          <h3 className="text-sm font-medium">Tema</h3>
          <p className="text-muted-foreground text-xs">
            Arayüz renk temasını seçin.
          </p>
        </div>
        <div className="flex gap-2">
          {(
            [
              { value: "system", label: "Sistem", icon: Monitor },
              { value: "light", label: "Aydınlik", icon: Sun },
              { value: "dark", label: "Karanlık", icon: Moon },
            ] as const
          ).map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={theme === value ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme(value as Theme)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Backup & Restore */}
      <Card className="space-y-4 p-4">
        <h3 className="text-sm font-medium">Yedekleme ve Geri Yükleme</h3>
        {lastBackup && (
          <p className="text-muted-foreground text-xs">
            Son otomatik yedek:{" "}
            {formatDateTR(new Date(lastBackup), "d MMMM yyyy HH:mm")}
          </p>
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={backupToFile}>
            <Download className="mr-2 h-4 w-4" />
            Yedekle
          </Button>
          <Button variant="outline" size="sm" onClick={restoreFromFile}>
            <Upload className="mr-2 h-4 w-4" />
            Geri Yükle
          </Button>
        </div>
      </Card>

      {/* Update Checker */}
      <Card className="space-y-3 p-4">
        <div>
          <h3 className="text-sm font-medium">Güncelleme</h3>
          {appVersion && (
            <p className="text-muted-foreground text-xs">
              Mevcut sürüm: v{appVersion}
            </p>
          )}
        </div>

        {updateState.status === "idle" && (
          <Button variant="outline" size="sm" onClick={handleCheckUpdate}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Güncelleme Kontrol Et
          </Button>
        )}

        {updateState.status === "checking" && (
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-muted-foreground">Kontrol ediliyor...</span>
          </div>
        )}

        {updateState.status === "upToDate" && (
          <div className="space-y-2">
            <p className="text-sm text-emerald-600">
              <CheckCircle className="mr-1 inline h-4 w-4" />
              Güncel sürüm kullanıyorsunuz.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUpdateState({ status: "idle" })}
            >
              Tamam
            </Button>
          </div>
        )}

        {updateState.status === "available" && (
          <div className="space-y-2">
            <p className="text-sm">
              Yeni sürüm mevcut: <strong>v{updateState.version}</strong>
            </p>
            {updateState.body && (
              <p className="text-muted-foreground text-xs">
                {updateState.body}
              </p>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleInstallUpdate}>
                Güncelle
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setUpdateState({ status: "idle" })}
              >
                Daha Sonra
              </Button>
            </div>
          </div>
        )}

        {updateState.status === "downloading" && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              v{updateState.version} indiriliyor...
            </p>
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${updateState.progress}%` }}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              %{updateState.progress}
            </p>
          </div>
        )}

        {updateState.status === "error" && (
          <div className="space-y-2">
            <p className="text-sm text-rose-600">
              <AlertTriangle className="mr-1 inline h-4 w-4" />
              {updateState.error}
            </p>
            <Button variant="outline" size="sm" onClick={handleCheckUpdate}>
              Tekrar Dene
            </Button>
          </div>
        )}
      </Card>

      {/* Import */}
      <Card className="space-y-4 p-4">
        <h3 className="text-sm font-medium">Excel'den İçe Aktar</h3>
        <p className="text-muted-foreground text-xs">
          .xlsx veya .xls dosyasindan islem aktarimi yapar. Mevcut verilere ek
          olarak eklenir.
        </p>

        {importState.step === "idle" && (
          <Button variant="outline" onClick={handlePickFile}>
            <FileUp className="mr-2 h-4 w-4" />
            Dosya Seç
          </Button>
        )}

        {importState.step === "preview" && (
          <div className="space-y-3">
            <div className="flex gap-4 text-sm">
              <span className="text-emerald-600">
                <CheckCircle className="mr-1 inline h-4 w-4" />
                {importState.result.validRows.length} geçerli satır
              </span>
              {importState.result.errors.length > 0 && (
                <span className="text-rose-600">
                  <AlertTriangle className="mr-1 inline h-4 w-4" />
                  {importState.result.errors.length} hatalı satır
                </span>
              )}
            </div>

            {importState.result.validRows.length > 0 && (
              <div className="max-h-56 overflow-auto rounded border p-2 text-xs">
                <table className="w-full">
                  <thead>
                    <tr className="text-muted-foreground border-b text-left">
                      <th className="pr-3 pb-1">Tarih</th>
                      <th className="pr-3 pb-1">Tür</th>
                      <th className="pr-3 pb-1 text-right">Tutar</th>
                      <th className="pr-3 pb-1">Kategori</th>
                      <th className="pb-1">Not</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importState.result.validRows.map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-1 pr-3">{formatDateTR(row.date)}</td>
                        <td className="py-1 pr-3">
                          {row.type === "revenue" ? "Gelir" : "Gider"}
                        </td>
                        <td className="py-1 pr-3 text-right">
                          {formatCurrency(row.amount)}
                        </td>
                        <td className="py-1 pr-3">{row.category}</td>
                        <td className="py-1">{row.note ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {importState.result.errors.length > 0 && (
              <div className="max-h-48 overflow-auto rounded border p-2 text-xs">
                <table className="w-full">
                  <thead>
                    <tr className="text-muted-foreground border-b text-left">
                      <th className="pr-3 pb-1">Satır</th>
                      <th className="pr-3 pb-1">Alan</th>
                      <th className="pb-1">Hata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importState.result.errors.map((err, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-1 pr-3">{err.row}</td>
                        <td className="py-1 pr-3">{err.field}</td>
                        <td className="py-1">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {importState.result.validRows.length > 0 ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleConfirmImport}>
                  {importState.result.validRows.length} satır aktar
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  İptal
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs">
                  Aktarılabilecek geçerli satır bulunamadı.
                </p>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  Kapat
                </Button>
              </div>
            )}
          </div>
        )}

        {importState.step === "importing" && (
          <p className="text-muted-foreground text-sm">Aktarılıyor...</p>
        )}

        {importState.step === "done" && (
          <div className="space-y-2">
            <p className="text-sm text-emerald-600">
              <CheckCircle className="mr-1 inline h-4 w-4" />
              {importState.inserted} işlem başarıyla aktarıldı.
            </p>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              Tamam
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
