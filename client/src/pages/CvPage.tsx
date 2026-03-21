import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { FileText, Sparkles, Download, Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";

export default function CvPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const saveMutation = trpc.profile.save.useMutation({
    onSuccess: () => { toast.success("Perfil salvo com sucesso!"); utils.profile.get.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const generateCv = trpc.generate.cv.useMutation({
    onSuccess: (data) => { setGeneratedHtml(data.html); toast.success("Curriculo gerado com sucesso!"); utils.generations.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const [generatedHtml, setGeneratedHtml] = useState("");
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", city: "", state: "", country: "Brasil",
    headline: "", summary: "", currentRole: "", currentCompany: "",
    yearsExperience: 0, targetRole: "", targetIndustry: "", salaryExpectation: "",
    linkedinUrl: "", portfolioUrl: "",
    education: "", experience: "", skills: "", certifications: "", languages: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.fullName || "", email: profile.email || "", phone: profile.phone || "",
        city: profile.city || "", state: profile.state || "", country: profile.country || "Brasil",
        headline: profile.headline || "", summary: profile.summary || "",
        currentRole: profile.currentRole || "", currentCompany: profile.currentCompany || "",
        yearsExperience: profile.yearsExperience || 0,
        targetRole: profile.targetRole || "", targetIndustry: profile.targetIndustry || "",
        salaryExpectation: profile.salaryExpectation || "",
        linkedinUrl: profile.linkedinUrl || "", portfolioUrl: profile.portfolioUrl || "",
        education: typeof profile.education === "string" ? profile.education : JSON.stringify(profile.education || "", null, 2),
        experience: typeof profile.experience === "string" ? profile.experience : JSON.stringify(profile.experience || "", null, 2),
        skills: typeof profile.skills === "string" ? profile.skills : (Array.isArray(profile.skills) ? (profile.skills as string[]).join(", ") : ""),
        certifications: typeof profile.certifications === "string" ? profile.certifications : JSON.stringify(profile.certifications || "", null, 2),
        languages: typeof profile.languages === "string" ? profile.languages : (Array.isArray(profile.languages) ? (profile.languages as string[]).join(", ") : ""),
      });
    }
  }, [profile]);

  const handleSave = () => {
    const isGold = user?.plan === "gold";
    saveMutation.mutate({
      formType: isGold ? "gold" : "basic",
      fullName: form.fullName || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      country: form.country || undefined,
      headline: form.headline || undefined,
      summary: form.summary || undefined,
      currentRole: form.currentRole || undefined,
      currentCompany: form.currentCompany || undefined,
      yearsExperience: form.yearsExperience || undefined,
      targetRole: form.targetRole || undefined,
      targetIndustry: form.targetIndustry || undefined,
      salaryExpectation: form.salaryExpectation || undefined,
      linkedinUrl: form.linkedinUrl || undefined,
      portfolioUrl: form.portfolioUrl || undefined,
      education: form.education || undefined,
      experience: form.experience || undefined,
      skills: form.skills ? form.skills.split(",").map(s => s.trim()) : undefined,
      certifications: form.certifications || undefined,
      languages: form.languages ? form.languages.split(",").map(s => s.trim()) : undefined,
    });
  };

  const handleGenerate = () => {
    if (!profile) { toast.error("Salve seu perfil antes de gerar o curriculo."); return; }
    generateCv.mutate({ profileId: profile.id });
  };

  const handleDownload = () => {
    if (!generatedHtml) return;
    const blob = new Blob([generatedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `curriculo-${form.fullName || "leasy"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateField = (field: string, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

  if (isLoading) return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}</div>;

  const isGold = user?.plan === "gold";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meu Curriculo</h1>
          <p className="text-muted-foreground">Preencha seus dados e gere um curriculo otimizado com IA.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
          <Button onClick={handleGenerate} disabled={generateCv.isPending || !profile}>
            {generateCv.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Gerar Curriculo
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Dados Basicos</TabsTrigger>
          <TabsTrigger value="professional">Experiencia</TabsTrigger>
          <TabsTrigger value="goals" disabled={!isGold}>
            Objetivos {!isGold && <Badge variant="secondary" className="ml-1 text-[10px]">Gold</Badge>}
          </TabsTrigger>
          {generatedHtml && <TabsTrigger value="preview">Visualizar CV</TabsTrigger>}
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Informacoes Pessoais</CardTitle>
              <CardDescription>Dados basicos para o curriculo.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome Completo</Label><Input value={form.fullName} onChange={e => updateField("fullName", e.target.value)} placeholder="Seu nome completo" /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => updateField("email", e.target.value)} placeholder="seu@email.com" /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone} onChange={e => updateField("phone", e.target.value)} placeholder="(11) 99999-9999" /></div>
              <div className="space-y-2"><Label>Cidade</Label><Input value={form.city} onChange={e => updateField("city", e.target.value)} placeholder="Sao Paulo" /></div>
              <div className="space-y-2"><Label>Estado</Label><Input value={form.state} onChange={e => updateField("state", e.target.value)} placeholder="SP" /></div>
              <div className="space-y-2"><Label>Pais</Label><Input value={form.country} onChange={e => updateField("country", e.target.value)} placeholder="Brasil" /></div>
              <div className="md:col-span-2 space-y-2"><Label>Headline Profissional</Label><Input value={form.headline} onChange={e => updateField("headline", e.target.value)} placeholder="Ex: Engenheiro de Software Senior | React | Node.js" /></div>
              <div className="md:col-span-2 space-y-2"><Label>Resumo Profissional</Label><Textarea rows={4} value={form.summary} onChange={e => updateField("summary", e.target.value)} placeholder="Descreva sua trajetoria profissional..." /></div>
              <div className="space-y-2"><Label>LinkedIn</Label><Input value={form.linkedinUrl} onChange={e => updateField("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/seu-perfil" /></div>
              <div className="space-y-2"><Label>Portfolio</Label><Input value={form.portfolioUrl} onChange={e => updateField("portfolioUrl", e.target.value)} placeholder="https://seu-portfolio.com" /></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professional">
          <Card>
            <CardHeader>
              <CardTitle>Experiencia Profissional</CardTitle>
              <CardDescription>Detalhe sua experiencia, formacao e habilidades.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Cargo Atual</Label><Input value={form.currentRole} onChange={e => updateField("currentRole", e.target.value)} placeholder="Ex: Desenvolvedor Full Stack" /></div>
                <div className="space-y-2"><Label>Empresa Atual</Label><Input value={form.currentCompany} onChange={e => updateField("currentCompany", e.target.value)} placeholder="Ex: Empresa XYZ" /></div>
                <div className="space-y-2"><Label>Anos de Experiencia</Label><Input type="number" value={form.yearsExperience} onChange={e => updateField("yearsExperience", parseInt(e.target.value) || 0)} /></div>
              </div>
              <div className="space-y-2"><Label>Experiencia (descreva cada posicao)</Label><Textarea rows={6} value={form.experience} onChange={e => updateField("experience", e.target.value)} placeholder="Empresa A (2020-2024): Desenvolvedor Senior&#10;- Liderou equipe de 5 devs&#10;- Implementou sistema que reduziu custos em 30%" /></div>
              <div className="space-y-2"><Label>Formacao Academica</Label><Textarea rows={3} value={form.education} onChange={e => updateField("education", e.target.value)} placeholder="Universidade XYZ - Ciencia da Computacao (2016-2020)" /></div>
              <div className="space-y-2"><Label>Habilidades (separadas por virgula)</Label><Textarea rows={3} value={form.skills} onChange={e => updateField("skills", e.target.value)} placeholder="React, Node.js, TypeScript, Python, SQL, Docker..." /></div>
              <div className="space-y-2"><Label>Certificacoes</Label><Textarea rows={2} value={form.certifications} onChange={e => updateField("certifications", e.target.value)} placeholder="AWS Solutions Architect, PMP..." /></div>
              <div className="space-y-2"><Label>Idiomas (separados por virgula)</Label><Input value={form.languages} onChange={e => updateField("languages", e.target.value)} placeholder="Portugues (nativo), Ingles (fluente), Espanhol (basico)" /></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle>Objetivos de Carreira</CardTitle>
              <CardDescription>Disponivel no plano Gold. Ajuda a IA a personalizar melhor.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Cargo Desejado</Label><Input value={form.targetRole} onChange={e => updateField("targetRole", e.target.value)} placeholder="Ex: Tech Lead, CTO, Product Manager" /></div>
              <div className="space-y-2"><Label>Industria Alvo</Label><Input value={form.targetIndustry} onChange={e => updateField("targetIndustry", e.target.value)} placeholder="Ex: Fintech, SaaS, Healthtech" /></div>
              <div className="space-y-2"><Label>Expectativa Salarial</Label><Input value={form.salaryExpectation} onChange={e => updateField("salaryExpectation", e.target.value)} placeholder="Ex: R$ 15.000 - R$ 25.000" /></div>
            </CardContent>
          </Card>
        </TabsContent>

        {generatedHtml && (
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Curriculo Gerado</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" /> Baixar HTML
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden bg-white">
                  <iframe
                    srcDoc={generatedHtml}
                    className="w-full min-h-[800px]"
                    title="Curriculo Preview"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
