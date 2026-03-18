import { trpc } from "@/lib/trpc";
import LucideIcon from "@/components/LucideIcon";
import { Search as SearchIcon, ArrowRight, SearchX } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/components/Pagination";
import { useState } from "react";
import { useLocation, useSearch } from "wouter";

export default function SearchPage() {
  const searchParams = useSearch();
  const params = new URLSearchParams(searchParams);
  const initialQuery = params.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [, setLocation] = useLocation();

  const { data, isLoading } = trpc.leads.search.useQuery(
    { query: searchTerm, page, pageSize: 20 },
    { enabled: searchTerm.length > 0 }
  );

  const handleSearch = () => {
    if (query.trim()) {
      setSearchTerm(query.trim());
      setPage(1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  const maskValue = (val: string) => {
    if (!val || val.length < 4) return "***";
    return val.slice(0, 3) + "***" + val.slice(-2);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-[10px] text-[#FF4500] uppercase tracking-widest mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#FF4500] rounded-full" />
          Busca
        </div>
        <h1 className="text-2xl font-light tracking-tight text-white">Busca Global</h1>
        <p className="text-[10px] font-mono text-zinc-500 mt-2 uppercase tracking-widest">
          Pesquise leads em todas as categorias simultaneamente.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xl">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
          <input
            placeholder="Buscar por nome, cidade, empresa..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-9 pr-4 py-2.5 bg-[#050505] border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#FF4500]/50 transition-colors"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!query.trim()}
          className="px-5 py-2.5 text-[10px] uppercase tracking-widest text-white bg-[#FF4500] hover:bg-[#FF4500]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Buscar
        </button>
      </div>

      {/* Results */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-20 bg-white/5 animate-pulse" />)}
        </div>
      )}

      {!isLoading && searchTerm && data && (
        <div className="space-y-4">
          <p className="text-xs text-zinc-400">
            {data.total} resultado{data.total !== 1 ? "s" : ""} encontrado{data.total !== 1 ? "s" : ""} para{" "}
            <span className="text-white">"{searchTerm}"</span>
          </p>

          {data.leads.length === 0 && (
            <EmptyState
              icon={SearchX}
              title="Nenhum resultado encontrado"
              description={`Não encontramos leads para "${searchTerm}". Tente termos diferentes ou mais genéricos.`}
              actionLabel="Limpar busca"
              onAction={() => { setQuery(""); setSearchTerm(""); }}
            />
          )}

          <div className="space-y-2">
            {data.leads.map((lead: any) => {
              const leadData = lead.data as Record<string, unknown>;
              const previewFields = Object.entries(leadData).slice(0, 4);
              return (
                <div key={lead.id} className="bg-[#050505] border border-white/10 p-4 hover:border-white/20 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-9 h-9 border border-white/10 flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${lead.categoryColor ?? "#FF4500"}15` }}
                      >
                        <LucideIcon
                          name={lead.categoryIcon ?? "FolderOpen"}
                          className="h-4 w-4"
                          style={{ color: lead.categoryColor ?? "#FF4500" }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border"
                            style={{
                              color: lead.categoryColor ?? "#FF4500",
                              borderColor: `${lead.categoryColor ?? "#FF4500"}40`,
                              backgroundColor: `${lead.categoryColor ?? "#FF4500"}10`,
                            }}
                          >
                            {lead.categoryName}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                          {previewFields.map(([key, val]) => (
                            <span key={key} className="truncate">
                              <span className="text-zinc-400">{key}:</span>{" "}
                              {maskValue(String(val ?? ""))}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setLocation(`/explore/${lead.categorySlug}`)}
                      className="shrink-0 ml-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-[#FF4500] transition-colors flex items-center gap-1"
                    >
                      Ver Categoria
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={data.total}
              pageSize={20}
              onPageChange={setPage}
            />
          )}
        </div>
      )}

      {!searchTerm && (
        <EmptyState
          icon={SearchIcon}
          title="Digite algo para buscar"
          description="Busque por nome, cidade, empresa ou qualquer informação do lead em todas as categorias."
        />
      )}
    </div>
  );
}
