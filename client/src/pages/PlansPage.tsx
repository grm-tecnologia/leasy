import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Crown, CheckCircle2, Sparkles, Loader2 } from "lucide-react";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: "Gratis",
    priceDetail: "para sempre",
    features: [
      "3 geracoes de curriculo por mes",
      "Formulario basico de dados",
      "Templates de mensagens padrao",
      "Dashboard basico",
      "Acoes SSI limitadas",
    ],
    limitations: [
      "Sem input por audio",
      "Sem formulario completo (objetivos)",
      "Sem geracoes ilimitadas",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    price: "R$ 49,90",
    priceDetail: "por mes",
    features: [
      "Geracoes ilimitadas de curriculo",
      "Formulario completo com objetivos",
      "Input por audio com transcricao IA",
      "Templates personalizados com IA",
      "Painel SSI completo",
      "Otimizacao completa do LinkedIn",
      "Hashtags estrategicas por area",
      "Suporte prioritario",
    ],
    limitations: [],
  },
];

export default function PlansPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const upgradeMutation = trpc.plans.upgrade.useMutation({
    onSuccess: () => {
      toast.success("Upgrade realizado com sucesso! Bem-vindo ao Gold!");
      utils.auth.me.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const downgradeMutation = trpc.plans.downgrade.useMutation({
    onSuccess: () => {
      toast.info("Plano alterado para Basic.");
      utils.auth.me.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const currentPlan = user?.plan || "basic";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Planos</h1>
        <p className="text-muted-foreground">Escolha o plano ideal para sua carreira.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        {plans.map(plan => {
          const isCurrent = currentPlan === plan.id;
          const isGold = plan.id === "gold";

          return (
            <Card key={plan.id} className={`relative ${isGold ? "border-primary shadow-lg ring-1 ring-primary/20" : ""}`}>
              {isGold && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3">
                    <Sparkles className="h-3 w-3 mr-1" /> Mais Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Crown className={`h-6 w-6 ${isGold ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground ml-1">/{plan.priceDetail}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2.5">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      {feat}
                    </li>
                  ))}
                  {plan.limitations.map((lim, i) => (
                    <li key={`lim-${i}`} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-4 w-4 flex items-center justify-center shrink-0 text-muted-foreground">—</span>
                      {lim}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Plano Atual
                  </Button>
                ) : isGold ? (
                  <Button
                    className="w-full"
                    onClick={() => upgradeMutation.mutate()}
                    disabled={upgradeMutation.isPending}
                  >
                    {upgradeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Crown className="h-4 w-4 mr-2" />}
                    Fazer Upgrade para Gold
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => downgradeMutation.mutate()}
                    disabled={downgradeMutation.isPending}
                  >
                    {downgradeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Mudar para Basic
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="max-w-4xl">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">Informacoes sobre o plano Gold</h3>
          <p className="text-sm text-muted-foreground">
            O plano Gold oferece acesso ilimitado a todas as funcionalidades da plataforma Leasy.
            Voce pode cancelar a qualquer momento e voltar para o plano Basic sem perder seus dados.
            O pagamento sera integrado em breve via Stripe.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
