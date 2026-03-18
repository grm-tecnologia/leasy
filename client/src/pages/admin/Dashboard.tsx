import { trpc } from "@/lib/trpc";
import { Database, ShoppingCart, Users, DollarSign, ArrowUpRight, Package } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { StatCard, SectionTitle, DonutChart, GradientBarChart, StatusBadge } from "@/components/Charts";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { data: analytics, isLoading } = trpc.analytics.overview.useQuery();
  const { data: recentOrders, isLoading: loadingOrders } = trpc.analytics.recentOrders.useQuery({ limit: 5 });

  // Chart colors for categories
  const categoryColors = [
    "#FF4500", "#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b",
    "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
  ];

  const categoryLabels = analytics?.categoryCounts?.map((c) => c.name) ?? [];
  const categoryData = analytics?.categoryCounts?.map((c) => c.leadCount) ?? [];
  const categoryChartColors = analytics?.categoryCounts?.map((c, i) => c.color ?? categoryColors[i % categoryColors.length]) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="font-mono text-[10px] text-[#FF4500] uppercase tracking-widest mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#FF4500] rounded-full" />
          Painel Administrativo
        </div>
        <h1 className="text-2xl font-light tracking-tight text-white">Dashboard</h1>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#0A0A0A] border border-white/[0.08] p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total de Leads"
            value={(analytics?.totalLeads ?? 0).toLocaleString("pt-BR")}
            icon={Database}
            iconColor="#3b82f6"
          />
          <StatCard
            label="Pedidos Pagos"
            value={String(analytics?.totalOrders ?? 0)}
            icon={ShoppingCart}
            iconColor="#22c55e"
          />
          <StatCard
            label="Receita Total"
            value={`R$ ${((analytics?.totalRevenue ?? 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            iconColor="#FF4500"
          />
          <StatCard
            label="Usuários"
            value={String(analytics?.totalUsers ?? 0)}
            icon={Users}
            iconColor="#f59e0b"
          />
        </div>
      )}

      {/* Two Column Grid: Donut + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads Distribution Donut */}
        <div className="bg-[#0A0A0A] border border-white/[0.08] p-6">
          <SectionTitle title="Distribuição de Leads" />
          {isLoading ? (
            <div className="h-[220px] bg-white/5 animate-pulse rounded" />
          ) : categoryLabels.length > 0 ? (
            <DonutChart
              labels={categoryLabels}
              data={categoryData}
              colors={categoryChartColors}
              centerValue={(analytics?.totalLeads ?? 0).toLocaleString("pt-BR")}
              centerLabel="Total"
            />
          ) : (
            <EmptyState
              icon={Database}
              title="Nenhum lead cadastrado"
              description="Faça upload de leads para ver a distribuição por categoria."
              className="py-6"
            />
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-[#0A0A0A] border border-white/[0.08] p-6">
          <SectionTitle title="Pedidos Recentes" />
          {loadingOrders ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-white/5 animate-pulse" />)}
            </div>
          ) : recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <div key={order.orderId} className="flex items-center justify-between p-3 border border-white/5 hover:border-white/10 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#FF4500]/10 border border-[#FF4500]/20 flex items-center justify-center shrink-0 group-hover:bg-[#FF4500]/15 transition-colors">
                      <ArrowUpRight className="h-3.5 w-3.5 text-[#FF4500]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-200 truncate">
                        {order.userName ?? order.userEmail ?? `Usuário #${order.userId}`}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-600 tracking-widest">
                        {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={order.status} />
                    <span className="text-sm font-mono text-white tabular-nums">
                      R$ {(order.totalCents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="Nenhum pedido ainda"
              description="Quando clientes comprarem leads, os pedidos aparecerão aqui."
              className="py-6"
            />
          )}
        </div>
      </div>

      {/* Bar Chart: Leads per Category */}
      {!isLoading && categoryLabels.length > 0 && (
        <div className="bg-[#0A0A0A] border border-white/[0.08] p-6">
          <SectionTitle title="Leads por Categoria" />
          <GradientBarChart
            labels={categoryLabels}
            data={categoryData}
            gradientFrom="#FF4500"
            gradientTo="#FF6B35"
            height={260}
          />
        </div>
      )}
    </div>
  );
}
