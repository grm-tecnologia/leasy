import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import {
  Activity, Search, Filter, User, Upload, DollarSign, Settings,
  Shield, Package, Trash2, Edit, Plus, Clock,
} from "lucide-react";
import { format } from "date-fns";
import Pagination from "@/components/Pagination";

const ACTION_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  "user.login": { label: "Login", icon: User, color: "#3b82f6" },
  "user.role_change": { label: "Alteração de Papel", icon: Shield, color: "#a855f7" },
  "category.create": { label: "Categoria Criada", icon: Plus, color: "#22c55e" },
  "category.update": { label: "Categoria Atualizada", icon: Edit, color: "#f59e0b" },
  "lead.upload": { label: "Upload de Leads", icon: Upload, color: "#06b6d4" },
  "lead.delete": { label: "Lead Removido", icon: Trash2, color: "#ef4444" },
  "order.create": { label: "Pedido Criado", icon: Package, color: "#3b82f6" },
  "order.paid": { label: "Pagamento Confirmado", icon: DollarSign, color: "#22c55e" },
  "pricing.update": { label: "Preço Atualizado", icon: Settings, color: "#f59e0b" },
};

const ACTION_FILTERS = [
  { value: "", label: "Todas" },
  { value: "user.login", label: "Login" },
  { value: "user.role_change", label: "Papéis" },
  { value: "category.create", label: "Categorias" },
  { value: "lead.upload", label: "Uploads" },
  { value: "order.create", label: "Pedidos" },
  { value: "order.paid", label: "Pagamentos" },
  { value: "pricing.update", label: "Preços" },
];

export default function ActivityLogPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [search, setSearch] = useState("");
  const pageSize = 30;

  const { data, isLoading } = trpc.activity.list.useQuery({
    page,
    pageSize,
    action: actionFilter || undefined,
  });

  const activities = data?.activities ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const filteredActivities = useMemo(() => {
    if (!search.trim()) return activities;
    const q = search.toLowerCase();
    return activities.filter(
      (a: any) =>
        (a.userName ?? "").toLowerCase().includes(q) ||
        (a.userEmail ?? "").toLowerCase().includes(q) ||
        (a.action ?? "").toLowerCase().includes(q) ||
        (a.entityType ?? "").toLowerCase().includes(q) ||
        (a.entityId ?? "").toLowerCase().includes(q)
    );
  }, [activities, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="font-mono text-[10px] text-[#FF4500] uppercase tracking-widest mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#FF4500] rounded-full" />
          Registro de Atividades
        </div>
        <h1 className="text-2xl font-light tracking-tight text-white">Log de Atividades</h1>
        <p className="text-sm text-zinc-500 mt-1">Acompanhe todas as ações realizadas na plataforma.</p>
      </div>

      {/* Filters */}
      <div className="bg-[#0A0A0A] border border-white/[0.08] p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
            <input
              placeholder="Buscar por usuário, ação ou entidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-transparent border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#FF4500]/30 transition-colors font-mono text-xs"
            />
          </div>
          {/* Action Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
            {ACTION_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => { setActionFilter(f.value); setPage(1); }}
                className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest whitespace-nowrap transition-all ${
                  actionFilter === f.value
                    ? "bg-[#FF4500] text-white"
                    : "text-zinc-500 border border-white/[0.08] hover:border-white/15 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
          Mostrando {filteredActivities.length} de {total} registros
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-[#0A0A0A] border border-white/[0.08]">
        {isLoading ? (
          <div className="divide-y divide-white/[0.04]">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <div className="w-9 h-9 bg-white/5 animate-pulse rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-white/5 animate-pulse rounded" />
                  <div className="h-3 w-32 bg-white/5 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Activity className="h-10 w-10 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500">Nenhuma atividade registrada</p>
            <p className="text-[10px] font-mono text-zinc-600 mt-1 uppercase tracking-widest">
              As ações dos usuários aparecerão aqui automaticamente
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filteredActivities.map((activity: any) => {
              const config = ACTION_LABELS[activity.action] ?? {
                label: activity.action,
                icon: Activity,
                color: "#71717a",
              };
              const Icon = config.icon;
              const details = activity.details as Record<string, unknown> | null;

              return (
                <div
                  key={activity.id}
                  className="p-4 flex items-start gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${config.color}15` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: config.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5"
                        style={{ color: config.color, backgroundColor: `${config.color}15` }}
                      >
                        {config.label}
                      </span>
                      {activity.entityType && (
                        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                          {activity.entityType} {activity.entityId ? `#${activity.entityId}` : ""}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <User className="h-3 w-3 text-zinc-600" />
                      <span className="text-sm text-zinc-400">{activity.userName ?? "Usuário desconhecido"}</span>
                      {activity.userEmail && (
                        <span className="text-[10px] font-mono text-zinc-600">{activity.userEmail}</span>
                      )}
                    </div>
                    {details && Object.keys(details).length > 0 && (
                      <div className="mt-2 text-[10px] font-mono text-zinc-600 tracking-widest">
                        {Object.entries(details).slice(0, 3).map(([k, v]) => (
                          <span key={k} className="mr-3">
                            {k}: <span className="text-zinc-400">{String(v)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-mono text-zinc-600 tracking-widest">
                      {format(new Date(activity.createdAt), "dd/MM/yyyy")}
                    </p>
                    <p className="text-[10px] font-mono text-zinc-700 tracking-widest">
                      {format(new Date(activity.createdAt), "HH:mm:ss")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
