import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/stores/app-store";
import type { View } from "@/types";

const VIEW_LABELS: Record<View, string> = {
  daily: "Günlük",
  analysis: "Analiz",
  filter: "Filtre",
  settings: "Ayarlar",
};

const VIEWS: View[] = ["daily", "analysis", "filter", "settings"];

export function NavBar() {
  const activeView = useAppStore((s) => s.activeView);
  const setView = useAppStore((s) => s.setView);

  return (
    <Tabs
      value={activeView}
      onValueChange={(v) => setView(v as View)}
      className="w-full print:hidden"
    >
      <TabsList className="w-full">
        {VIEWS.map((view) => (
          <TabsTrigger key={view} value={view} className="flex-1">
            {VIEW_LABELS[view]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
