import { useEffect } from "react";
import "./App.css";
import { DbProvider } from "@/providers/db-provider";
import { NavBar } from "@/components/shared/nav-bar";
import { useAppStore } from "@/stores/app-store";
import { DailyView } from "@/components/daily/daily-view";
import { AnalysisView } from "@/components/analysis/analysis-view";
import { SettingsView } from "@/components/settings/settings-view";

function ViewRouter() {
  const activeView = useAppStore((s) => s.activeView);

  switch (activeView) {
    case "daily":
      return <DailyView />;
    case "analysis":
      return <AnalysisView />;
    case "settings":
      return <SettingsView />;
  }
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    function apply() {
      const isDark =
        theme === "dark" ||
        (theme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", isDark);
    }

    apply();

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);

  return <>{children}</>;
}

function App() {
  return (
    <DbProvider>
      <ThemeProvider>
        <div className="app-shell flex h-screen flex-col">
          <header className="border-b p-2">
            <NavBar />
          </header>
          <main className="flex-1 overflow-auto p-4">
            <ViewRouter />
          </main>
        </div>
      </ThemeProvider>
    </DbProvider>
  );
}

export default App;
