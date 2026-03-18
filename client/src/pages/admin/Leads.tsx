import { trpc } from "@/lib/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Trash2, Upload, Download, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/components/Pagination";
import { SectionTitle } from "@/components/Charts";

export default function AdminLeads() {
  const [categoryId, setCategoryId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const pageSize = 20;
  const [, setLocation] = useLocation();

  const { data: categories } = trpc.categories.listAll.useQuery();
  const { data: leadsData, isLoading } = trpc.leads.browse.useQuery(
    { categoryId: parseInt(categoryId), page, pageSize },
    { enabled: !!categoryId }
  );
  const { data: count } = trpc.leads.count.useQuery(
    { categoryId: parseInt(categoryId) },
    { enabled: !!categoryId }
  );
  const deleteLead = trpc.leads.remove.useMutation();
  const utils = trpc.useUtils();

  const selectedCategory = categories?.find((c) => c.id === parseInt(categoryId));
  const fields = useMemo(() => (selectedCategory?.fieldDefinitions as any[]) ?? [], [selectedCategory]);
  const totalPages = Math.ceil((count ?? 0) / pageSize);

  // Client-side search filter
  const filteredLeads = useMemo(() => {
    if (!leadsData?.leads) return [];
    if (!searchTerm.trim()) return leadsData.leads;
    const q = searchTerm.toLowerCase();
    return leadsData.leads.filter((lead: any) => {
      const data = lead.data as Record<string, any>;
      return Object.values(data).some((v) =>
        String(v).toLowerCase().includes(q)
      );
    });
  }, [leadsData, searchTerm]);

  const handleDelete = async (leadId: number) => {
    if (!confirm("Tem certeza que deseja excluir este lead?")) return;
    try {
      await deleteLead.mutateAsync({ leadId });
      toast.success("Lead excluído");
      utils.leads.browse.invalidate();
      utils.leads.count.invalidate();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao excluir");
    }
  };

  const handleExportCSV = () => {
    if (!leadsData?.leads?.length || !fields.length) return;
    const headers = fields.map((f: any) => f.label);
    const rows = leadsData.leads.map((lead: any) =>
      fields.map((f: any) => {
        const val = (lead.data as any)?.[f.name] ?? "";
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(",")
    );
    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${selectedCategory?.slug ?? "export"}-pagina-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] text-[#FF4500] uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#FF4500] rounded-full" />
            Gerenciamento
          </div>
          <h1 className="text-2xl font-light tracking-tight text-white">Gerenciar Leads</h1>
        </div>
        <div className="flex items-center gap-3">
          {count !== undefined && categoryId && (
            <span className="text-[10px] font-mono text-zinc-600 tracking-widest">
              Mostrando <span className="text-zinc-400">{filteredLeads.length}</span> de {count.toLocaleString("pt-BR")} leads
            </span>
          )}
          {categoryId && leadsData?.leads?.length ? (
            <button onClick={handleExportCSV} className="px-4 py-2 text-[10px] uppercase tracking-widest text-zinc-400 border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-2">
              <Download className="h-3.5 w-3.5" />
              Exportar
            </button>
          ) : null}
        </div>
      </div>

      {/* Category Selector + Search */}
      <div className="bg-[#0A0A0A] border border-white/[0.08] p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setPage(1); setSearchTerm(""); }}>
            <SelectTrigger className="w-72 bg-transparent border-white/[0.08] text-sm hover:border-white/15 transition-colors">
              <SelectValue placeholder="Selecione uma categoria..." />
            </SelectTrigger>
            <SelectContent className="bg-[#0F0F0F] border-white/10">
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color ?? "#FF4500" }} />
                    {cat.name}
                    <span className="text-[10px] font-mono text-zinc-500 ml-1">{cat.leadCount}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {categoryId && (
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
              <input
                type="text"
                placeholder="Buscar nos dados do lead..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border border-white/[0.08] pl-9 pr-4 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-[#FF4500]/30 transition-colors font-mono text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {!categoryId && (
        <EmptyState
          icon={Database}
          title="Selecione uma categoria"
          description="Escolha uma categoria no seletor acima para visualizar e gerenciar os leads cadastrados."
        />
      )}

      {categoryId && isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 bg-[#0A0A0A] border border-white/[0.08] animate-pulse" />)}
        </div>
      )}

      {categoryId && !isLoading && leadsData && filteredLeads.length === 0 && (
        <EmptyState
          icon={searchTerm ? Search : Upload}
          title={searchTerm ? "Nenhum resultado" : "Nenhum lead nesta categoria"}
          description={searchTerm ? "Tente ajustar o termo de busca." : `A categoria "${selectedCategory?.name}" ainda não possui leads.`}
          actionLabel={searchTerm ? undefined : "Fazer Upload"}
          onAction={searchTerm ? undefined : () => setLocation("/admin/upload")}
        />
      )}

      {categoryId && !isLoading && filteredLeads.length > 0 && (
        <>
          <div className="bg-[#0A0A0A] border border-white/[0.08]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest w-12">#</th>
                    {fields.slice(0, 6).map((f: any) => (
                      <th key={f.name} className="text-left p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest whitespace-nowrap">{f.label}</th>
                    ))}
                    <th className="text-right p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest w-20">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead: any, idx: number) => (
                    <tr key={lead.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-zinc-600 text-xs font-mono">{(page - 1) * pageSize + idx + 1}</td>
                      {fields.slice(0, 6).map((f: any) => (
                        <td key={f.name} className="p-4 max-w-[200px] truncate text-zinc-300 text-sm">
                          {(lead.data as any)?.[f.name] ?? "-"}
                        </td>
                      ))}
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/30 transition-colors ml-auto"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-zinc-500 hover:text-red-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={count ?? 0}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
