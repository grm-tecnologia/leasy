import { useState, useEffect } from "react";
import { Shield, X } from "lucide-react";

const COOKIE_CONSENT_KEY = "leasy-cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "dismissed");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-4xl mx-auto bg-[#0A0A0A] border border-white/10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-2xl shadow-black/50">
        {/* Icon */}
        <div className="w-10 h-10 bg-[#FF4500]/10 border border-[#FF4500]/20 flex items-center justify-center shrink-0 rounded-lg">
          <Shield className="h-5 w-5 text-[#FF4500]" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-300 leading-relaxed">
            Utilizamos cookies essenciais para o funcionamento da plataforma e autenticação segura.
            Ao continuar navegando, você concorda com nossa{" "}
            <a href="/privacidade" className="text-[#FF4500] hover:underline">
              Política de Privacidade
            </a>{" "}
            e{" "}
            <a href="/termos" className="text-[#FF4500] hover:underline">
              Termos de Uso
            </a>.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={accept}
            className="px-5 py-2.5 bg-[#FF4500] hover:bg-[#FF4500]/90 text-white text-[10px] font-mono uppercase tracking-widest transition-colors"
          >
            Aceitar
          </button>
          <button
            onClick={dismiss}
            className="p-2.5 text-zinc-500 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
