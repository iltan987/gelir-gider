import { useEffect, useRef } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency, formatDateTR } from "@/lib/format";
import type { PeriodAnalysis } from "@/types";

interface PeriodChartProps {
  analysis: PeriodAnalysis;
}

function formatYAxis(kurusValue: number): string {
  const tl = kurusValue / 100;
  if (Math.abs(tl) >= 1000) {
    return `${(tl / 1000).toFixed(0)}k`;
  }
  return tl.toFixed(0);
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload || !label) return null;

  return (
    <div className="bg-popover text-popover-foreground rounded-md border p-2 text-sm shadow-md">
      <p className="mb-1 font-medium">{formatDateTR(label, "d MMM yyyy")}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function PeriodChart({ analysis }: PeriodChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // A4 portrait with 15mm margins = 180mm printable width ~ 680px at 96dpi
    const printWidth = 680;
    const scale = Math.min(1, printWidth / el.offsetWidth);
    el.style.setProperty("--print-scale", String(scale));
    el.style.setProperty("--print-height", `${Math.round(350 * scale)}px`);
  });

  if (analysis.dailyBreakdown.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Bu dönem için veri bulunamadı.
      </p>
    );
  }

  const data = analysis.dailyBreakdown.map((d) => ({
    date: d.date,
    Gelir: d.revenue,
    Gider: d.expense,
    Net: d.net,
  }));

  return (
    <div
      ref={containerRef}
      className="print-chart-container"
      style={{ width: "100%", height: 350 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => formatDateTR(d, "d MMM")}
            fontSize={12}
          />
          <YAxis tickFormatter={formatYAxis} fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="Gelir" fill="#10b981" radius={[2, 2, 0, 0]} />
          <Bar dataKey="Gider" fill="#f43f5e" radius={[2, 2, 0, 0]} />
          <Line
            type="monotone"
            dataKey="Net"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
