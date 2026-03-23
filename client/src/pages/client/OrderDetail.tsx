import { trpc } from "@/lib/trpc";
import { ArrowLeft, Download, CreditCard, CheckCircle, Clock, XCircle, ExternalLink, FileSpreadsheet, RefreshCw } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { format } from "date-fns";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export default function OrderDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const orderId = parseInt(params.id ?? "0");

  const { data, isLoading, refetch } = trpc.orders.getOrder.useQuery(
    { orderId },
    { enabled: orderId > 0 }
  );
  const confirmPayment = trpc.orders.confirmPayment.useMutation();
  const checkPaymentStatus = trpc.orders.checkPaymentStatus.useMutation();
  const [confirming, setConfirming] = useState(false);
  const [checking, setChecking] = useState(false);

  const order = data?.order;
  const items = data?.items ?? [];

  useEffect(() => {
    const url = new URL(window.location.href);
    const paymentId = url.searchParams.get("payment_id");
    const status = url.searchParams.get("status");

    if (paymentId && status === "approved" && order?.status === "pending") {
      setConfirming(true);
      confirmPayment.mutateAsync({ orderId, paymentId })
        .then(() => {
          toast.success("Pagamento confirmado! Seus downloads estão prontos.");
          refetch();
        })
        .catch((err: any) => {
          toast.error(err.message ?? "Erro ao confirmar pagamento");
        })
        .finally(() => setConfirming(false));
    }
  }, [order?.status]);

  const handleCheckPayment = async () => {
    setChecking(true);
    try {
      const result = await checkPaymentStatus.mutateAsync({ orderId });
      if (result.status === "paid") {
        toast.success("Pagamento confirmado!");
        refetch();
      } else {
        toast.info(`Status atual: ${result.status}`);
      }
    } catch {
      toast.error("Erro ao verificar pagamento");
    } finally {
      setChecking(false);
    }
  };

  const statusConfig: Record<string, { icon: any; label: string; color: string }> = {
    paid: { icon: CheckCircle, label: "Pago", color: "#FF4500" },
    pending: { icon: Clock, label: "Aguardando Pagamento", color: "#a1a1aa" },
    failed: { icon: XCircle, label: "Falhou", color: "#ef4444" },
    refunded: { icon: XCircle, label: "Reembolsado", color: "#71717a" },
  };

  const handlePayment = () => {
    if (order?.paymentUrl) {
      window.location.href = order.paymentUrl;
    } else {
      toast.error("Link de pagamento não disponível. Tente novamente.");
    }
  };

  if (isLoading || confirming) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <div className="h-12 w-64 bg-white/5 animate-pulse" />
        <div className="h-64 w-full bg-white/5 animate-pulse" />
        {confirming && <p className="text-center text-zinc-500 text-xs font-mono uppercase tracking-widest">Confirmando pagamento...</p>}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-500 text-sm">Pedido não encontrado</p>
        <button onClick={() => setLocation("/orders")} className="text-[#FF4500] text-xs font-mono uppercase tracking-widest mt-4 hover:underline">
          Voltar
        </button>
      </div>
    );
  }

  const status = statusConfig[order.status] ?? statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setLocation("/orders")}
          className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-zinc-400" />
        </button>
        <div>
          <h1 className="text-2xl font-light tracking-tight text-white">Pedido #{order.id}</h1>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
            Criado em {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm")}
          </p>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-[#050505] border border-white/10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 border flex items-center justify-center"
              style={{
                borderColor: `${status.color}40`,
                backgroundColor: `${status.color}10`,
              }}
            >
              <StatusIcon className="h-5 w-5" style={{ color: status.color }} />
            </div>
            <div>
              <p className="text-lg font-light text-white">{status.label}</p>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
                {order.status === "paid"
                  ? "Seus leads estão prontos para download"
                  : order.status === "pending"
                  ? "Finalize o pagamento para liberar os downloads"
                  : ""}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-light text-white">
              R$ {(order.totalCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {order.status === "pending" && (
          <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
            <button
              onClick={handlePayment}
              className="w-full py-4 text-[10px] uppercase tracking-widest font-medium text-white bg-[#FF4500] hover:bg-[#FF4500]/90 transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="h-3.5 w-3.5" />
              Pagar com Mercado Pago
              <ExternalLink className="h-3 w-3" />
            </button>
            <div className="flex items-center justify-center gap-4">
              <p className="text-[10px] font-mono text-zinc-600 text-center uppercase tracking-widest">
                Você será redirecionado ao Mercado Pago para finalizar o pagamento.
              </p>
              <button
                onClick={handleCheckPayment}
                disabled={checking}
                className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1 shrink-0"
              >
                <RefreshCw className={`h-3 w-3 ${checking ? "animate-spin" : ""}`} />
                Verificar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="bg-[#050505] border border-white/10">
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Itens do Pedido</span>
          {order.status === "paid" && (
            <span className="text-[10px] font-mono text-[#FF4500] uppercase tracking-widest flex items-center gap-1">
              <FileSpreadsheet className="h-3 w-3" />
              Downloads Disponíveis
            </span>
          )}
        </div>
        <div className="divide-y divide-white/5">
          {items.map((item: any) => (
            <OrderItemRow key={item.id} item={item} order={order} />
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-[#050505] border border-white/10 p-5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Total do Pedido</span>
          <span className="text-lg font-light text-white">
            R$ {(order.totalCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
            {items.length} {items.length === 1 ? "item" : "itens"} — {items.reduce((sum: number, it: any) => sum + it.leadCount, 0).toLocaleString("pt-BR")} leads
          </span>
          {order.status === "paid" && (
            <span className="text-[10px] font-mono text-[#22c55e] uppercase tracking-widest flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Pagamento Confirmado
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Order Item Row with Secure CSV Download ─────────────────
function OrderItemRow({ item, order }: { item: any; order: any }) {
  const exportCSV = trpc.export.leadsCSV.useMutation();

  const handleExportCSV = async () => {
    try {
      const result = await exportCSV.mutateAsync({ orderId: order.id, orderItemId: item.id });
      if (result.downloadUrl) {
        // Open presigned URL in a new tab — browser will download the CSV
        window.open(result.downloadUrl, "_blank");
        toast.success("Download iniciado!");
      }
    } catch {
      toast.error("Erro ao exportar CSV");
    }
  };

  return (
    <div className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">{item.categoryName || `Categoria #${item.categoryId}`}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] font-mono text-[#FF4500] uppercase tracking-widest">
              {item.leadCount.toLocaleString("pt-BR")} leads
            </span>
            {item.filters && Object.keys(item.filters).length > 0 && (
              <span className="text-[10px] font-mono text-zinc-600 tracking-widest">
                {Object.entries(item.filters as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join(", ")}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-light text-white">R$ {(item.priceCents / 100).toFixed(2)}</span>
          {order.status === "paid" && (
            <button
              onClick={handleExportCSV}
              disabled={exportCSV.isPending}
              className="px-4 py-2 text-[10px] uppercase tracking-widest text-[#FF4500] border border-[#FF4500]/30 hover:bg-[#FF4500]/10 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {exportCSV.isPending ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              {exportCSV.isPending ? "Exportando..." : "Exportar CSV"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
