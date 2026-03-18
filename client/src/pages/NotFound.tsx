import { Home, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0F0F0F]">
      <div className="text-center max-w-md mx-4">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-xl bg-[#FF4500]/10 border border-[#FF4500]/20 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-[#FF4500]" />
          </div>
        </div>

        <h1 className="text-5xl font-light text-white mb-2 tracking-tight">404</h1>

        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-6">
          Página não encontrada
        </p>

        <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
          A página que você está procurando não existe ou foi movida.
        </p>

        <button
          onClick={() => setLocation("/")}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#FF4500] hover:bg-[#FF4500]/90 text-white text-[10px] font-mono uppercase tracking-widest transition-colors rounded-lg"
        >
          <Home className="h-3.5 w-3.5" />
          Voltar ao Início
        </button>
      </div>
    </div>
  );
}
