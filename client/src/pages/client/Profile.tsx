import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  User, Mail, Shield, Calendar, ShoppingCart, Database,
  DollarSign, Heart, Settings, LogOut,
} from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { data: metrics } = trpc.clientDashboard.metrics.useQuery();
  const { data: favs } = trpc.favorites.list.useQuery();

  if (!user) return null;

  const stats = [
    {
      label: "Leads Comprados",
      value: (metrics?.totalLeadsBought ?? 0).toLocaleString("pt-BR"),
      icon: Database,
      color: "#3b82f6",
    },
    {
      label: "Total Investido",
      value: `R$ ${((metrics?.totalSpent ?? 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "#22c55e",
    },
    {
      label: "Pedidos",
      value: (metrics?.totalOrders ?? 0).toLocaleString("pt-BR"),
      icon: ShoppingCart,
      color: "#f59e0b",
    },
    {
      label: "Favoritos",
      value: (favs?.length ?? 0).toLocaleString("pt-BR"),
      icon: Heart,
      color: "#FF4500",
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <div className="font-mono text-[10px] text-[#FF4500] uppercase tracking-widest mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#FF4500] rounded-full" />
          Minha Conta
        </div>
        <h1 className="text-2xl font-light tracking-tight text-white">Perfil</h1>
        <p className="text-sm text-zinc-500 mt-1">Gerencie suas informações e acompanhe suas métricas.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-[#050505] border border-white/[0.08] p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-xl bg-[#FF4500]/15 border border-[#FF4500]/25 flex items-center justify-center shrink-0">
            <span className="text-2xl font-light text-[#FF4500]">
              {user.name?.charAt(0).toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-light text-white">{user.name ?? "Usuário"}</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
              {user.email && (
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="text-xs font-mono">{user.email}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-zinc-500">
                <Shield className="h-3.5 w-3.5" />
                <span className="text-[10px] font-mono uppercase tracking-widest">
                  {user.role === "admin" ? "Administrador" : "Cliente"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-500">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-[10px] font-mono uppercase tracking-widest">
                  Membro desde {format(new Date(user.createdAt ?? Date.now()), "MMM yyyy")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#0A0A0A] border border-white/[0.08] p-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
              style={{ backgroundColor: `${stat.color}15` }}
            >
              <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
            </div>
            <p className="text-lg font-light text-white tabular-nums">{stat.value}</p>
            <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-[#0A0A0A] border border-white/[0.08]">
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Ações Rápidas</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          <button
            onClick={() => setLocation("/dashboard")}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors text-left"
          >
            <Settings className="h-4 w-4 text-zinc-600" />
            <div>
              <p className="text-sm text-zinc-300">Meu Dashboard</p>
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Acompanhe suas métricas e compras</p>
            </div>
          </button>
          <button
            onClick={() => setLocation("/orders")}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors text-left"
          >
            <ShoppingCart className="h-4 w-4 text-zinc-600" />
            <div>
              <p className="text-sm text-zinc-300">Meus Pedidos</p>
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Visualize e exporte seus leads comprados</p>
            </div>
          </button>
          <button
            onClick={() => setLocation("/explore")}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors text-left"
          >
            <Database className="h-4 w-4 text-zinc-600" />
            <div>
              <p className="text-sm text-zinc-300">Explorar Leads</p>
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Descubra novas categorias de leads</p>
            </div>
          </button>
          {user.role === "admin" && (
            <button
              onClick={() => setLocation("/admin")}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors text-left"
            >
              <Shield className="h-4 w-4 text-[#FF4500]" />
              <div>
                <p className="text-sm text-zinc-300">Painel Admin</p>
                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Acesse o painel administrativo</p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Logout */}
      <div className="bg-[#0A0A0A] border border-white/[0.08] p-5">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3 border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors text-xs font-mono uppercase tracking-widest"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair da Conta
        </button>
      </div>
    </div>
  );
}
