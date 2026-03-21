import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { MessageSquare, Copy, Sparkles, Loader2, Users, Briefcase, Building2 } from "lucide-react";
import { useState } from "react";

const roleConfig: Record<string, { label: string; icon: any; color: string }> = {
  recruiter: { label: "Recrutadores", icon: Users, color: "text-blue-500" },
  manager: { label: "Gestores", icon: Briefcase, color: "text-green-500" },
  director: { label: "Diretores", icon: Building2, color: "text-purple-500" },
};

export default function TemplatesPage() {
  const utils = trpc.useUtils();
  const { data: templates, isLoading } = trpc.messages.list.useQuery();
  const generateMsg = trpc.generate.messageTemplate.useMutation({
    onSuccess: (data) => { setGeneratedMsg(data); toast.success("Mensagem gerada!"); },
    onError: (e) => toast.error(e.message),
  });
  const trackUsage = trpc.messages.trackUsage.useMutation();
  const [generatedMsg, setGeneratedMsg] = useState<any>(null);

  const copyTemplate = (content: string, id?: number) => {
    navigator.clipboard.writeText(content);
    toast.success("Mensagem copiada!");
    if (id) trackUsage.mutate({ id });
  };

  if (isLoading) return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Templates de Mensagens</h1>
          <p className="text-muted-foreground">Mensagens prontas para abordar profissionais no LinkedIn.</p>
        </div>
      </div>

      {/* AI Generator */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Gerar Mensagem com IA</CardTitle>
          <CardDescription>Gere uma mensagem personalizada com base no seu perfil.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(["recruiter", "manager", "director"] as const).map(role => {
              const config = roleConfig[role];
              const Icon = config.icon;
              return (
                <Button
                  key={role}
                  variant="outline"
                  onClick={() => generateMsg.mutate({ targetRole: role })}
                  disabled={generateMsg.isPending}
                >
                  {generateMsg.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Icon className={`h-4 w-4 mr-2 ${config.color}`} />}
                  {config.label}
                </Button>
              );
            })}
          </div>
          {generatedMsg && (
            <div className="mt-4 relative">
              <div className="p-4 bg-background rounded-lg border text-sm whitespace-pre-wrap">
                {generatedMsg.subject && <p className="font-medium mb-2">Assunto: {generatedMsg.subject}</p>}
                {generatedMsg.message}
              </div>
              <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => copyTemplate(generatedMsg.message)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Templates by Role */}
      <Tabs defaultValue="recruiter" className="space-y-4">
        <TabsList>
          {Object.entries(roleConfig).map(([role, config]) => {
            const Icon = config.icon;
            return (
              <TabsTrigger key={role} value={role}>
                <Icon className={`h-4 w-4 mr-1.5 ${config.color}`} /> {config.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(roleConfig).map(([role, config]) => {
          const roleTemplates = templates?.filter(t => t.targetRole === role) || [];
          return (
            <TabsContent key={role} value={role}>
              {roleTemplates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum template para {config.label.toLowerCase()} ainda.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {roleTemplates.map(template => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{template.title}</CardTitle>
                          {template.isDefault && <Badge variant="secondary" className="text-[10px]">Padrao</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-4 line-clamp-4">{template.content}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{template.usageCount || 0} usos</span>
                          <Button variant="outline" size="sm" onClick={() => copyTemplate(template.content, template.id)}>
                            <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
