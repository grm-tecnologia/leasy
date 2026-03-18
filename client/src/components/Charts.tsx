import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Filler
);

// ─── Stat Card ─────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  iconColor?: string;
  change?: number; // percentage change, e.g. +12.5
  changeLabel?: string;
}

export function StatCard({ label, value, icon: Icon, iconColor = "#FF4500", change, changeLabel }: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change !== undefined && change === 0;

  return (
    <div className="bg-[#0A0A0A] border border-white/[0.08] p-5 hover:border-white/15 transition-all group relative overflow-hidden">
      {/* Subtle glow effect on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(ellipse at top left, ${iconColor}08, transparent 70%)` }}
      />
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${iconColor}15`, border: `1px solid ${iconColor}25` }}
          >
            <Icon className="h-5 w-5" style={{ color: iconColor }} />
          </div>
          <div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em]">{label}</p>
            <p className="text-2xl font-light text-white mt-0.5 tracking-tight">{value}</p>
          </div>
        </div>
        {change !== undefined && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono tracking-wider"
            style={{
              backgroundColor: isPositive ? "#22c55e15" : isNegative ? "#ef444415" : "#71717a15",
              color: isPositive ? "#22c55e" : isNegative ? "#ef4444" : "#71717a",
              border: `1px solid ${isPositive ? "#22c55e25" : isNegative ? "#ef444425" : "#71717a25"}`,
            }}
          >
            {isPositive ? <TrendingUp className="h-3 w-3" /> : isNegative ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            <span>{isPositive ? "+" : ""}{change.toFixed(1)}%</span>
          </div>
        )}
      </div>
      {changeLabel && (
        <p className="text-[9px] font-mono text-zinc-600 mt-2 tracking-widest uppercase relative">{changeLabel}</p>
      )}
    </div>
  );
}

// ─── Section Title ─────────────────────────────────────────
interface SectionTitleProps {
  title: string;
  icon?: LucideIcon;
  accentColor?: string;
  action?: React.ReactNode;
}

export function SectionTitle({ title, icon: Icon, accentColor = "#FF4500", action }: SectionTitleProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 rounded-full" style={{ backgroundColor: accentColor }} />
        <h2 className="text-sm font-medium text-white tracking-wide">{title}</h2>
        {Icon && <Icon className="h-4 w-4 text-zinc-600" />}
      </div>
      {action}
    </div>
  );
}

// ─── Donut Chart ───────────────────────────────────────────
interface DonutChartProps {
  labels: string[];
  data: number[];
  colors: string[];
  centerLabel?: string;
  centerValue?: string;
  height?: number;
}

export function DonutChart({ labels, data, colors, centerLabel, centerValue, height = 220 }: DonutChartProps) {
  const total = data.reduce((a, b) => a + b, 0);

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors,
        borderColor: colors.map((c) => c + "40"),
        borderWidth: 2,
        hoverBorderColor: colors,
        hoverBorderWidth: 3,
        spacing: 3,
        cutout: "70%",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1a1a1a",
        titleColor: "#fff",
        bodyColor: "#a1a1aa",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        padding: 12,
        titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
        bodyFont: { family: "'JetBrains Mono', monospace", size: 10 },
        callbacks: {
          label: (ctx: any) => {
            const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : "0";
            return ` ${ctx.label}: ${ctx.raw.toLocaleString("pt-BR")} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="flex items-center gap-8">
      <div className="relative" style={{ width: height, height }}>
        <Doughnut data={chartData} options={options} />
        {centerLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-light text-white">{centerValue}</span>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">{centerLabel}</span>
          </div>
        )}
      </div>
      <div className="flex-1 space-y-2.5">
        {labels.map((label, i) => {
          const pct = total > 0 ? ((data[i] / total) * 100).toFixed(0) : "0";
          return (
            <div key={label} className="flex items-center justify-between group/item">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i] }} />
                <span className="text-sm text-zinc-400 group-hover/item:text-zinc-200 transition-colors">{label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-zinc-600 tracking-widest">{pct}%</span>
                <span className="text-sm font-mono text-white tabular-nums">{data[i].toLocaleString("pt-BR")}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Bar Chart ─────────────────────────────────────────────
interface BarChartProps {
  labels: string[];
  data: number[];
  gradientFrom?: string;
  gradientTo?: string;
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
}

export function GradientBarChart({ labels, data, gradientFrom = "#FF4500", gradientTo = "#FF6B35", height = 280, valuePrefix = "", valueSuffix = "" }: BarChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return gradientFrom;
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, gradientFrom + "90");
          gradient.addColorStop(1, gradientTo);
          return gradient;
        },
        borderColor: gradientTo,
        borderWidth: 0,
        borderRadius: 4,
        borderSkipped: false,
        maxBarThickness: 40,
        hoverBackgroundColor: gradientTo,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1a1a1a",
        titleColor: "#fff",
        bodyColor: "#a1a1aa",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        padding: 12,
        titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
        bodyFont: { family: "'JetBrains Mono', monospace", size: 10 },
        callbacks: {
          label: (ctx: any) => ` ${valuePrefix}${ctx.raw.toLocaleString("pt-BR")}${valueSuffix}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#52525b",
          font: { family: "'JetBrains Mono', monospace", size: 10 },
          maxRotation: 45,
        },
      },
      y: {
        grid: {
          color: "rgba(255,255,255,0.04)",
          drawBorder: false,
        },
        border: { display: false },
        ticks: {
          color: "#52525b",
          font: { family: "'JetBrains Mono', monospace", size: 10 },
          callback: (value: any) => `${valuePrefix}${value.toLocaleString("pt-BR")}${valueSuffix}`,
        },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options as any} />
    </div>
  );
}

// ─── Filter Pills ──────────────────────────────────────────
interface FilterPillsProps {
  options: { label: string; value: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
  accentColor?: string;
}

export function FilterPills({ options, value, onChange, accentColor = "#FF4500" }: FilterPillsProps) {
  return (
    <div className="flex items-center gap-1.5">
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-all border"
            style={{
              backgroundColor: isActive ? `${accentColor}15` : "transparent",
              borderColor: isActive ? `${accentColor}40` : "rgba(255,255,255,0.08)",
              color: isActive ? accentColor : "#71717a",
            }}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className="ml-1.5 opacity-60">{opt.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────
interface StatusBadgeProps {
  status: string;
  statusMap?: Record<string, { label: string; color: string }>;
}

const defaultStatusMap: Record<string, { label: string; color: string }> = {
  paid: { label: "Pago", color: "#22c55e" },
  pending: { label: "Pendente", color: "#f59e0b" },
  processing: { label: "Processando", color: "#3b82f6" },
  cancelled: { label: "Cancelado", color: "#ef4444" },
  failed: { label: "Falhou", color: "#ef4444" },
  refunded: { label: "Reembolsado", color: "#71717a" },
};

export function StatusBadge({ status, statusMap = defaultStatusMap }: StatusBadgeProps) {
  const s = statusMap[status] ?? { label: status, color: "#71717a" };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest"
      style={{
        backgroundColor: `${s.color}15`,
        color: s.color,
        border: `1px solid ${s.color}30`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
      {s.label}
    </span>
  );
}
