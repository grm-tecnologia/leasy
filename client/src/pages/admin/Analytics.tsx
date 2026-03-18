import { trpc } from "@/lib/trpc";
import { BarChart3, Download, TrendingUp, Users, DollarSign, Layers } from "lucide-react";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import { StatCard, SectionTitle, DonutChart, GradientBarChart } from "@/components/Charts";

export default function AdminAnalytics() {
  const { data: analytics, isLoading } = trpc.analytics.overview.useQuery();

  const handleExportReport = () => {
    if (!analytics) return;
    const lines = [
      "RELATÓRIO ANALYTICS - LEADHUB",
      `Data: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`,
      "",
      "RESUMO GERAL",
      `Receita Total: R$ ${((analytics.totalRevenue ?? 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      `Total de Pedidos Pagos: ${analytics.totalOrders ?? 0}`,
      `Total de Leads no Banco: ${(analytics.totalLeads ?? 0).toLocaleString("pt-BR")}`,
      `Total de Categorias: ${analytics.categoryCounts?.length ?? 0}`,
      "",
      "DISTRIBUIÇÃO POR CATEGORIA",
      "Categoria,Leads,Percentual",
    ];
    analytics.categoryCounts?.forEach((cat) => {
      const total = analytics.totalLeads || 1;
      const pct = Math.round((cat.leadCount / total) * 100);
      lines.push(`${cat.name},${cat.leadCount},${pct}%`);
    });
    const csv = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
  };

  // Chart data
  const categoryColors = [
    "#FF4500", "#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b",
    "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
  ];
  const categoryLabels = analytics?.categoryCounts?.map((c) => c.name) ?? [];
  const categoryData = analytics?.categoryCounts?.map((c) => c.leadCount) ?? [];
  const categoryChartColors = analytics?.categoryCounts?.map((c, i) => c.color ?? categoryColors[i % categoryColors.length]) ?? [];

  // Calculate avg order value
  const avgOrderValue = analytics?.totalOrders && analytics.totalOrders > 0
    ? ((analytics.totalRevenue ?? 0) / analytics.totalOrders / 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] text-[#FF4500] uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#FF4500] rounded-full" />
            Métricas
          </div>
          <h1 className="text-2xl font-light tracking-tight text-white">Analytics</h1>
          <p className="text-[10px] font-mono text-zinc-500 mt-2 uppercase tracking-widest">
            Métricas e desempenho da plataforma
          </p>
        </div>
        {analytics && (
          <button onClick={handleExportReport} className="px-4 py-2 text-[10px] uppercase tracking-widest text-zinc-400 border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-2">
            <Download className="h-3.5 w-3.5" />
            Exportar Relatório
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-[#0A0A0A] border border-white/[0.08] animate-pulse" />)}
        </div>
      ) : !analytics ? (
        <EmptyState
          icon={BarChart3}
          title="Dados não disponíveis"
          description="Não foi possível carregar as métricas. Tente novamente em alguns instantes."
        />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Receita Total"
              value={`R$ ${((analytics.totalRevenue ?? 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              icon={DollarSign}
              iconColor="#22c55e"
            />
            <StatCard
              label="Ticket Médio"
              value={`R$ ${avgOrderValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              icon={TrendingUp}
              iconColor="#3b82f6"
            />
            <StatCard
              label="Total de Leads"
              value={(analytics.totalLeads ?? 0).toLocaleString("pt-BR")}
              icon={Users}
              iconColor="#8b5cf6"
            />
            <StatCard
              label="Categorias"
              value={String(analytics.categoryCounts?.length ?? 0)}
              icon={Layers}
              iconColor="#f59e0b"
            />
          </div>

          {/* Two Column: Donut + Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut Chart */}
            <div className="bg-[#0A0A0A] border border-white/[0.08] p-6">
              <SectionTitle title="Distribuição por Categoria" />
              {categoryLabels.length > 0 ? (
                <DonutChart
                  labels={categoryLabels}
                  data={categoryData}
                  colors={categoryChartColors}
                  centerValue={(analytics.totalLeads ?? 0).toLocaleString("pt-BR")}
                  centerLabel="Total"
                />
              ) : (
                <EmptyState
                  icon={BarChart3}
                  title="Nenhum dado"
                  description="Faça upload de leads para ver a distribuição."
                  className="py-8"
                />
              )}
            </div>

            {/* Bar Chart */}
            <div className="bg-[#0A0A0A] border border-white/[0.08] p-6">
              <SectionTitle title="Leads por Categoria" />
              {categoryLabels.length > 0 ? (
                <GradientBarChart
                  labels={categoryLabels}
                  data={categoryData}
                  gradientFrom="#FF4500"
                  gradientTo="#FF6B35"
                  height={220}
                />
              ) : (
                <EmptyState
                  icon={BarChart3}
                  title="Nenhum dado"
                  description="Faça upload de leads para ver o gráfico."
                  className="py-8"
                />
              )}
            </div>
          </div>

          {/* Revenue per Category (if we have order data) */}
          {analytics.totalOrders > 0 && (
            <div className="bg-[#0A0A0A] border border-white/[0.08] p-6">
              <SectionTitle title="Resumo de Vendas" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center p-4 border border-white/5">
                  <p className="text-3xl font-light text-white">{analytics.totalOrders}</p>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-2">Pedidos Pagos</p>
                </div>
                <div className="text-center p-4 border border-white/5">
                  <p className="text-3xl font-light text-white">
                    R$ {((analytics.totalRevenue ?? 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-2">Receita Total</p>
                </div>
                <div className="text-center p-4 border border-white/5">
                  <p className="text-3xl font-light text-white">
                    R$ {avgOrderValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-2">Ticket Médio</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
