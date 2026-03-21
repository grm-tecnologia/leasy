import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, User, Users, FileText, MessageCircle } from "lucide-react";

const categoryConfig: Record<string, { label: string; icon: any; color: string }> = {
  profile: { label: "Perfil", icon: User, color: "text-blue-500" },
  network: { label: "Rede", icon: Users, color: "text-green-500" },
  content: { label: "Conteudo", icon: FileText, color: "text-purple-500" },
  engagement: { label: "Engajamento", icon: MessageCircle, color: "text-orange-500" },
};

const priorityConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  high: { label: "Alta", variant: "default" },
  medium: { label: "Media", variant: "secondary" },
  low: { label: "Baixa", variant: "outline" },
};

export default function SsiPage() {
  const utils = trpc.useUtils();
  const { data: actions, isLoading } = trpc.ssi.list.useQuery();
  const toggleMutation = trpc.ssi.toggle.useMutation({
    onMutate: async ({ id, completed }) => {
      await utils.ssi.list.cancel();
      const prev = utils.ssi.list.getData();
      utils.ssi.list.setData(undefined, old =>
        old?.map(a => a.id === id ? { ...a, completed } : a)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) utils.ssi.list.setData(undefined, ctx.prev); },
    onSettled: () => utils.ssi.list.invalidate(),
  });

  if (isLoading) return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}</div>;

  const completed = actions?.filter(a => a.completed).length || 0;
  const total = actions?.length || 0;
  const score = total > 0 ? Math.round((completed / total) * 100) : 0;

  const grouped = actions?.reduce((acc, action) => {
    const cat = action.category || "profile";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(action);
    return acc;
  }, {} as Record<string, typeof actions>) || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Acoes SSI LinkedIn</h1>
        <p className="text-muted-foreground">Complete as acoes recomendadas para melhorar seu Social Selling Index.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Progresso Geral</p>
              <p className="text-3xl font-bold">{score}%</p>
            </div>
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="h-7 w-7 text-primary" />
            </div>
          </div>
          <Progress value={score} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">{completed} de {total} acoes concluidas</p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {Object.entries(grouped).map(([category, catActions]) => {
          const config = categoryConfig[category] || categoryConfig.profile;
          const Icon = config.icon;
          const catCompleted = catActions?.filter(a => a.completed).length || 0;
          const catTotal = catActions?.length || 0;

          return (
            <Card key={category}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${config.color}`} />
                    <CardTitle className="text-base">{config.label}</CardTitle>
                  </div>
                  <Badge variant="secondary">{catCompleted}/{catTotal}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {catActions?.map(action => {
                  const pConfig = priorityConfig[action.priority || "medium"];
                  return (
                    <label key={action.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                      <Checkbox
                        checked={action.completed}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: action.id, completed: !!checked })}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${action.completed ? "line-through text-muted-foreground" : ""}`}>
                          {action.title}
                        </p>
                      </div>
                      <Badge variant={pConfig.variant} className="text-[10px] shrink-0">{pConfig.label}</Badge>
                    </label>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
