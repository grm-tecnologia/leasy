import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import {
  Sparkles,
  FileText,
  Linkedin,
  Target,
  MessageSquare,
  Mic,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
} from "lucide-react";
import { useLocation } from "wouter";

const features = [
  { icon: FileText, title: "Curriculo com IA", desc: "Gere curriculos profissionais otimizados para ATS com palavras-chave estrategicas." },
  { icon: Linkedin, title: "LinkedIn Otimizado", desc: "Textos para Sobre, 70+ habilidades e hashtags estrategicas por area." },
  { icon: Mic, title: "Input por Audio", desc: "Grave ou envie audio e a IA transcreve e estrutura seus dados profissionais." },
  { icon: Target, title: "Painel SSI", desc: "Acoes recomendadas para melhorar seu Social Selling Index no LinkedIn." },
  { icon: MessageSquare, title: "Templates de Mensagens", desc: "Mensagens personalizadas para recrutadores, gestores e diretores." },
  { icon: Zap, title: "Geracao Instantanea", desc: "Resultados em segundos com inteligencia artificial de ultima geracao." },
];

const plans = [
  {
    name: "Basic",
    price: "Gratis",
    features: ["3 geracoes de curriculo", "Formulario basico", "Templates padrao", "Dashboard basico"],
    highlighted: false,
  },
  {
    name: "Gold",
    price: "R$ 49,90/mes",
    features: ["Geracoes ilimitadas", "Formulario completo", "Input por audio", "Templates personalizados", "Painel SSI completo", "Suporte prioritario"],
    highlighted: true,
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const handleCTA = () => {
    if (user) {
      setLocation("/dashboard");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">Leasy</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button onClick={() => setLocation("/dashboard")}>
                Ir para Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleCTA}>
                Comecar Gratis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="container relative py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground bg-background">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Plataforma de Carreira com Inteligencia Artificial
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
              Transforme sua carreira com{" "}
              <span className="text-primary">inteligencia artificial</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Otimize seu curriculo para ATS, turbine seu LinkedIn com SEO profissional e receba acoes
              estrategicas para atrair recrutadores. Tudo automatizado por IA.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button size="lg" onClick={handleCTA} className="text-base px-8">
                {user ? "Acessar Dashboard" : "Comecar Gratis"} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Sem cartao de credito</span>
              <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-green-500" /> Dados protegidos</span>
              <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-green-500" /> Resultado em segundos</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Tudo que voce precisa para sua carreira</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Ferramentas inteligentes que automatizam a otimizacao do seu perfil profissional.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="border bg-card hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Planos</h2>
            <p className="text-muted-foreground mt-3">Comece gratis e faca upgrade quando quiser.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {plans.map((p, i) => (
              <Card key={i} className={`border ${p.highlighted ? "border-primary shadow-lg ring-1 ring-primary/20" : ""}`}>
                <CardContent className="p-8">
                  {p.highlighted && (
                    <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs font-medium px-3 py-1 mb-4">
                      <Sparkles className="h-3 w-3" /> Mais Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-bold">{p.name}</h3>
                  <p className="text-3xl font-extrabold mt-2">{p.price}</p>
                  <ul className="mt-6 space-y-3">
                    {p.features.map((feat, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={handleCTA}
                    className="w-full mt-8"
                    variant={p.highlighted ? "default" : "outline"}
                  >
                    {p.highlighted ? "Comecar com Gold" : "Comecar Gratis"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-semibold">Leasy</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Transformando carreiras com inteligencia artificial.
          </p>
        </div>
      </footer>
    </div>
  );
}
