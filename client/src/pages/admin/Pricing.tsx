import { trpc } from "@/lib/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Save, Coins } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminPricing() {
  const { data: categories } = trpc.categories.listAll.useQuery();
  const [selectedCat, setSelectedCat] = useState<string>("");
  const { data: pricing, isLoading } = trpc.pricing.getForCategory.useQuery(
    { categoryId: parseInt(selectedCat) },
    { enabled: !!selectedCat }
  );
  const updatePricing = trpc.pricing.update.useMutation();
  const utils = trpc.useUtils();

  const [form, setForm] = useState({ minQty: "", maxQty: "", pricePerLeadCents: "" });

  const handleSave = async () => {
    if (!selectedCat) return;
    try {
      const existingTiers = (pricing ?? []).map((t: any) => ({
        minQuantity: t.minQty ?? t.minQuantity,
        maxQuantity: t.maxQty ?? t.maxQuantity ?? null,
        pricePerLeadCents: t.pricePerLeadCents,
      }));
      existingTiers.push({
        minQuantity: parseInt(form.minQty),
        maxQuantity: form.maxQty ? parseInt(form.maxQty) : null,
        pricePerLeadCents: parseInt(form.pricePerLeadCents),
      });
      await updatePricing.mutateAsync({
        categoryId: parseInt(selectedCat),
        tiers: existingTiers,
      });
      toast.success("Preço salvo");
      utils.pricing.getForCategory.invalidate();
      setForm({ minQty: "", maxQty: "", pricePerLeadCents: "" });
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao salvar");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="font-mono text-[10px] text-[#FF4500] uppercase tracking-widest mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#FF4500] rounded-full" />
          Configuração
        </div>
        <h1 className="text-2xl font-light tracking-tight text-white">Preços</h1>
        <p className="text-[10px] font-mono text-zinc-500 mt-2 uppercase tracking-widest">
          Configure preços por faixa de quantidade para cada categoria
        </p>
      </div>

      <Select value={selectedCat} onValueChange={setSelectedCat}>
        <SelectTrigger className="w-72 bg-[#050505] border-white/10 text-sm">
          <SelectValue placeholder="Selecione uma categoria..." />
        </SelectTrigger>
        <SelectContent className="bg-[#0F0F0F] border-white/10">
          {categories?.map((cat) => (
            <SelectItem key={cat.id} value={String(cat.id)}>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2" style={{ backgroundColor: cat.color ?? "#FF4500" }} />
                {cat.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedCat && (
        <>
          {/* Current pricing tiers */}
          <div className="bg-[#050505] border border-white/10">
            <div className="px-5 py-3 border-b border-white/10">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Faixas de Preço Atuais</span>
            </div>
            {pricing && pricing.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/[0.03]">
                      <th className="text-left p-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Qtd. Mínima</th>
                      <th className="text-left p-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Qtd. Máxima</th>
                      <th className="text-left p-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Preço por Lead</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricing.map((tier: any, i: number) => (
                      <tr key={i} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 text-zinc-300 font-mono text-sm">{tier.minQty}</td>
                        <td className="p-3 text-zinc-300 font-mono text-sm">{tier.maxQty ?? "Sem limite"}</td>
                        <td className="p-3 text-white font-mono text-sm">R$ {(tier.pricePerLeadCents / 100).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={Coins}
                title="Nenhuma faixa de preço"
                description="Adicione faixas de preço abaixo para definir quanto cada lead custa nesta categoria."
                className="py-6"
              />
            )}
          </div>

          {/* Add new tier */}
          <div className="bg-[#050505] border border-white/10 p-5">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4 pb-3 border-b border-white/10">
              Adicionar Faixa de Preço
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5">Qtd. Mínima</label>
                <input
                  type="number"
                  value={form.minQty}
                  onChange={(e) => setForm({ ...form, minQty: e.target.value })}
                  placeholder="1"
                  className="w-full px-3 py-2 bg-[#0F0F0F] border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#FF4500]/50 transition-colors font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5">Qtd. Máxima</label>
                <input
                  type="number"
                  value={form.maxQty}
                  onChange={(e) => setForm({ ...form, maxQty: e.target.value })}
                  placeholder="100"
                  className="w-full px-3 py-2 bg-[#0F0F0F] border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#FF4500]/50 transition-colors font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5">Preço/Lead (centavos)</label>
                <input
                  type="number"
                  value={form.pricePerLeadCents}
                  onChange={(e) => setForm({ ...form, pricePerLeadCents: e.target.value })}
                  placeholder="50"
                  className="w-full px-3 py-2 bg-[#0F0F0F] border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#FF4500]/50 transition-colors font-mono"
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={!form.minQty || !form.pricePerLeadCents}
              className="mt-4 px-5 py-2.5 text-[10px] uppercase tracking-widest text-white bg-[#FF4500] hover:bg-[#FF4500]/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-3.5 w-3.5" /> Salvar Faixa
            </button>
          </div>
        </>
      )}
    </div>
  );
}
