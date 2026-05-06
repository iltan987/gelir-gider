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
import { useReactToPrint } from "react-to-print";
import { EllipsisVertical, FileSpreadsheet, Printer } from "lucide-react";
import { useAnalysis } from "@/hooks/use-analysis";
import { exportPeriod } from "@/services/export";
import type { DateRange } from "@/hooks/use-analysis";
import { REVENUE_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/categories";
import { formatDateTR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/shared/date-input";
import { NoteAutocomplete } from "@/components/shared/note-autocomplete";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";
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

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: () => `Analiz_${dateRange.start}_${dateRange.end}`,
  });

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
      <div className="flex flex-wrap items-center gap-2">
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
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto"
                aria-label="Islemler"
              >
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-auto">
            <DropdownMenuItem
              onClick={() =>
                exportPeriod(dateRange.start, dateRange.end, categoryFilter)
              }
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel'e Aktar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePrint()}>
              <Printer className="mr-2 h-4 w-4" />
              Yazdır
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-44 justify-between font-normal"
                  >
                    <span className="truncate">
                      {categoryFilter === null
                        ? "Tümü"
                        : `${categoryFilter.size} kategori`}
                    </span>
                    <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                  </Button>
                }
              />
              <PopoverContent className="w-56 p-0" align="end">
                <div className="flex gap-1 border-b p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setCategoryFilter(null)}
                  >
                    Tümünü Seç
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setCategoryFilter(new Set())}
                  >
                    Temizle
                  </Button>
                </div>
                <div className="max-h-56 overflow-auto p-2">
                  {ALL_CATEGORIES.map((cat) => {
                    const checked =
                      categoryFilter === null || categoryFilter.has(cat);
                    return (
                      <label
                        key={cat}
                        className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => {
                            if (categoryFilter === null) {
                              const next = new Set(ALL_CATEGORIES);
                              next.delete(cat);
                              setCategoryFilter(next);
                            } else {
                              const next = new Set(categoryFilter);
                              if (next.has(cat)) {
                                next.delete(cat);
                              } else {
                                next.add(cat);
                              }
                              if (next.size === ALL_CATEGORIES.length) {
                                setCategoryFilter(null);
                              } else {
                                setCategoryFilter(next);
                              }
                            }
                          }}
                        />
                        {cat}
                      </label>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">Not</p>
            <NoteAutocomplete
              value={noteFilter}
              onChange={setNoteFilter}
              placeholder="Not ara..."
              className="w-40"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div ref={printRef}>
        <div className="print-report-header">
          <h1>
            Analiz Raporu - {formatDateTR(dateRange.start)} /{" "}
            {formatDateTR(dateRange.end)}
          </h1>
          <p>Yazdırma tarihi: {formatDateTR(new Date())}</p>
        </div>

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
    </div>
  );
}
