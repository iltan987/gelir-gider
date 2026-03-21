import { Settings } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app-store";
import type { View } from "@/types";

const TABS: Array<{ value: View; label: string }> = [
  { value: "daily", label: "Günlük" },
  { value: "analysis", label: "Analiz" },
];

export function NavBar() {
  const activeView = useAppStore((s) => s.activeView);
  const setView = useAppStore((s) => s.setView);

  return (
    <div className="flex items-center gap-2 print:hidden">
      <Tabs
        value={activeView === "settings" ? undefined : activeView}
        onValueChange={(v) => setView(v as View)}
        className="flex-1"
      >
        <TabsList className="w-full">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-1">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Button
        variant={activeView === "settings" ? "default" : "ghost"}
        size="icon"
        className="group"
        onClick={() => setView("settings")}
        aria-label="Ayarlar"
      >
        <Settings className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
      </Button>
    </div>
  );
}
