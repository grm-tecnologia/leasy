import { trpc } from "@/lib/trpc";
import { History, ArrowRight, ShoppingBag, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/components/Pagination";
import { FilterPills, StatusBadge } from "@/components/Charts";

export default function MyOrders() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const pageSize = 10;
  const { data, isLoading } = trpc.orders.myOrders.useQuery({ page, pageSize });
  const [, setLocation] = useLocation();

  const allOrders = data?.orders ?? [];
  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return allOrders;
    return allOrders.filter((o: any) => o.status === statusFilter);
  }, [allOrders, statusFilter]);

  const paidCount = allOrders.filter((o: any) => o.status === "paid").length;
  const pendingCount = allOrders.filter((o: any) => o.status === "pending").length;
  const otherCount = allOrders.length - paidCount - pendingCount;

  const totalOrders = data?.total ?? 0;
  const totalPages = Math.ceil(totalOrders / pageSize);

  const filterOptions = [
    { label: "Todos", value: "all", count: allOrders.length },
    { label: "Pagos", value: "paid", count: paidCount },
    { label: "Pendentes", value: "pending", count: pendingCount },
    { label: "Outros", value: "other", count: otherCount },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[10px] text-[#FF4500] uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#FF4500] rounded-full" />
            Histórico
          </div>
          <h1 className="text-2xl font-light tracking-tight text-white">Meus Pedidos</h1>
        </div>
      </div>

      {/* Quick Stats */}
      {!isLoading && allOrders.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#0A0A0A] border border-white/[0.08] p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Pagos</p>
              <p className="text-lg font-light text-white tabular-nums">{paidCount}</p>
            </div>
          </div>
          <div className="bg-[#0A0A0A] border border-white/[0.08] p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Pendentes</p>
              <p className="text-lg font-light text-white tabular-nums">{pendingCount}</p>
            </div>
          </div>
          <div className="bg-[#0A0A0A] border border-white/[0.08] p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Outros</p>
              <p className="text-lg font-light text-white tabular-nums">{otherCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {!isLoading && allOrders.length > 0 && (
        <div className="bg-[#0A0A0A] border border-white/[0.08] p-3">
          <FilterPills options={filterOptions} value={statusFilter} onChange={setStatusFilter} />
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-[#0A0A0A] border border-white/[0.08] animate-pulse" />)}
        </div>
      )}

      {!isLoading && data && allOrders.length === 0 && (
        <EmptyState
          icon={ShoppingBag}
          title="Nenhum pedido realizado"
          description="Você ainda não comprou nenhuma lista de leads. Explore nossas categorias e encontre os leads ideais para o seu negócio."
          actionLabel="Explorar Leads"
          onAction={() => setLocation("/explore")}
        />
      )}

      {!isLoading && filteredOrders.length > 0 && (
        <>
          <div className="bg-[#0A0A0A] border border-white/[0.08]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Pedido</th>
                    <th className="text-left p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Data</th>
                    <th className="text-left p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Status</th>
                    <th className="text-right p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Valor</th>
                    <th className="text-right p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order: any) => (
                    <tr
                      key={order.id}
                      className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => setLocation(`/orders/${order.id}`)}
                    >
                      <td className="p-4">
                        <span className="text-sm font-mono text-zinc-300">#{order.id}</span>
                      </td>
                      <td className="p-4 text-zinc-500 text-[10px] font-mono tracking-widest">
                        {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="p-4 text-right text-sm font-mono text-white tabular-nums">
                        R$ {(order.totalCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right">
                        <ArrowRight className="h-3.5 w-3.5 text-zinc-600 hover:text-[#FF4500] transition-colors inline-block" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalOrders}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
