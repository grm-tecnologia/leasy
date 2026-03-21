import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Linkedin,
  Target,
  Crown,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery();
  const { data: generationsList, isLoading: gensLoading } = trpc.generations.list.useQuery();
  const { data: ssiActions, isLoading: ssiLoading } = trpc.ssi.list.useQuery();

  const completedActions = ssiActions?.filter(a => a.completed).length || 0;
  const totalActions = ssiActions?.length || 0;
  const ssiScore = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  const profileScore = (() => {
    if (!profile) return 0;
    let score = 0;
    if (profile.fullName) score += 10;
    if (profile.email) score += 5;
    if (profile.headline) score += 15;
    if (profile.summary) score += 15;
    if (profile.currentRole) score += 10;
    if (profile.experience) score += 15;
    if (profile.education) score += 10;
    if (profile.skills) score += 10;
    if (profile.targetRole) score += 5;
    if (profile.linkedinUrl) score += 5;
    return Math.min(score, 100);
  })();

  const recentGens = generationsList?.slice(0, 5) || [];

  const genTypeLabel: Record<string, string> = {
    cv_pdf: "Curriculo PDF",
    linkedin_about: "LinkedIn Sobre",
    linkedin_skills: "LinkedIn Habilidades",
    linkedin_hashtags: "LinkedIn Hashtags",
    full_optimization: "Otimizacao Completa",
  };

  if (profileLoading || gensLoading || ssiLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Ola, {user?.name?.split(" ")[0] || "Usuario"}
          </h1>
          <p className="text-muted-foreground">Aqui esta o resumo da sua carreira.</p>
        </div>
        <Badge variant={user?.plan === "gold" ? "default" : "secondary"} className="text-sm">
          <Crown className="h-3.5 w-3.5 mr-1" />
          Plano {user?.plan === "gold" ? "Gold" : "Basic"}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/cv")}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score do Perfil</p>
                <p className="text-2xl font-bold mt-1">{profileScore}%</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
            <Progress value={profileScore} className="mt-3 h-1.5" />
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/cv")}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Geracoes</p>
                <p className="text-2xl font-bold mt-1">
                  {user?.generationsUsed || 0}
                  {user?.plan === "basic" && <span className="text-sm font-normal text-muted-foreground">/{user?.generationsLimit || 3}</span>}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/ssi")}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Acoes SSI</p>
                <p className="text-2xl font-bold mt-1">{completedActions}/{totalActions}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <Progress value={ssiScore} className="mt-3 h-1.5" />
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/linkedin")}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">LinkedIn</p>
                <p className="text-2xl font-bold mt-1">{profile?.linkedinUrl ? "Conectado" : "Pendente"}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Linkedin className="h-5 w-5 text-indigo-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions + Recent */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acoes Rapidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!profile && (
              <Button variant="outline" className="w-full justify-between" onClick={() => setLocation("/cv")}>
                <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Preencher perfil profissional</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" className="w-full justify-between" onClick={() => setLocation("/cv")}>
              <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Gerar curriculo com IA</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => setLocation("/linkedin")}>
              <span className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> Otimizar LinkedIn</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => setLocation("/templates")}>
              <span className="flex items-center gap-2"><Target className="h-4 w-4" /> Ver templates de mensagens</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historico Recente</CardTitle>
          </CardHeader>
          <CardContent>
            {recentGens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma geracao ainda.</p>
                <p className="text-xs mt-1">Comece gerando seu primeiro curriculo!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentGens.map(gen => (
                  <div key={gen.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className={`h-4 w-4 ${gen.status === "completed" ? "text-green-500" : gen.status === "failed" ? "text-destructive" : "text-muted-foreground"}`} />
                      <div>
                        <p className="text-sm font-medium">{genTypeLabel[gen.type] || gen.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(gen.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <Badge variant={gen.status === "completed" ? "default" : gen.status === "failed" ? "destructive" : "secondary"} className="text-xs">
                      {gen.status === "completed" ? "Concluido" : gen.status === "failed" ? "Falhou" : "Processando"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
