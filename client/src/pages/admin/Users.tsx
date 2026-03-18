import { trpc } from "@/lib/trpc";
import { Users as UsersIcon, Search, Shield, ShieldCheck, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/components/Pagination";
import { FilterPills } from "@/components/Charts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/_core/hooks/useAuth";

const roleMap: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  admin: { label: "Admin", color: "#FF4500", icon: ShieldCheck },
  user: { label: "Usuário", color: "#3b82f6", icon: Shield },
};

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const pageSize = 20;
  const { user: currentUser } = useAuth();

  const { data, isLoading } = trpc.users.list.useQuery({ page, pageSize, search: searchTerm || undefined });
  const { data: stats } = trpc.users.stats.useQuery();
  const updateRole = trpc.users.updateRole.useMutation();
  const utils = trpc.useUtils();

  const filteredUsers = useMemo(() => {
    if (!data?.users) return [];
    if (roleFilter === "all") return data.users;
    return data.users.filter((u: any) => u.role === roleFilter);
  }, [data, roleFilter]);

  const totalPages = Math.ceil((data?.total ?? 0) / pageSize);

  const handleRoleChange = async (userId: number, newRole: "user" | "admin") => {
    try {
      await updateRole.mutateAsync({ userId, role: newRole });
      toast.success(`Permissão atualizada para ${roleMap[newRole].label}`);
      utils.users.list.invalidate();
      utils.users.stats.invalidate();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao atualizar permissão");
    }
  };

  const filterOptions = [
    { label: "Todos", value: "all" },
    { label: "Admin", value: "admin" },
    { label: "Usuário", value: "user" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] text-[#FF4500] uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#FF4500] rounded-full" />
            Gerenciamento
          </div>
          <h1 className="text-2xl font-light tracking-tight text-white">Usuários</h1>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0A0A0A] border border-white/[0.08] p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <UsersIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Total</p>
            <p className="text-xl font-light text-white tabular-nums">{stats?.totalUsers ?? 0}</p>
          </div>
        </div>
        <div className="bg-[#0A0A0A] border border-white/[0.08] p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-[#FF4500]/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-[#FF4500]" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Admins</p>
            <p className="text-xl font-light text-white tabular-nums">{stats?.adminCount ?? 0}</p>
          </div>
        </div>
        <div className="bg-[#0A0A0A] border border-white/[0.08] p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Clientes</p>
            <p className="text-xl font-light text-white tabular-nums">{(stats?.totalUsers ?? 0) - (stats?.adminCount ?? 0)}</p>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-[#0A0A0A] border border-white/[0.08] p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full bg-transparent border border-white/[0.08] pl-9 pr-4 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-[#FF4500]/30 transition-colors font-mono text-xs"
            />
          </div>
          <FilterPills options={filterOptions} value={roleFilter} onChange={setRoleFilter} />
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 bg-[#0A0A0A] border border-white/[0.08] animate-pulse" />)}
        </div>
      )}

      {!isLoading && filteredUsers.length === 0 && (
        <EmptyState
          icon={UsersIcon}
          title={searchTerm || roleFilter !== "all" ? "Nenhum resultado" : "Nenhum usuário"}
          description={searchTerm || roleFilter !== "all" ? "Tente ajustar os filtros ou a busca." : "Ainda não há usuários cadastrados."}
        />
      )}

      {!isLoading && filteredUsers.length > 0 && (
        <>
          <div className="bg-[#0A0A0A] border border-white/[0.08]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Usuário</th>
                    <th className="text-left p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">E-mail</th>
                    <th className="text-left p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Método</th>
                    <th className="text-left p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Permissão</th>
                    <th className="text-right p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Cadastro</th>
                    <th className="text-right p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Último Acesso</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user: any) => {
                    const roleInfo = roleMap[user.role] ?? roleMap.user;
                    const isSelf = user.id === currentUser?.id;
                    return (
                      <tr key={user.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-mono shrink-0"
                              style={{ backgroundColor: `${roleInfo.color}15`, color: roleInfo.color }}>
                              {user.name?.charAt(0).toUpperCase() ?? "U"}
                            </div>
                            <div>
                              <p className="text-sm text-zinc-200">{user.name ?? "-"}</p>
                              <p className="text-[10px] font-mono text-zinc-600 tracking-widest">ID #{user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-zinc-400 text-sm font-mono">{user.email ?? "-"}</td>
                        <td className="p-4">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                            {user.loginMethod ?? "-"}
                          </span>
                        </td>
                        <td className="p-4">
                          {isSelf ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest rounded-full"
                              style={{ backgroundColor: `${roleInfo.color}15`, color: roleInfo.color }}
                            >
                              <roleInfo.icon className="h-3 w-3" />
                              {roleInfo.label}
                              <span className="text-zinc-600 ml-1">(você)</span>
                            </span>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest rounded-full hover:opacity-80 transition-opacity cursor-pointer"
                                  style={{ backgroundColor: `${roleInfo.color}15`, color: roleInfo.color }}
                                >
                                  <roleInfo.icon className="h-3 w-3" />
                                  {roleInfo.label}
                                  <ChevronDown className="h-3 w-3 ml-0.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-[#0A0A0A] border-white/[0.08]">
                                <DropdownMenuItem
                                  onClick={() => handleRoleChange(user.id, "admin")}
                                  className={`cursor-pointer text-zinc-400 hover:text-white focus:text-white focus:bg-white/5 ${user.role === "admin" ? "opacity-50" : ""}`}
                                  disabled={user.role === "admin"}
                                >
                                  <ShieldCheck className="mr-2 h-4 w-4 text-[#FF4500]" />
                                  Promover a Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRoleChange(user.id, "user")}
                                  className={`cursor-pointer text-zinc-400 hover:text-white focus:text-white focus:bg-white/5 ${user.role === "user" ? "opacity-50" : ""}`}
                                  disabled={user.role === "user"}
                                >
                                  <Shield className="mr-2 h-4 w-4 text-blue-400" />
                                  Definir como Usuário
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                        <td className="p-4 text-right text-zinc-600 text-[10px] font-mono tracking-widest">
                          {format(new Date(user.createdAt), "dd/MM/yyyy")}
                        </td>
                        <td className="p-4 text-right text-zinc-600 text-[10px] font-mono tracking-widest">
                          {format(new Date(user.lastSignedIn), "dd/MM/yyyy HH:mm")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={data?.total ?? 0}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
