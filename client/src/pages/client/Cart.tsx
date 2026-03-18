import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ShoppingCart, Trash2, CreditCard, ArrowRight, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import EmptyState from "@/components/EmptyState";

type CartItem = {
  categoryId: number;
  categoryName: string;
  filters: Record<string, string>;
  quantity: number;
  priceCents: number;
};

function getCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem("leasy_cart") ?? "[]"); }
  catch { return []; }
}

function setCart(items: CartItem[]) {
  localStorage.setItem("leasy_cart", JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

export default function Cart() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [items, setItems] = useState<CartItem[]>(getCart());
  const [isProcessing, setIsProcessing] = useState(false);

  const createOrder = trpc.orders.create.useMutation();

  useEffect(() => {
    const handler = () => setItems(getCart());
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, []);

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setCart(newItems);
    setItems(newItems);
    toast.info("Item removido do carrinho");
  };

  const totalCents = items.reduce((sum, item) => sum + item.priceCents, 0);

  const handleCheckout = async () => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
    if (items.length === 0) return;

    setIsProcessing(true);
    try {
      const result = await createOrder.mutateAsync({
        items: items.map((item) => ({
          categoryId: item.categoryId,
          leadCount: item.quantity,
          filters: item.filters,
        })),
      });

      setCart([]);
      setItems([]);

      if (result.paymentUrl) {
        toast.success("Redirecionando para o Mercado Pago...");
        window.location.href = result.paymentUrl;
      } else {
        toast.success("Pedido criado! Finalize o pagamento.");
        setLocation(`/orders/${result.orderId}`);
      }
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao criar pedido");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <div className="font-mono text-[10px] text-[#FF4500] uppercase tracking-widest mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#FF4500] rounded-full" />
          Carrinho
        </div>
        <h1 className="text-2xl font-light tracking-tight text-white">Meu Carrinho</h1>
        <p className="text-[10px] font-mono text-zinc-500 mt-2 uppercase tracking-widest">
          {items.length === 0 ? "Seu carrinho está vazio" : `${items.length} item(ns) no carrinho`}
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum item no carrinho"
          description="Explore nosso catálogo de leads e adicione itens ao carrinho para comprar."
          actionLabel="Explorar Leads"
          onAction={() => setLocation("/explore")}
        />
      ) : (
        <>
          {/* Cart Items */}
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="bg-[#050505] border border-white/10 p-5 hover:border-white/15 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-medium text-white">{item.categoryName}</h3>
                      <span className="text-[10px] font-mono text-[#FF4500] uppercase tracking-widest">
                        {item.quantity.toLocaleString("pt-BR")} leads
                      </span>
                    </div>
                    {Object.keys(item.filters).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(item.filters).map(([key, val]) => (
                          <span key={key} className="text-[10px] font-mono text-zinc-500 border border-white/10 px-2 py-0.5 uppercase tracking-widest">
                            {key}: {val}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-lg font-light text-white">
                      R$ {(item.priceCents / 100).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeItem(index)}
                      className="w-8 h-8 border border-white/10 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/30 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-zinc-500 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="relative p-[1px] bg-gradient-to-b from-[#FF4500]/50 to-transparent">
            <div className="bg-[#050505] border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Total</span>
                <span className="text-2xl font-light text-white">
                  R$ {(totalCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full py-4 text-[10px] uppercase tracking-widest font-medium text-white bg-[#FF4500] hover:bg-[#FF4500]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  "Processando..."
                ) : (
                  <>
                    <CreditCard className="h-3.5 w-3.5" />
                    Finalizar Pedido
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
              <p className="text-[10px] font-mono text-zinc-600 text-center mt-4 uppercase tracking-widest">
                Pagamento seguro via Mercado Pago
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
