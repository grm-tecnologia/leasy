import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
// Login URL handled by /login page
import LucideIcon from "@/components/LucideIcon";
import {
  Database, ArrowRight, Shield, Zap, Filter,
  CheckCircle2, BarChart3, ShoppingCart, Star,
} from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useRef } from "react";

export default function Landing() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: categories } = trpc.categories.list.useQuery();

  if (!loading && user) {
    if (user.role === "admin") {
      setLocation("/admin");
    } else {
      setLocation("/explore");
    }
    return null;
  }

  const features = [
    {
      icon: Filter,
      title: "Filtragem Avançada",
      tags: ["Combinável", "Dinâmico"],
      description:
        "Selecione a categoria de leads e aplique filtros avançados: cidade, estado, perfil, faixa etária e muito mais.",
    },
    {
      icon: CheckCircle2,
      title: "Amostras Verificadas",
      tags: ["Preview", "Mascarado"],
      description:
        "Veja uma prévia dos dados antes de comprar. Dados de contato ficam protegidos até a confirmação do pagamento.",
    },
    {
      icon: ShoppingCart,
      title: "Compra Instantânea",
      tags: ["Mercado Pago", "CSV"],
      description:
        "Pague com segurança via Mercado Pago e receba sua lista em CSV pronta para uso imediato.",
    },
  ];

  const trustItems = [
    { icon: Shield, title: "Dados Verificados", desc: "Leads tratados e validados com inteligência artificial" },
    { icon: Zap, title: "Entrega Imediata", desc: "Receba sua lista em CSV segundos após o pagamento" },
    { icon: Filter, title: "Filtros Avançados", desc: "Combine dezenas de filtros para encontrar o lead ideal" },
    { icon: BarChart3, title: "Sempre Atualizado", desc: "Banco de leads enriquecido e atualizado constantemente" },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white overflow-hidden">
      {/* ═══ Navbar ═══ */}
      <nav className="sticky top-0 z-50 h-14 border-b border-white/10 bg-[#0F0F0F]/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663029580797/o2whmyWEnyg2xHJMbHxmnn/leasy-icon-square-6Ux6CtihddRwJ7iaPJ5QTp.webp" alt="Leasy" className="h-8 w-8 rounded" />
            <span className="font-medium tracking-tight text-white">Leasy</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/login")}
              className="text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-white transition-colors duration-300"
            >
              Entrar
            </button>
            <button
              onClick={() => setLocation("/login")}
              className="text-[10px] uppercase tracking-widest font-medium text-white bg-[#FF4500] hover:bg-[#FF4500]/90 px-5 py-2.5 transition-colors duration-300 flex items-center gap-2"
            >
              Criar Conta
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ Hero Section ═══ */}
      <section className="relative min-h-[85vh] flex items-center border-b border-white/10">
        {/* Decorative grid lines */}
        <div className="absolute inset-0 pointer-events-none flex justify-between z-0">
          <div className="w-[1px] h-full bg-white/5 relative left-[8%] hidden md:block">
            <div className="absolute top-0 -translate-x-[2px] w-[5px] h-[5px] bg-[#0F0F0F] border border-white/20" />
            <div className="absolute bottom-0 -translate-x-[2px] w-[5px] h-[5px] bg-[#0F0F0F] border border-white/20" />
          </div>
          <div className="w-[1px] h-full bg-white/5 relative left-[40%] hidden lg:block" />
          <div className="w-[1px] h-full bg-white/5 relative right-[8%] hidden md:block">
            <div className="absolute top-0 -translate-x-[2px] w-[5px] h-[5px] bg-[#0F0F0F] border border-white/20" />
            <div className="absolute bottom-0 -translate-x-[2px] w-[5px] h-[5px] bg-[#0F0F0F] border border-white/20" />
          </div>
        </div>

        {/* Section header rail */}
        <header className="absolute top-0 left-0 w-full h-12 border-b border-white/10 flex items-center justify-between px-6 lg:px-12 z-30 bg-[#0F0F0F]/80 backdrop-blur-sm">
          <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#FF4500]" />
            Leasy — Leads Inteligentes
          </div>
          <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest hidden md:flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#FF4500] rounded-full animate-pulse" />
            Sistema Ativo
          </div>
        </header>

        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 pt-24 pb-16 w-full">
          <div className="max-w-3xl">
            <div className="font-mono text-[10px] text-[#FF4500] uppercase tracking-widest mb-8 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Plataforma B2B/B2C
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl tracking-tighter font-light text-white leading-[1.05]">
              A forma inteligente{" "}
              <span className="text-zinc-500">de gerar</span>{" "}
              <span className="text-[#FF4500]">leads.</span>
            </h1>
            <div className="flex flex-col md:flex-row gap-8 justify-between items-start w-full max-w-2xl mt-12">
              <p className="text-[10px] font-mono text-zinc-500 leading-relaxed max-w-sm uppercase tracking-widest">
                Leads fáceis, filtrados e prontos pra vender. Você recebe apenas contatos
                qualificados, prontos para comprar — sem perder tempo com curiosos.
              </p>
              <button
                onClick={() => setLocation("/login")}
                className="group flex items-center gap-3 text-[10px] uppercase tracking-widest text-white bg-[#FF4500] hover:bg-[#FF4500]/90 px-6 py-3 transition-colors duration-300 shrink-0"
              >
                Começar Agora
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom marquee */}
        <div className="absolute bottom-0 left-0 w-full h-8 border-t border-white/10 bg-[#0A0A0A] text-zinc-500 font-mono text-[10px] uppercase flex items-center overflow-hidden z-30">
          <div className="flex whitespace-nowrap gap-12 pl-12 items-center animate-marquee">
            <span className="flex items-center gap-2"><Shield className="h-3 w-3" /> DADOS VERIFICADOS POR IA</span>
            <span className="flex items-center gap-2 text-white"><Database className="h-3 w-3" /> LEADS HIPER-SEGMENTADOS</span>
            <span className="flex items-center gap-2"><Filter className="h-3 w-3" /> FILTROS AVANÇADOS COMBINADOS</span>
            <span className="flex items-center gap-2 text-[#FF4500]"><Zap className="h-3 w-3" /> ENTREGA INSTANTÂNEA EM CSV</span>
            <span className="flex items-center gap-2"><Shield className="h-3 w-3" /> DADOS VERIFICADOS POR IA</span>
            <span className="flex items-center gap-2 text-white"><Database className="h-3 w-3" /> LEADS HIPER-SEGMENTADOS</span>
            <span className="flex items-center gap-2"><Filter className="h-3 w-3" /> FILTROS AVANÇADOS COMBINADOS</span>
            <span className="flex items-center gap-2 text-[#FF4500]"><Zap className="h-3 w-3" /> ENTREGA INSTANTÂNEA EM CSV</span>
          </div>
        </div>
      </section>

      {/* ═══ Features Section ═══ */}
      <section id="como-funciona" className="relative border-b border-white/10">
        <header className="absolute top-0 left-0 w-full h-12 border-b border-white/10 flex items-center px-6 lg:px-12 z-30 bg-[#0F0F0F]/80 backdrop-blur-sm">
          <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-white/20" />
            Como Funciona
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-24 mt-8">
          <div className="text-center mb-16">
            <div className="font-mono text-[10px] text-[#FF4500] uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
              <Zap className="h-4 w-4" /> Processo Simplificado
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl tracking-tight font-light text-white mb-4">
              Três passos para seus leads
            </h2>
            <p className="text-xs font-mono tracking-widest uppercase text-zinc-500 max-w-xl mx-auto">
              Em 3 passos simples, você tem acesso a leads qualificados para o seu negócio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`group flex flex-col cursor-default ${i === 1 ? "md:translate-y-4" : ""}`}
              >
                <div className="relative bg-[#050505] flex flex-col border border-white/10 p-6 h-full hover:border-white/20 transition-colors duration-300">
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-mono text-zinc-500 mb-6 border-b border-white/10 pb-4">
                    <span>Passo {i + 1}</span>
                    <feature.icon className="h-4 w-4" />
                  </div>
                  <h4 className="text-xl font-light tracking-tight text-white mb-2">{feature.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-[#FF4500] mb-4 font-mono uppercase tracking-widest">
                    {feature.tags.map((tag, j) => (
                      <span key={tag}>
                        {j > 0 && <span className="mr-2">•</span>}
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-zinc-400 font-light border-t border-white/10 pt-4 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Categories Section ═══ */}
      <section id="categorias" className="relative border-b border-white/10">
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "linear-gradient(to bottom, black 0%, transparent 80%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 80%)",
          }}
        />

        <header className="absolute top-0 left-0 w-full h-12 border-b border-white/10 flex items-center px-6 lg:px-12 z-30 bg-[#0F0F0F]/80 backdrop-blur-sm">
          <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-white/20" />
            Catálogo
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-24 relative z-10 mt-8">
          <div className="flex flex-col items-center text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl tracking-tighter font-light text-white mb-6">
              Categorias de{" "}
              <span className="text-[#FF4500]">Leads</span>
            </h2>
            <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase max-w-xl leading-relaxed">
              Explore nossos nichos de leads segmentados e encontre o público ideal para o seu negócio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {categories?.map((cat, i) => (
              <div
                key={cat.id}
                className={`relative p-[1px] ${
                  i === 0
                    ? "bg-gradient-to-b from-[#FF4500]/50 to-transparent"
                    : "bg-gradient-to-b from-white/10 to-transparent"
                } hover:from-white/20 transition-colors duration-700 group cursor-pointer`}
                onClick={() => setLocation("/login")}
              >
                <div className={`h-full ${i === 0 ? "bg-[#0F0F0F]" : "bg-[#050505]"} p-6 flex flex-col relative overflow-hidden border ${i === 0 ? "border-white/10" : "border-white/5"}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-10 h-10 border border-white/10 flex items-center justify-center"
                      style={{ backgroundColor: `${cat.color ?? "#FF4500"}15` }}
                    >
                      <LucideIcon
                        name={cat.icon ?? "FolderOpen"}
                        className="h-5 w-5"
                        style={{ color: cat.color ?? "#FF4500" }}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">{cat.name}</h4>
                      <p className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 mt-0.5">
                        {cat.leadCount.toLocaleString("pt-BR")} leads
                      </p>
                    </div>
                  </div>
                  {cat.description && (
                    <p className="text-sm text-zinc-400 font-light leading-relaxed flex-1">
                      {cat.description}
                    </p>
                  )}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF4500]">
                      Explorar
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-[#FF4500] group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Trust Section ═══ */}
      <section className="relative border-b border-white/10">
        <header className="absolute top-0 left-0 w-full h-12 border-b border-white/10 flex items-center px-6 lg:px-12 z-30 bg-[#0F0F0F]/80 backdrop-blur-sm">
          <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-white/20" />
            Diferenciais
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-24 mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {trustItems.map((item) => (
              <div key={item.title} className="group text-center">
                <div className="w-14 h-14 border border-white/10 bg-[#050505] flex items-center justify-center mx-auto mb-5 group-hover:border-[#FF4500]/30 transition-colors duration-300">
                  <item.icon className="h-6 w-6 text-[#FF4500]" />
                </div>
                <h3 className="text-sm font-medium text-white mb-2">{item.title}</h3>
                <p className="text-xs text-zinc-500 font-mono tracking-widest uppercase leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA Section ═══ */}
      <section className="relative min-h-[60vh] flex flex-col">
        <header className="absolute top-0 left-0 w-full h-12 border-b border-white/10 flex items-center px-6 lg:px-12 z-30 bg-[#0F0F0F]/80 backdrop-blur-sm">
          <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#FF4500]" />
            Começar Agora
          </div>
        </header>

        {/* Background grid */}
        <div className="absolute inset-0 pointer-events-none z-0 flex justify-center opacity-20">
          <div className="w-full h-full grid grid-cols-2 md:grid-cols-4 relative">
            <div className="border-l border-dashed border-white/10 relative">
              <div className="absolute top-32 -left-[2.5px] w-[4px] h-[4px] bg-white/40" />
            </div>
            <div className="border-l border-dashed border-white/10 relative hidden md:block" />
            <div className="border-l border-dashed border-white/10 relative hidden md:block" />
            <div className="border-l border-r border-dashed border-white/10 relative" />
          </div>
        </div>

        <div className="relative z-10 w-full px-6 lg:px-8 pt-32 flex-1 flex flex-col lg:flex-row justify-between items-start gap-12 max-w-6xl mx-auto">
          <div className="flex gap-12 md:gap-24 font-light">
            <div className="flex flex-col gap-4">
              <span className="text-[10px] text-[#FF4500] font-mono tracking-widest uppercase mb-2">Produto</span>
              <span onClick={() => document.getElementById("categorias")?.scrollIntoView({ behavior: "smooth" })} className="text-sm text-zinc-400 hover:text-white transition-colors duration-300 cursor-pointer">Categorias</span>
              <span onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })} className="text-sm text-zinc-400 hover:text-white transition-colors duration-300 cursor-pointer">Como Funciona</span>
              <span onClick={() => setLocation("/login")} className="text-sm text-zinc-400 hover:text-white transition-colors duration-300 cursor-pointer">Começar Agora</span>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-[10px] text-[#FF4500] font-mono tracking-widest uppercase mb-2">Suporte</span>
              <a href="/termos" className="text-sm text-zinc-400 hover:text-white transition-colors duration-300 cursor-pointer">Termos de Uso</a>
              <a href="/privacidade" className="text-sm text-zinc-400 hover:text-white transition-colors duration-300 cursor-pointer">Privacidade</a>
              <span className="text-sm text-zinc-400 hover:text-white transition-colors duration-300 cursor-pointer">Termos</span>
            </div>
          </div>

          <div className="max-w-sm flex flex-col items-start bg-[#050505]/80 backdrop-blur-sm p-8 border border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#FF4500]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <h2 className="text-3xl tracking-tight font-light text-white mb-3 relative z-10">
              Encontre seus leads
            </h2>
            <p className="text-xs text-zinc-400 mb-8 leading-relaxed font-mono tracking-widest uppercase relative z-10">
              Crie sua conta gratuitamente e comece a explorar nosso banco de leads agora mesmo.
            </p>
            <button
              onClick={() => setLocation("/login")}
              className="w-full relative px-6 py-4 text-[10px] uppercase tracking-widest font-medium text-white bg-[#FF4500] hover:bg-[#FF4500]/80 transition-colors flex justify-center items-center gap-2 border border-[#FF4500]"
            >
              Criar Conta Grátis
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto p-6 lg:px-8 relative z-10 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] font-mono tracking-widest uppercase text-zinc-600 border-t border-white/10 bg-[#0A0A0A] max-w-full">
          <span>&copy; {new Date().getFullYear()} Leasy</span>
          <div className="flex items-center gap-4">
            <a href="/termos" className="hover:text-zinc-400 transition-colors">Termos</a>
            <a href="/privacidade" className="hover:text-zinc-400 transition-colors">Privacidade</a>
          </div>
          <div className="flex items-center gap-2">
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663029580797/o2whmyWEnyg2xHJMbHxmnn/leasy-icon-square-6Ux6CtihddRwJ7iaPJ5QTp.webp" alt="Leasy" className="h-5 w-5 rounded" />
            <span className="font-medium tracking-tighter text-white/50">LEASY /// SYS</span>
          </div>
        </div>
      </section>

      {/* Marquee animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
      `}</style>
    </div>
  );
}
