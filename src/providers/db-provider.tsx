import { useState, useEffect, type ReactNode } from "react";
import { getDb } from "@/services/db";
import {
  runStartupBackups,
  startPeriodicBackup,
  stopPeriodicBackup,
} from "@/services/auto-backup";

interface DbProviderProps {
  children: ReactNode;
}

export function DbProvider({ children }: DbProviderProps) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await getDb();
        await runStartupBackups();
        startPeriodicBackup();
        if (!cancelled) setReady(true);
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    }

    init();
    return () => {
      cancelled = true;
      stopPeriodicBackup();
    };
  }, []);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-8">
        <div className="text-destructive text-center">
          <p className="text-lg font-semibold">Veritabanı bağlantı hatası</p>
          <p className="text-muted-foreground mt-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  return <>{children}</>;
}
