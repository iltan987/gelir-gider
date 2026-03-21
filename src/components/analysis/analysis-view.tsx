import { useState, useRef } from "react";
import {
  format,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  startOfMonth,
  startOfYear,
} from "date-fns";
import { useAnalysis } from "@/hooks/use-analysis";
import type { DateRange } from "@/hooks/use-analysis";
import { REVENUE_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/shared/date-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { PeriodChart } from "./period-chart";
import { PeriodMetrics } from "./period-metrics";
import { CategoryBreakdown } from "./category-breakdown";
import { AnalysisTable } from "./analysis-table";

const ALL_CATEGORIES = [
  ...new Set([...REVENUE_CATEGORIES, ...EXPENSE_CATEGORIES]),
].sort();

type DateFilterMode = "within_last" | "between";
type DateUnit = "days" | "weeks" | "months" | "years";

const DATE_UNITS: Array<{ value: DateUnit; label: string }> = [
  { value: "days", label: "gün" },
  { value: "weeks", label: "hafta" },
  { value: "months", label: "ay" },
  { value: "years", label: "yıl" },
];

const FILTER_MODES: Array<{ value: DateFilterMode; label: string }> = [
  { value: "within_last", label: "Son" },
  { value: "between", label: "Aralık" },
];

interface Preset {
  label: string;
  filter: { mode: DateFilterMode; amount: number; unit: DateUnit };
  getRange: () => DateRange;
}

const PRESETS: Preset[] = [
  {
    label: "Bu Ay",
    filter: { mode: "between", amount: 1, unit: "months" },
    getRange: () => {
      const now = new Date();
      return {
        start: format(startOfMonth(now), "yyyy-MM-dd"),
        end: format(now, "yyyy-MM-dd"),
      };
    },
  },
  {
    label: "Son 1 Ay",
    filter: { mode: "within_last", amount: 1, unit: "months" },
    getRange: () => ({
      start: format(subMonths(new Date(), 1), "yyyy-MM-dd"),
      end: format(new Date(), "yyyy-MM-dd"),
    }),
  },
  {
    label: "Son 3 Ay",
    filter: { mode: "within_last", amount: 3, unit: "months" },
    getRange: () => ({
      start: format(subMonths(new Date(), 3), "yyyy-MM-dd"),
      end: format(new Date(), "yyyy-MM-dd"),
    }),
  },
  {
    label: "Son 6 Ay",
    filter: { mode: "within_last", amount: 6, unit: "months" },
    getRange: () => ({
      start: format(subMonths(new Date(), 6), "yyyy-MM-dd"),
      end: format(new Date(), "yyyy-MM-dd"),
    }),
  },
  {
    label: "Son 12 Ay",
    filter: { mode: "within_last", amount: 12, unit: "months" },
    getRange: () => ({
      start: format(subMonths(new Date(), 12), "yyyy-MM-dd"),
      end: format(new Date(), "yyyy-MM-dd"),
    }),
  },
  {
    label: "Bu Yıl",
    filter: { mode: "between", amount: 1, unit: "months" },
    getRange: () => ({
      start: format(startOfYear(new Date()), "yyyy-MM-dd"),
      end: format(new Date(), "yyyy-MM-dd"),
    }),
  },
];

function computeRange(
  mode: DateFilterMode,
  amount: number,
  unit: DateUnit,
  betweenStart: string,
  betweenEnd: string,
): DateRange {
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const subtractor = {
    days: subDays,
    weeks: subWeeks,
    months: subMonths,
    years: subYears,
  };
  const sub = subtractor[unit];

  switch (mode) {
    case "within_last":
      return { start: format(sub(now, amount), "yyyy-MM-dd"), end: today };
    case "between":
      return { start: betweenStart, end: betweenEnd };
  }
}

function TriggerLabel({ children }: { children: React.ReactNode }) {
  return (
    <span data-slot="select-value" className="flex flex-1 text-left">
      {children}
    </span>
  );
}

export function AnalysisView() {
  const {
    categoryFilter,
    noteFilter,
    isLoading,
    transactions,
    analysis,
    dateRange,
    setDateRange,
    setCategoryFilter,
    setNoteFilter,
  } = useAnalysis();

  const [activePreset, setActivePreset] = useState<number>(0);
  const [filterMode, setFilterMode] = useState<DateFilterMode>("between");
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState<DateUnit>("months");
  const [betweenStart, setBetweenStart] = useState(dateRange.start);
  const [betweenEnd, setBetweenEnd] = useState(dateRange.end);
  const [showTable, setShowTable] = useState(
    () => localStorage.getItem("analysis-show-table") !== "false",
  );
  const tableRef = useRef<HTMLDivElement>(null);

  function applyPreset(index: number) {
    const preset = PRESETS[index];
    const range = preset.getRange();
    setActivePreset(index);
    setFilterMode(preset.filter.mode);
    setAmount(preset.filter.amount);
    setUnit(preset.filter.unit);
    setBetweenStart(range.start);
    setBetweenEnd(range.end);
    setDateRange(range);
  }

  function applyCustomFilter() {
    setActivePreset(-1);
    setDateRange(
      computeRange(filterMode, amount, unit, betweenStart, betweenEnd),
    );
  }

  return (
    <div className="space-y-4">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset, i) => (
          <Button
            key={preset.label}
            variant={activePreset === i ? "default" : "outline"}
            size="sm"
            onClick={() => applyPreset(i)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Custom date filter */}
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <p className="text-muted-foreground mb-1 text-xs">Filtre</p>
          <Select
            value={filterMode}
            onValueChange={(v) => {
              if (v !== null) setFilterMode(v as DateFilterMode);
            }}
          >
            <SelectTrigger className="w-28">
              <TriggerLabel>
                {FILTER_MODES.find((m) => m.value === filterMode)?.label}
              </TriggerLabel>
            </SelectTrigger>
            <SelectContent>
              {FILTER_MODES.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filterMode !== "between" ? (
          <>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">Miktar</p>
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                className="w-20"
              />
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">Birim</p>
              <Select
                value={unit}
                onValueChange={(v) => {
                  if (v !== null) setUnit(v as DateUnit);
                }}
              >
                <SelectTrigger className="w-24">
                  <TriggerLabel>
                    {DATE_UNITS.find((u) => u.value === unit)?.label}
                  </TriggerLabel>
                </SelectTrigger>
                <SelectContent>
                  {DATE_UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">Başlangıç</p>
              <DateInput value={betweenStart} onChange={setBetweenStart} />
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">Bitiş</p>
              <DateInput value={betweenEnd} onChange={setBetweenEnd} />
            </div>
          </>
        )}

        <Button size="sm" onClick={applyCustomFilter}>
          Uygula
        </Button>

        <div className="ml-auto flex items-end gap-2">
          <div>
            <p className="text-muted-foreground mb-1 text-xs">Kategori</p>
            <Select
              value={categoryFilter ?? "__all__"}
              onValueChange={(v) => {
                if (v === null) return;
                setCategoryFilter(v === "__all__" ? null : v);
              }}
            >
              <SelectTrigger className="w-44">
                <TriggerLabel>{categoryFilter ?? "Tümü"}</TriggerLabel>
              </SelectTrigger>
              <SelectContent className="max-w-60">
                <SelectItem value="__all__">Tümü</SelectItem>
                {ALL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">Not</p>
            <Input
              type="text"
              placeholder="Not ara..."
              value={noteFilter}
              onChange={(e) => setNoteFilter(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div
        className={`space-y-4 ${isLoading ? "opacity-50 transition-opacity" : "transition-opacity"}`}
      >
        <PeriodChart analysis={analysis} />
        <PeriodMetrics analysis={analysis} />
        <CategoryBreakdown transactions={transactions} />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const next = !showTable;
              setShowTable(next);
              localStorage.setItem("analysis-show-table", String(next));
              if (next) {
                requestAnimationFrame(() => {
                  tableRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                  });
                });
              }
            }}
          >
            {showTable ? "İşlemleri Gizle" : "İşlemleri Göster"}
          </Button>
        </div>
        {showTable && (
          <div ref={tableRef}>
            <AnalysisTable transactions={transactions} />
          </div>
        )}
      </div>
    </div>
  );
}
