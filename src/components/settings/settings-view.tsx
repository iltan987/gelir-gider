import { useState } from "react";
import { FileUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTR, formatCurrency } from "@/lib/format";
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
  const [importState, setImportState] = useState<ImportState>({ step: "idle" });

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

      <Card className="space-y-4 p-4">
        <h3 className="text-sm font-medium">Excel'den İçe Aktar</h3>
        <p className="text-muted-foreground text-xs">
          .xlsx veya .xls dosyasından işlem aktarımı yapar. Mevcut verilere ek
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
