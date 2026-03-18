import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Database, DollarSign, ShoppingCart, TrendingUp,
  ArrowRight, Package, Clock, CheckCircle2, AlertCircle,
  Heart, Zap, Star,
} from "lucide-react";
import { StatCard, SectionTitle, DonutChart, GradientBarChart, StatusBadge } from "@/components/Charts";
import LucideIcon from "@/components/LucideIcon";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
} from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip);

const CHART_COLORS = [
  "#FF4500", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

export default function ClientDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: metrics, isLoading } = trpc.clientDashboard.metrics.useQuery();
  const { data: favs } = trpc.favorites.list.useQuery();

  const totalLeads = metrics?.totalLeadsBought ?? 0;
  const totalSpent = metrics?.totalSpent ?? 0;
  const totalOrders = metrics?.totalOrders ?? 0;
  const paidOrders = metrics?.paidOrders ?? 0;
  const pendingOrders = metrics?.pendingOrders ?? 0;
  const conversionRate = totalOrders > 0 ? ((paidOrders / totalOrders) * 100) : 0;

  // Category breakdown for donut
  const catLabels = metrics?.categoryBreakdown?.map((c: any) => c.categoryName ?? "Sem nome") ?? [];
  const catData = metrics?.categoryBreakdown?.map((c: any) => Number(c.totalLeads) || 0) ?? [];
  const catColors = metrics?.categoryBreakdown?.map((c: any, i: number) => c.categoryColor || CHART_COLORS[i % CHART_COLORS.length]) ?? [];

  // Data processing moved after loading check below

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/5 animate-pulse rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-[#0A0A0A] border border-white/[0.08] animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="h-80 bg-[#0A0A0A] border border-white/[0.08] animate-pulse" />)}
        </div>
      </div>
    );
  }

  // Monthly spending for line chart (safely handle different result formats from db.execute)
  const monthlyData = Array.isArray(metrics?.monthlySpending) ? metrics.monthlySpending : [];
  const monthLabels = monthlyData.map((m: any) => {
    try {
      const monthStr = String(m.month || "");
      if (!monthStr || !monthStr.includes("-")) return monthStr;
      const [year, mo] = monthStr.split("-");
      const date = new Date(Number(year), Number(mo) - 1);
      return format(date, "MMM yy", { locale: ptBR });
    } catch { return String(m.month || ""); }
  });
  const monthData = monthlyData.map((m: any) => Number(m.total || 0) / 100);
  const monthOrders = monthlyData.map((m: any) => Number(m.orderCount || 0));

  // Spending bar chart data
  const catSpentLabels = metrics?.categoryBreakdown?.map((c: any) => c.categoryName ?? "Sem nome") ?? [];
  const catSpentData = metrics?.categoryBreakdown?.map((c: any) => Number(c.totalSpent) / 100) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative bg-[#050505] border border-white/[0.08] p-6 md:p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF4500]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] text-[#FF4500] uppercase tracking-widest mb-2 flex items-center gap-2">
              <Zap className="h-3 w-3" />
              Meu Painel
            </div>
            <h1 className="text-2xl font-light tracking-tight text-white">
              Olá, {user?.name?.split(" ")[0] ?? "Usuário"}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">Acompanhe suas compras de leads e métricas de desempenho.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/explore")}
              className="flex items-center gap-2 px-4 py-2 bg-[#FF4500] text-white text-xs font-mono uppercase tracking-widest hover:bg-[#FF4500]/90 transition-colors"
            >
              <Database className="h-3.5 w-3.5" />
              Explorar Leads
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Leads Comprados"
          value={totalLeads.toLocaleString("pt-BR")}
          icon={Database}
          iconColor="#3b82f6"
        />
        <StatCard
          label="Total Investido"
          value={`R$ ${(totalSpent / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          iconColor="#22c55e"
        />
        <StatCard
          label="Pedidos Realizados"
          value={totalOrders.toLocaleString("pt-BR")}
          icon={ShoppingCart}
          iconColor="#f59e0b"
        />
        <StatCard
          label="Taxa de Conversão"
          value={`${conversionRate.toFixed(1)}%`}
          icon={TrendingUp}
          iconColor="#FF4500"
          changeLabel={`${paidOrders} pagos de ${totalOrders} pedidos`}
        />
      </div>

      {/* Favorites Section */}
      {favs && favs.length > 0 && (
        <div className="bg-[#0A0A0A] border border-white/[0.08] p-5">
          <SectionTitle
            title="Categorias Favoritas"
            icon={Heart}
            action={
              <button
                onClick={() => setLocation("/explore")}
                className="text-[10px] font-mono text-[#FF4500] uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                Ver Todas <ArrowRight className="h-3 w-3" />
              </button>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-1">
            {favs.slice(0, 6).map((fav: any) => (
              <div
                key={fav.id}
                className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.06] hover:border-white/10 transition-all cursor-pointer group"
                onClick={() => setLocation(`/explore/${fav.categorySlug}`)}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${fav.categoryColor ?? "#FF4500"}15` }}
                >
                  <LucideIcon
                    name={fav.categoryIcon ?? "FolderOpen"}
                    className="h-4 w-4"
                    style={{ color: fav.categoryColor ?? "#FF4500" }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate group-hover:text-[#FF4500] transition-colors">{fav.categoryName}</p>
                  <p className="text-[10px] font-mono text-zinc-600 tracking-widest">
                    {(fav.categoryLeadCount ?? 0).toLocaleString("pt-BR")} leads
                  </p>
                </div>
                <Heart className="h-3.5 w-3.5 text-[#FF4500] fill-current shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Breakdown Donut */}
        <div className="bg-[#0A0A0A] border border-white/[0.08] p-5">
          <SectionTitle title="Leads por Categoria" icon={Database} />
          {catLabels.length > 0 ? (
            <DonutChart
              labels={catLabels}
              data={catData}
              colors={catColors}
              centerLabel="Total"
              centerValue={totalLeads.toLocaleString("pt-BR")}
              height={200}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-10 w-10 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-500">Nenhuma compra realizada ainda</p>
              <button
                onClick={() => setLocation("/explore")}
                className="mt-3 text-[10px] font-mono text-[#FF4500] uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                Explorar Leads <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Monthly Spending Line Chart */}
        <div className="bg-[#0A0A0A] border border-white/[0.08] p-5">
          <SectionTitle title="Investimento Mensal" icon={TrendingUp} />
          {monthLabels.length > 0 && monthData.some((v: number) => v > 0) ? (
            <div style={{ height: 240 }}>
              <Line
                data={{
                  labels: monthLabels,
                  datasets: [
                    {
                      data: monthData,
                      borderColor: "#FF4500",
                      backgroundColor: (context: any) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return "rgba(255,69,0,0.1)";
                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, "rgba(255,69,0,0.25)");
                        gradient.addColorStop(1, "rgba(255,69,0,0.02)");
                        return gradient;
                      },
                      fill: true,
                      tension: 0.4,
                      pointRadius: 4,
                      pointBackgroundColor: "#FF4500",
                      pointBorderColor: "#0A0A0A",
                      pointBorderWidth: 2,
                      pointHoverRadius: 6,
                    },
                  ],
                }}
                options={{
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
                          const orderCount = monthOrders[ctx.dataIndex] ?? 0;
                          return [
                            ` R$ ${ctx.raw.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                            ` ${orderCount} pedido${orderCount !== 1 ? "s" : ""}`,
                          ];
                        },
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
                      },
                    },
                    y: {
                      min: 0,
                      grid: { color: "rgba(255,255,255,0.04)" },
                      border: { display: false },
                      ticks: {
                        color: "#52525b",
                        font: { family: "'JetBrains Mono', monospace", size: 10 },
                        callback: (value: any) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                      },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="h-10 w-10 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-500">Dados de investimento aparecerão aqui</p>
            </div>
          )}
        </div>
      </div>

      {/* Second Row: Spending by Category + Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Spending by Category Bar Chart */}
        <div className="bg-[#0A0A0A] border border-white/[0.08] p-5">
          <SectionTitle title="Investimento por Categoria" icon={DollarSign} />
          {catSpentLabels.length > 0 ? (
            <GradientBarChart
              labels={catSpentLabels}
              data={catSpentData}
              height={220}
              valuePrefix="R$ "
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign className="h-10 w-10 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-500">Sem dados de investimento</p>
            </div>
          )}
        </div>

        {/* Conversion Funnel */}
        <div className="bg-[#0A0A0A] border border-white/[0.08] p-5">
          <SectionTitle title="Funil de Conversão" icon={TrendingUp} />
          <div className="space-y-3 mt-2">
            <FunnelStep
              label="Pedidos Criados"
              value={totalOrders}
              percentage={totalOrders > 0 ? 100 : 0}
              icon={ShoppingCart}
              color="#3b82f6"
            />
            <FunnelStep
              label="Pedidos Pagos"
              value={paidOrders}
              percentage={totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0}
              icon={CheckCircle2}
              color="#22c55e"
            />
            <FunnelStep
              label="Pendentes"
              value={pendingOrders}
              percentage={totalOrders > 0 ? (pendingOrders / totalOrders) * 100 : 0}
              icon={Clock}
              color="#f59e0b"
            />
            <FunnelStep
              label="Cancelados / Outros"
              value={Math.max(0, totalOrders - paidOrders - pendingOrders)}
              percentage={totalOrders > 0 ? (Math.max(0, totalOrders - paidOrders - pendingOrders) / totalOrders) * 100 : 0}
              icon={AlertCircle}
              color="#ef4444"
            />
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-[#0A0A0A] border border-white/[0.08] p-5">
        <SectionTitle
          title="Pedidos Recentes"
          icon={ShoppingCart}
          action={
            totalOrders > 0 ? (
              <button
                onClick={() => setLocation("/orders")}
                className="text-[10px] font-mono text-[#FF4500] uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                Ver Todos <ArrowRight className="h-3 w-3" />
              </button>
            ) : undefined
          }
        />
        {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 pr-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Pedido</th>
                  <th className="text-left py-3 pr-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Data</th>
                  <th className="text-left py-3 pr-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Status</th>
                  <th className="text-right py-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Valor</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentOrders.map((order: any) => (
                  <tr
                    key={order.orderId}
                    className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setLocation(`/orders/${order.orderId}`)}
                  >
                    <td className="py-3 pr-4">
                      <span className="text-sm font-mono text-zinc-300">#{order.orderId}</span>
                    </td>
                    <td className="py-3 pr-4 text-zinc-500 text-[10px] font-mono tracking-widest">
                      {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3 text-right text-sm font-mono text-white tabular-nums">
                      R$ {(order.totalCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShoppingCart className="h-10 w-10 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500">Nenhum pedido realizado ainda</p>
            <button
              onClick={() => setLocation("/explore")}
              className="mt-3 text-[10px] font-mono text-[#FF4500] uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              Explorar Leads <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Funnel Step Component ──────────────────────────────────
function FunnelStep({
  label,
  value,
  percentage,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  percentage: number;
  icon: typeof ShoppingCart;
  color: string;
}) {
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2.5">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="h-3.5 w-3.5" style={{ color }} />
          </div>
          <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-zinc-600 tracking-widest">{percentage.toFixed(0)}%</span>
          <span className="text-sm font-mono text-white tabular-nums">{value}</span>
        </div>
      </div>
      <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.max(percentage, 2)}%`,
            backgroundColor: color,
            opacity: 0.7,
          }}
        />
      </div>
    </div>
  );
}
