import { trpc } from "@/lib/trpc";
import { Database, ArrowRight, Search, FolderSearch, Zap, Tag, Heart } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import LucideIcon from "@/components/LucideIcon";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function Explore() {
  const { data: categories, isLoading } = trpc.categories.list.useQuery();
  const { data: favs } = trpc.favorites.list.useQuery();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const utils = trpc.useUtils();

  const toggleFav = trpc.favorites.toggle.useMutation({
    onMutate: async ({ categoryId }) => {
      await utils.favorites.list.cancel();
      const prev = utils.favorites.list.getData();
      const isFav = prev?.some((f: any) => f.categoryId === categoryId);
      if (isFav) {
        utils.favorites.list.setData(undefined, prev?.filter((f: any) => f.categoryId !== categoryId) ?? []);
      } else {
        const cat = categories?.find((c) => c.id === categoryId);
        utils.favorites.list.setData(undefined, [
          ...(prev ?? []),
          { id: Date.now(), categoryId, categoryName: cat?.name ?? null, categorySlug: cat?.slug ?? null, categoryColor: cat?.color ?? null, categoryIcon: cat?.icon ?? null, categoryLeadCount: cat?.leadCount ?? 0, categoryDescription: cat?.description ?? null, createdAt: new Date() },
        ]);
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.favorites.list.setData(undefined, ctx.prev);
      toast.error("Erro ao atualizar favorito");
    },
    onSettled: () => {
      utils.favorites.list.invalidate();
    },
  });

  const favCategoryIds = useMemo(() => new Set(favs?.map((f: any) => f.categoryId) ?? []), [favs]);

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        (cat.description ?? "").toLowerCase().includes(q)
    );
  }, [categories, search]);

  const totalLeads = categories?.reduce((sum, cat) => sum + cat.leadCount, 0) ?? 0;
  const totalCategories = categories?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative bg-[#050505] border border-white/[0.08] p-8 md:p-10 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "linear-gradient(to bottom, black 0%, transparent 80%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 80%)",
          }}
        />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF4500]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-xl">
              <div className="font-mono text-[10px] text-[#FF4500] uppercase tracking-widest mb-3 flex items-center gap-2">
                <Zap className="h-3.5 w-3.5" />
                Catálogo de Leads
              </div>
              <h1 className="text-2xl md:text-3xl font-light tracking-tight text-white">
                Encontre os leads certos para o seu negócio
              </h1>
              <p className="text-xs font-mono text-zinc-500 mt-3 uppercase tracking-widest leading-relaxed">
                Explore categorias segmentadas, visualize campos disponíveis e compre listas prontas.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xl font-light text-white tabular-nums">{totalCategories}</p>
                <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Categorias</p>
              </div>
              <div className="w-px h-10 bg-white/[0.08]" />
              <div className="text-center">
                <p className="text-xl font-light text-white tabular-nums">{totalLeads.toLocaleString("pt-BR")}</p>
                <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Leads</p>
              </div>
              {favCategoryIds.size > 0 && (
                <>
                  <div className="w-px h-10 bg-white/[0.08]" />
                  <div className="text-center">
                    <p className="text-xl font-light text-[#FF4500] tabular-nums">{favCategoryIds.size}</p>
                    <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Favoritos</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#0A0A0A] border border-white/[0.08] p-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
            <input
              placeholder="Buscar categoria por nome ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-transparent border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#FF4500]/30 transition-colors font-mono text-xs"
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest hover:text-white transition-colors px-3 py-2 border border-white/[0.08] hover:border-white/15"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Categories Grid */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 bg-[#0A0A0A] border border-white/[0.08] animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => {
            const fields = (cat.fieldDefinitions as any[]) ?? [];
            const fieldNames = fields.slice(0, 4).map((f: any) => f.label || f.name);
            const moreFields = fields.length > 4 ? fields.length - 4 : 0;
            const isFav = favCategoryIds.has(cat.id);

            return (
              <div
                key={cat.id}
                className="bg-[#0A0A0A] border border-white/[0.08] hover:border-white/15 transition-all duration-300 group cursor-pointer relative overflow-hidden"
                onClick={() => setLocation(`/explore/${cat.slug}`)}
              >
                {/* Accent top line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ backgroundColor: cat.color ?? "#FF4500" }}
                />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat.color ?? "#FF4500"}15`, border: `1px solid ${cat.color ?? "#FF4500"}25` }}
                      >
                        <LucideIcon
                          name={cat.icon ?? "FolderOpen"}
                          className="h-5 w-5"
                          style={{ color: cat.color ?? "#FF4500" }}
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white group-hover:text-white/90 transition-colors">{cat.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono tracking-widest text-zinc-500">
                            {cat.leadCount.toLocaleString("pt-BR")} leads
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Favorite Button */}
                    {user && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFav.mutate({ categoryId: cat.id });
                        }}
                        className={`p-1.5 rounded-lg transition-all duration-200 ${
                          isFav
                            ? "text-[#FF4500] bg-[#FF4500]/10"
                            : "text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.04]"
                        }`}
                        title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      >
                        <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
                      </button>
                    )}
                  </div>

                  {/* Description */}
                  {cat.description && (
                    <p className="text-xs text-zinc-500 leading-relaxed mb-3 line-clamp-2">
                      {cat.description}
                    </p>
                  )}

                  {/* Field Tags */}
                  {fieldNames.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {fieldNames.map((name: string) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono text-zinc-500 uppercase tracking-widest bg-white/[0.03] border border-white/[0.06]"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {name}
                        </span>
                      ))}
                      {moreFields > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                          +{moreFields}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF4500] group-hover:underline">
                      Ver Leads
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-[#FF4500] group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </div>
            );
          })}

          {filteredCategories.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={search ? FolderSearch : Database}
                title={search ? "Nenhuma categoria encontrada" : "Nenhuma categoria disponível"}
                description={search ? `Não encontramos categorias para "${search}". Tente outro termo.` : "Novas categorias de leads serão adicionadas em breve. Volte depois!"}
                actionLabel={search ? "Limpar busca" : undefined}
                onAction={search ? () => setSearch("") : undefined}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
