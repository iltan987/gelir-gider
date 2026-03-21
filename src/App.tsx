import "./App.css";
import { DbProvider } from "@/providers/db-provider";
import { NavBar } from "@/components/shared/nav-bar";
import { useAppStore } from "@/stores/app-store";

function ViewRouter() {
  const activeView = useAppStore((s) => s.activeView);

  switch (activeView) {
    case "daily":
      return <PlaceholderView name="Günlük" />;
    case "analysis":
      return <PlaceholderView name="Analiz" />;
    case "filter":
      return <PlaceholderView name="Filtre" />;
    case "settings":
      return <PlaceholderView name="Ayarlar" />;
  }
}

function PlaceholderView({ name }: { name: string }) {
  return (
    <div className="text-muted-foreground flex flex-1 items-center justify-center">
      {name} görünümü henüz hazır değil
    </div>
  );
}

function App() {
  return (
    <DbProvider>
      <div className="flex h-screen flex-col">
        <header className="border-b p-2">
          <NavBar />
        </header>
        <main className="flex-1 overflow-auto p-4">
          <ViewRouter />
        </main>
      </div>
    </DbProvider>
  );
}

export default App;
