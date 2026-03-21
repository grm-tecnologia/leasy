import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Linkedin, Sparkles, Loader2, Copy, Hash, User, Zap } from "lucide-react";
import { useState } from "react";

export default function LinkedinPage() {
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const [aboutResult, setAboutResult] = useState<any>(null);
  const [skillsResult, setSkillsResult] = useState<any>(null);
  const [hashtagsResult, setHashtagsResult] = useState<any>(null);
  const [fullResult, setFullResult] = useState<any>(null);

  const generateAbout = trpc.generate.linkedin.useMutation({
    onSuccess: (d) => { setAboutResult(d.data); toast.success("Texto 'Sobre' gerado!"); },
    onError: (e) => toast.error(e.message),
  });
  const generateSkills = trpc.generate.linkedin.useMutation({
    onSuccess: (d) => { setSkillsResult(d.data); toast.success("Habilidades geradas!"); },
    onError: (e) => toast.error(e.message),
  });
  const generateHashtags = trpc.generate.linkedin.useMutation({
    onSuccess: (d) => { setHashtagsResult(d.data); toast.success("Hashtags geradas!"); },
    onError: (e) => toast.error(e.message),
  });
  const generateFull = trpc.generate.linkedin.useMutation({
    onSuccess: (d) => { setFullResult(d.data); toast.success("Otimizacao completa gerada!"); },
    onError: (e) => toast.error(e.message),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a area de transferencia!");
  };

  if (isLoading) return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}</div>;

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Linkedin className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Preencha seu perfil primeiro</h2>
        <p className="text-muted-foreground mt-2 max-w-md">Para gerar otimizacoes do LinkedIn, voce precisa preencher seus dados profissionais na pagina de Curriculo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Otimizacao LinkedIn</h1>
        <p className="text-muted-foreground">Gere textos otimizados para turbinar seu perfil no LinkedIn.</p>
      </div>

      <Tabs defaultValue="about" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="about"><User className="h-4 w-4 mr-1.5" /> Sobre</TabsTrigger>
          <TabsTrigger value="skills"><Zap className="h-4 w-4 mr-1.5" /> Habilidades</TabsTrigger>
          <TabsTrigger value="hashtags"><Hash className="h-4 w-4 mr-1.5" /> Hashtags</TabsTrigger>
          <TabsTrigger value="full"><Sparkles className="h-4 w-4 mr-1.5" /> Completo</TabsTrigger>
        </TabsList>

        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>Secao "Sobre" do LinkedIn</CardTitle>
              <CardDescription>Texto otimizado com palavras-chave e storytelling profissional.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => generateAbout.mutate({ profileId: profile.id, type: "about" })} disabled={generateAbout.isPending}>
                {generateAbout.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Gerar Texto "Sobre"
              </Button>
              {aboutResult && (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">{aboutResult.about}</div>
                    <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => copyToClipboard(aboutResult.about)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  {aboutResult.hashtags && (
                    <div className="flex flex-wrap gap-2">
                      {aboutResult.hashtags.map((tag: string, i: number) => (
                        <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => copyToClipboard(tag)}>{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>70+ Habilidades Relevantes</CardTitle>
              <CardDescription>Lista otimizada de habilidades para maximizar visibilidade no LinkedIn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => generateSkills.mutate({ profileId: profile.id, type: "skills" })} disabled={generateSkills.isPending}>
                {generateSkills.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Gerar Habilidades
              </Button>
              {skillsResult?.skills && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{skillsResult.skills.length} habilidades geradas</p>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(skillsResult.skills.join("\n"))}>
                      <Copy className="h-4 w-4 mr-2" /> Copiar Todas
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skillsResult.skills.map((skill: string, i: number) => (
                      <Badge key={i} variant="outline" className="cursor-pointer hover:bg-primary/10" onClick={() => copyToClipboard(skill)}>{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hashtags">
          <Card>
            <CardHeader>
              <CardTitle>Hashtags Estrategicas</CardTitle>
              <CardDescription>Hashtags categorizadas por area, tendencias e mercado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => generateHashtags.mutate({ profileId: profile.id, type: "hashtags" })} disabled={generateHashtags.isPending}>
                {generateHashtags.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Gerar Hashtags
              </Button>
              {hashtagsResult && (
                <div className="space-y-4">
                  {hashtagsResult.categories ? (
                    Object.entries(hashtagsResult.categories).map(([cat, tags]: [string, any]) => (
                      <div key={cat}>
                        <h4 className="text-sm font-medium mb-2 capitalize">{cat}</h4>
                        <div className="flex flex-wrap gap-2">
                          {(tags as string[]).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => copyToClipboard(tag)}>{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : hashtagsResult.hashtags ? (
                    <div className="flex flex-wrap gap-2">
                      {hashtagsResult.hashtags.map((tag: string, i: number) => (
                        <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => copyToClipboard(tag)}>{tag}</Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="full">
          <Card>
            <CardHeader>
              <CardTitle>Otimizacao Completa</CardTitle>
              <CardDescription>Sobre + Habilidades + Hashtags + Headline + Recomendacoes em uma unica geracao.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => generateFull.mutate({ profileId: profile.id, type: "full" })} disabled={generateFull.isPending}>
                {generateFull.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Gerar Otimizacao Completa
              </Button>
              {fullResult && (
                <div className="space-y-6">
                  {fullResult.headline && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Headline Sugerida</h4>
                      <div className="relative p-3 bg-muted rounded-lg text-sm">{fullResult.headline}
                        <Button variant="ghost" size="sm" className="absolute top-1 right-1" onClick={() => copyToClipboard(fullResult.headline)}><Copy className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  )}
                  {fullResult.about && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Secao Sobre</h4>
                      <div className="relative p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">{fullResult.about}
                        <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => copyToClipboard(fullResult.about)}><Copy className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  )}
                  {fullResult.skills && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Habilidades ({fullResult.skills.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {fullResult.skills.slice(0, 30).map((s: string, i: number) => (
                          <Badge key={i} variant="outline">{s}</Badge>
                        ))}
                        {fullResult.skills.length > 30 && <Badge variant="secondary">+{fullResult.skills.length - 30} mais</Badge>}
                      </div>
                    </div>
                  )}
                  {fullResult.recommendations && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Recomendacoes de Melhoria</h4>
                      <ul className="space-y-2">
                        {fullResult.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm"><span className="text-primary mt-0.5">•</span>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
