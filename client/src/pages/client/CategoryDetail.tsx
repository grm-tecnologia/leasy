import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Filter, Eye, ShoppingCart, Lock, SearchX, Zap } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/components/Pagination";
import LucideIcon from "@/components/LucideIcon";
import { useState, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

function getCart(): Array<{ categoryId: number; categoryName: string; filters: Record<string, string>; quantity: number; priceCents: number }> {
  try {
    return JSON.parse(localStorage.getItem("leasy_cart") ?? "[]");
  } catch { return []; }
}

function setCart(items: ReturnType<typeof getCart>) {
  localStorage.setItem("leasy_cart", JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

export default function CategoryDetail() {
  const params = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: category, isLoading } = trpc.categories.getBySlug.useQuery(
    { slug: params.slug ?? "" },
    { enabled: !!params.slug }
  );

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(50);
  const [page, setPage] = useState(1);

  const fields = useMemo(() => (category?.fieldDefinitions as any[]) ?? [], [category]);
  const filterableFields = useMemo(() => fields.filter((f: any) => f.filterable), [fields]);
  const contactFields = useMemo(() => fields.filter((f: any) => f.isContact).map((f: any) => f.name), [fields]);

  const activeFilters = useMemo(() => {
    const active: Record<string, string> = {};
    for (const [k, v] of Object.entries(filters)) {
      if (v && v !== "__all__") active[k] = v;
    }
    return active;
  }, [filters]);

  const { data: leadsData, isLoading: leadsLoading } = trpc.leads.browse.useQuery(
    { categoryId: category?.id ?? 0, filters: activeFilters, page, pageSize: 10 },
    { enabled: !!category?.id }
  );

  const { data: leadCount } = trpc.leads.count.useQuery(
    { categoryId: category?.id ?? 0, filters: activeFilters },
    { enabled: !!category?.id }
  );

  const { data: priceData } = trpc.pricing.calculate.useQuery(
    { categoryId: category?.id ?? 0, quantity },
    { enabled: !!category?.id && quantity > 0 }
  );

  const maskValue = (val: string) => {
    if (!val || val.length < 4) return "***";
    return val.substring(0, 2) + "***" + val.substring(val.length - 2);
  };

  const handleAddToCart = () => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
    if (!category) return;
    const cart = getCart();
    cart.push({
      categoryId: category.id,
      categoryName: category.name,
      filters: activeFilters,
      quantity,
      priceCents: priceData?.totalCents ?? 0,
    });
    setCart(cart);
    toast.success("Adicionado ao carrinho!");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 w-64 bg-white/5 animate-pulse" />
        <div className="h-96 w-full bg-white/5 animate-pulse" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-500 text-sm">Categoria não encontrada</p>
        <button onClick={() => setLocation("/explore")} className="text-[#FF4500] text-xs font-mono uppercase tracking-widest mt-4 hover:underline">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setLocation("/explore")}
          className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-zinc-400" />
        </button>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 border border-white/10 flex items-center justify-center"
            style={{ backgroundColor: `${category.color ?? "#FF4500"}15` }}
          >
            <LucideIcon name={category.icon ?? "FolderOpen"} className="h-5 w-5" style={{ color: category.color ?? "#FF4500" }} />
          </div>
          <div>
            <h1 className="text-2xl font-light tracking-tight text-white">{category.name}</h1>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              {(leadCount ?? category.leadCount).toLocaleString("pt-BR")} leads disponíveis
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#050505] border border-white/10 p-5">
            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-5 border-b border-white/10 pb-3">
              <Filter className="h-3.5 w-3.5" />
              Filtros
            </div>
            <div className="space-y-4">
              {filterableFields.map((field: any) => (
                <FilterField
                  key={field.name}
                  field={field}
                  categoryId={category.id}
                  value={filters[field.name] ?? ""}
                  onChange={(val) => {
                    setFilters((prev) => ({ ...prev, [field.name]: val }));
                    setPage(1);
                  }}
                />
              ))}
              {filterableFields.length === 0 && (
                <p className="text-xs text-zinc-600">Nenhum filtro disponível</p>
              )}
              {Object.keys(activeFilters).length > 0 && (
                <button
                  onClick={() => { setFilters({}); setPage(1); }}
                  className="w-full py-2 text-[10px] uppercase tracking-widest text-zinc-400 border border-white/10 hover:bg-white/5 transition-colors"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>

          {/* Purchase Card */}
          <div className="relative p-[1px] bg-gradient-to-b from-[#FF4500]/50 to-transparent">
            <div className="bg-[#050505] border border-white/10 p-5">
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#FF4500] uppercase tracking-widest mb-5 border-b border-white/10 pb-3">
                <ShoppingCart className="h-3.5 w-3.5" />
                Comprar Leads
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">
                    Quantidade de leads
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={leadCount && leadCount > 0 ? leadCount : 1}
                    className="w-full px-3 py-2 bg-[#0F0F0F] border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF4500]/50 transition-colors"
                  />
                  <p className="text-[10px] font-mono text-zinc-600 mt-1 tracking-widest">
                    Máx: {(leadCount ?? 0).toLocaleString("pt-BR")} disponíveis
                  </p>
                </div>
                {priceData && (
                  <div className="bg-white/[0.03] border border-white/5 p-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Preço por lead</span>
                      <span className="text-zinc-300 font-mono">R$ {(priceData.pricePerLeadCents / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t border-white/5">
                      <span className="text-xs text-zinc-500">Total</span>
                      <span className="text-xl font-light text-white">R$ {(priceData.totalCents / 100).toFixed(2)}</span>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleAddToCart}
                  disabled={quantity < 1 || !priceData}
                  className="w-full py-3 text-[10px] uppercase tracking-widest text-white bg-[#FF4500] hover:bg-[#FF4500]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Adicionar ao Carrinho
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Leads Preview Table */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#050505] border border-white/10">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                <Eye className="h-3.5 w-3.5" />
                Amostra de Leads
              </div>
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest flex items-center gap-1.5">
                <Lock className="h-3 w-3" />
                Dados de contato mascarados
              </span>
            </div>

            {leadsLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 bg-white/5 animate-pulse" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/[0.03]">
                      {fields.slice(0, 7).map((f: any) => (
                        <th key={f.name} className="text-left p-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                          {f.label}
                          {f.isContact && <Lock className="inline h-2.5 w-2.5 ml-1 text-zinc-600" />}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leadsData?.leads.map((lead: any) => (
                      <tr key={lead.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                        {fields.slice(0, 7).map((f: any) => {
                          const val = String((lead.data as any)?.[f.name] ?? "-");
                          const isContact = contactFields.includes(f.name);
                          return (
                            <td key={f.name} className="p-3 max-w-[180px] truncate text-sm">
                              {isContact ? (
                                <span className="text-zinc-600 font-mono text-xs">{maskValue(val)}</span>
                              ) : (
                                <span className="text-zinc-300">{val}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {(!leadsData?.leads || leadsData.leads.length === 0) && (
                      <tr>
                        <td colSpan={Math.min(fields.length, 7)} className="p-0">
                          <EmptyState
                            icon={SearchX}
                            title="Nenhum lead encontrado"
                            description={Object.keys(activeFilters).length > 0 ? "Tente ajustar ou remover alguns filtros para encontrar mais resultados." : "Esta categoria ainda não possui leads cadastrados."}
                            actionLabel={Object.keys(activeFilters).length > 0 ? "Limpar Filtros" : undefined}
                            onAction={Object.keys(activeFilters).length > 0 ? () => { setFilters({}); setPage(1); } : undefined}
                            className="py-10"
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {leadsData && leadsData.total > 10 && (
            <Pagination
              page={page}
              totalPages={Math.ceil(leadsData.total / 10)}
              totalItems={leadsData.total}
              pageSize={10}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function FilterField({ field, categoryId, value, onChange }: {
  field: any;
  categoryId: number;
  value: string;
  onChange: (val: string) => void;
}) {
  const { data: options } = trpc.categories.getFilterOptions.useQuery(
    { categoryId, fieldName: field.name },
    { enabled: !!categoryId }
  );

  if (options && options.length > 0 && options.length <= 50) {
    return (
      <div>
        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5">{field.label}</label>
        <Select value={value || "__all__"} onValueChange={(v) => onChange(v === "__all__" ? "" : v)}>
          <SelectTrigger className="h-9 text-xs bg-[#0F0F0F] border-white/10">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent className="bg-[#0F0F0F] border-white/10">
            <SelectItem value="__all__">Todos</SelectItem>
            {options.map((opt: string) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div>
      <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5">{field.label}</label>
      <input
        className="w-full h-9 px-3 text-xs bg-[#0F0F0F] border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#FF4500]/50 transition-colors"
        placeholder={`Filtrar por ${field.label.toLowerCase()}...`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
