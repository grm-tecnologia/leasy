import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState, useRef } from "react";
import {
  Shield, Zap, Database, Lock,
  Fingerprint, Eye,
} from "lucide-react";

/**
 * Premium Login Page for Leasy
 * Split layout: left side with branding + animated background, right side with login options
 * Google as primary login, email as secondary — no Manus branding
 */
export default function LoginPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [user, loading, setLocation]);

  // Animated grid/particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
    const PARTICLE_COUNT = 60;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      ctx.strokeStyle = "rgba(255,69,0,0.03)";
      ctx.lineWidth = 0.5;
      const gridSize = 40;
      for (let x = 0; x < canvas.offsetWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.offsetHeight);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.offsetHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.offsetWidth, y);
        ctx.stroke();
      }

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.offsetWidth) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.offsetHeight) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,69,0,${p.opacity})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255,69,0,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Verificando sessão...</span>
        </div>
      </div>
    );
  }

  const handleLogin = () => {
    const returnPath = new URLSearchParams(window.location.search).get("return") || "/dashboard";
    sessionStorage.setItem("leasy-return-path", returnPath);
    window.location.href = getLoginUrl(returnPath);
  };

  const trustBadges = [
    { icon: Shield, label: "Dados Criptografados" },
    { icon: Lock, label: "Conexão Segura" },
    { icon: Fingerprint, label: "Autenticação OAuth 2.0" },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex">
      {/* ═══ Left Panel — Branding + Visual ═══ */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0.8 }}
        />

        <div className="absolute inset-0 bg-gradient-to-br from-[#0F0F0F] via-transparent to-[#FF4500]/5 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#0F0F0F] to-transparent pointer-events-none" />

        <div className="absolute top-[20%] left-[10%] w-64 h-64 rounded-full bg-[#FF4500]/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[30%] right-[15%] w-48 h-48 rounded-full bg-[#FF4500]/3 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full p-12">
          <div className="flex items-center gap-3 mb-auto">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310419663029580797/o2whmyWEnyg2xHJMbHxmnn/leasy-icon-square-6Ux6CtihddRwJ7iaPJ5QTp.webp"
              alt="Leasy"
              className="h-10 w-10 rounded-xl"
            />
            <span className="text-xl font-medium tracking-tight text-white">Leasy</span>
          </div>

          <div className="mb-auto mt-auto max-w-lg">
            <div className="font-mono text-[10px] text-[#FF4500] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5" />
              Plataforma de Leads Inteligentes
            </div>
            <h1 className="text-5xl xl:text-6xl tracking-tighter font-light text-white leading-[1.1] mb-6">
              Acesse leads{" "}
              <span className="text-[#FF4500]">qualificados</span>{" "}
              <span className="text-zinc-500">para o seu negócio.</span>
            </h1>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
              Filtre, compre e receba listas de contatos verificados em segundos.
              Dados tratados por IA, prontos para conversão.
            </p>

            <div className="flex gap-8 mt-10">
              <div className="flex flex-col">
                <span className="text-2xl font-light text-white">100%</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mt-1">Verificados</span>
              </div>
              <div className="w-px bg-white/10" />
              <div className="flex flex-col">
                <span className="text-2xl font-light text-white flex items-center gap-1">
                  <Zap className="h-4 w-4 text-[#FF4500]" />
                  CSV
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mt-1">Entrega Instantânea</span>
              </div>
              <div className="w-px bg-white/10" />
              <div className="flex flex-col">
                <span className="text-2xl font-light text-white flex items-center gap-1">
                  <Database className="h-4 w-4 text-[#FF4500]" />
                  IA
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mt-1">Dados Enriquecidos</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-auto">
            {trustBadges.map((badge) => (
              <div key={badge.label} className="flex items-center gap-2">
                <badge.icon className="h-3.5 w-3.5 text-[#FF4500]/60" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Right Panel — Login Form ═══ */}
      <div className="w-full lg:w-[45%] flex flex-col relative">
        <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10 hidden lg:block" />

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 p-6">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310419663029580797/o2whmyWEnyg2xHJMbHxmnn/leasy-icon-square-6Ux6CtihddRwJ7iaPJ5QTp.webp"
            alt="Leasy"
            className="h-8 w-8 rounded-lg"
          />
          <span className="text-lg font-medium tracking-tight text-white">Leasy</span>
        </div>

        {/* Login content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 sm:px-12 lg:px-16 py-12">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="mb-10">
              <div className="w-12 h-12 rounded-xl bg-[#FF4500]/10 border border-[#FF4500]/20 flex items-center justify-center mb-6">
                <Eye className="h-6 w-6 text-[#FF4500]" />
              </div>
              <h2 className="text-3xl font-light tracking-tight text-white mb-2">
                Bem-vindo
              </h2>
              <p className="text-sm text-zinc-500">
                Entre na sua conta ou crie uma nova para acessar a plataforma.
              </p>
            </div>

            {/* Login buttons */}
            <div className="space-y-3">
              {/* ═══ Google — Primary CTA ═══ */}
              <button
                onClick={handleLogin}
                onMouseEnter={() => setHoveredBtn("google")}
                onMouseLeave={() => setHoveredBtn(null)}
                className="w-full relative group overflow-hidden"
              >
                <div className={`
                  flex items-center justify-center gap-3 px-6 py-4
                  bg-white text-[#1a1a1a] text-sm font-medium rounded-lg
                  transition-all duration-300
                  ${hoveredBtn === "google" ? "bg-gray-100 shadow-lg shadow-white/10" : ""}
                `}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-sm font-medium">Continuar com Google</span>
                </div>
              </button>

            </div>

            {/* Info card */}
            <div className="mt-8 p-4 bg-[#050505] border border-white/5 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 text-[#FF4500]/60 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Sua conta é protegida com autenticação segura OAuth 2.0.
                    Não armazenamos senhas — seus dados ficam seguros.
                  </p>
                </div>
              </div>
            </div>

            {/* Social proof */}
            <div className="mt-6 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FF4500] to-[#FF6B35] border-2 border-[#0F0F0F] flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">K</span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-[#0F0F0F] flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">M</span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 border-2 border-[#0F0F0F] flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">L</span>
                  </div>
                </div>
                <span className="text-[10px] text-zinc-500">Empresas já utilizam</span>
              </div>
            </div>

            {/* Terms */}
            <p className="mt-6 text-[10px] text-zinc-600 text-center leading-relaxed">
              Ao entrar, você concorda com os{" "}
              <a href="/termos" className="text-[#FF4500]/70 hover:text-[#FF4500] transition-colors">
                Termos de Uso
              </a>{" "}
              e a{" "}
              <a href="/privacidade" className="text-[#FF4500]/70 hover:text-[#FF4500] transition-colors">
                Política de Privacidade
              </a>
              .
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="p-6 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-700">
            &copy; {new Date().getFullYear()} Leasy
          </span>
          <div className="flex items-center gap-4">
            <a href="/termos" className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors">
              Termos
            </a>
            <a href="/privacidade" className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors">
              Privacidade
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
