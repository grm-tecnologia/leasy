import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, Users, Crown, FileText, User, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery(undefined, {
    retry: false,
    enabled: user?.role === "admin",
  });
  const { data: usersList, isLoading: usersLoading } = trpc.admin.users.useQuery(undefined, {
    retry: false,
    enabled: user?.role === "admin",
  });
  const { data: recentGens, isLoading: gensLoading } = trpc.admin.recentGenerations.useQuery(undefined, {
    retry: false,
    enabled: user?.role === "admin",
  });

  const updateRole = trpc.admin.updateRole.useMutation({
    onSuccess: () => { toast.success("Role atualizada!"); utils.admin.users.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Acesso Restrito</h2>
        <p className="text-muted-foreground mt-2">Esta pagina e exclusiva para administradores.</p>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/dashboard")}>Voltar ao Dashboard</Button>
      </div>
    );
  }

  if (statsLoading) return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}</div>;

  const genTypeLabel: Record<string, string> = {
    cv_pdf: "CV PDF", linkedin_about: "LI Sobre", linkedin_skills: "LI Skills",
    linkedin_hashtags: "LI Hashtags", full_optimization: "Completa",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel Administrativo</h1>
        <p className="text-muted-foreground">Gestao de usuarios, metricas e analytics da plataforma.</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Total Usuarios</p><p className="text-2xl font-bold mt-1">{stats?.totalUsers || 0}</p></div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Users className="h-5 w-5 text-blue-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Usuarios Gold</p><p className="text-2xl font-bold mt-1">{stats?.goldUsers || 0}</p></div>
              <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center"><Crown className="h-5 w-5 text-yellow-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Total Geracoes</p><p className="text-2xl font-bold mt-1">{stats?.totalGenerations || 0}</p></div>
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center"><FileText className="h-5 w-5 text-green-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Perfis Criados</p><p className="text-2xl font-bold mt-1">{stats?.totalProfiles || 0}</p></div>
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center"><User className="h-5 w-5 text-purple-500" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader><CardTitle>Usuarios</CardTitle></CardHeader>
        <CardContent>
          {usersLoading ? <Skeleton className="h-48" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Nome</th>
                    <th className="text-left py-3 px-2 font-medium">Email</th>
                    <th className="text-left py-3 px-2 font-medium">Plano</th>
                    <th className="text-left py-3 px-2 font-medium">Role</th>
                    <th className="text-left py-3 px-2 font-medium">Geracoes</th>
                    <th className="text-left py-3 px-2 font-medium">Cadastro</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList?.map(u => (
                    <tr key={u.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">{u.name || "-"}</td>
                      <td className="py-3 px-2 text-muted-foreground">{u.email || "-"}</td>
                      <td className="py-3 px-2">
                        <Badge variant={u.plan === "gold" ? "default" : "secondary"}>{u.plan || "basic"}</Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Select
                          value={u.role}
                          onValueChange={(val) => updateRole.mutate({ userId: u.id, role: val as "user" | "admin" })}
                        >
                          <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-2">{u.generationsUsed || 0}</td>
                      <td className="py-3 px-2 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Generations */}
      <Card>
        <CardHeader><CardTitle>Geracoes Recentes</CardTitle></CardHeader>
        <CardContent>
          {gensLoading ? <Skeleton className="h-48" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">ID</th>
                    <th className="text-left py-3 px-2 font-medium">Tipo</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                    <th className="text-left py-3 px-2 font-medium">Tokens</th>
                    <th className="text-left py-3 px-2 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {recentGens?.map(gen => (
                    <tr key={gen.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">#{gen.id}</td>
                      <td className="py-3 px-2">{genTypeLabel[gen.type] || gen.type}</td>
                      <td className="py-3 px-2">
                        <Badge variant={gen.status === "completed" ? "default" : gen.status === "failed" ? "destructive" : "secondary"}>
                          {gen.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">{gen.tokensUsed || 0}</td>
                      <td className="py-3 px-2 text-muted-foreground">{new Date(gen.createdAt).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
