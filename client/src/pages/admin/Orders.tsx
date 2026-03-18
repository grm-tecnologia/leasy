import { trpc } from "@/lib/trpc";
import { ShoppingCart, Download, Search } from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/components/Pagination";
import { SectionTitle, FilterPills, StatusBadge } from "@/components/Charts";

const orderStatusMap: Record<string, { label: string; color: string }> = {
  paid: { label: "Pago", color: "#22c55e" },
  pending: { label: "Pendente", color: "#f59e0b" },
  cancelled: { label: "Cancelado", color: "#ef4444" },
  failed: { label: "Falhou", color: "#ef4444" },
  refunded: { label: "Reembolsado", color: "#71717a" },
};

export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const pageSize = 20;
  const { data: orders, isLoading } = trpc.orders.adminList.useQuery({ page, pageSize });

  // Filter orders client-side
  const filteredOrders = useMemo(() => {
    if (!orders?.orders) return [];
    let filtered = orders.orders;
    if (statusFilter !== "all") {
      filtered = filtered.filter((o: any) => o.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter((o: any) =>
        (o.userName ?? "").toLowerCase().includes(q) ||
        (o.userEmail ?? "").toLowerCase().includes(q) ||
        String(o.id).includes(q)
      );
    }
    return filtered;
  }, [orders, statusFilter, searchTerm]);

  const filterOptions = [
    { label: "Todos", value: "all" },
    { label: "Pago", value: "paid" },
    { label: "Pendente", value: "pending" },
    { label: "Cancelado", value: "cancelled" },
  ];

  const handleExportCSV = () => {
    if (!orders?.orders?.length) return;
    const headers = ["Pedido", "Usuário", "E-mail", "Status", "Leads", "Valor (R$)", "Data"];
    const rows = orders.orders.map((o: any) => [
      `#${o.id}`,
      o.userName ?? "-",
      o.userEmail ?? "-",
      orderStatusMap[o.status]?.label ?? o.status,
      o.totalLeads ?? "-",
      (o.totalCents / 100).toFixed(2),
      format(new Date(o.createdAt), "dd/MM/yyyy HH:mm"),
    ].map(v => {
      const str = String(v);
      if (str.includes(",") || str.includes('"')) return `"${str.replace(/"/g, '""')}"`;
      return str;
    }).join(","));
    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pedidos-pagina-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
  };

  const totalOrders = orders?.total ?? 0;
  const totalPages = Math.ceil(totalOrders / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] text-[#FF4500] uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#FF4500] rounded-full" />
            Vendas
          </div>
          <h1 className="text-2xl font-light tracking-tight text-white">Pedidos</h1>
        </div>
        <div className="flex items-center gap-3">
          {totalOrders > 0 && (
            <span className="text-[10px] font-mono text-zinc-600 tracking-widest">
              Mostrando <span className="text-zinc-400">{filteredOrders.length}</span> de {totalOrders} pedidos
            </span>
          )}
          {orders?.orders?.length ? (
            <button onClick={handleExportCSV} className="px-4 py-2 text-[10px] uppercase tracking-widest text-zinc-400 border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-2">
              <Download className="h-3.5 w-3.5" />
              Exportar
            </button>
          ) : null}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-[#0A0A0A] border border-white/[0.08] p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
            <input
              type="text"
              placeholder="Buscar por ID, nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border border-white/[0.08] pl-9 pr-4 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-[#FF4500]/30 transition-colors font-mono text-xs"
            />
          </div>
          <FilterPills options={filterOptions} value={statusFilter} onChange={setStatusFilter} />
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 bg-[#0A0A0A] border border-white/[0.08] animate-pulse" />)}
        </div>
      )}

      {!isLoading && orders && filteredOrders.length === 0 && (
        <EmptyState
          icon={ShoppingCart}
          title={statusFilter !== "all" || searchTerm ? "Nenhum resultado" : "Nenhum pedido ainda"}
          description={statusFilter !== "all" || searchTerm ? "Tente ajustar os filtros ou a busca." : "Quando seus clientes comprarem listas de leads, os pedidos aparecerão aqui."}
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
                    <th className="text-left p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Usuário</th>
                    <th className="text-left p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Status</th>
                    <th className="text-left p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Leads</th>
                    <th className="text-right p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Valor</th>
                    <th className="text-right p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order: any) => (
                    <tr key={order.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-mono text-xs text-zinc-500">#{order.id}</td>
                      <td className="p-4">
                        <div>
                          <p className="text-sm text-zinc-200">{order.userName ?? `Usuário #${order.userId}`}</p>
                          {order.userEmail && (
                            <p className="text-[10px] font-mono text-zinc-600 tracking-widest mt-0.5">{order.userEmail}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={order.status} statusMap={orderStatusMap} />
                      </td>
                      <td className="p-4 text-zinc-300 font-mono text-sm tabular-nums">{order.totalLeads ?? "-"}</td>
                      <td className="p-4 text-right text-white font-mono text-sm tabular-nums">R$ {(order.totalCents / 100).toFixed(2)}</td>
                      <td className="p-4 text-right text-zinc-600 text-[10px] font-mono tracking-widest">
                        {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
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
