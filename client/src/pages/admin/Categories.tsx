import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2, FolderOpen, Layers } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import LucideIcon from "@/components/LucideIcon";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminCategories() {
  const { data: categories, isLoading } = trpc.categories.listAll.useQuery();
  const createCategory = trpc.categories.create.useMutation();
  const updateCategory = trpc.categories.update.useMutation();
  const utils = trpc.useUtils();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", color: "#FF4500", icon: "" });

  const handleSubmit = async () => {
    try {
      if (editId) {
        await updateCategory.mutateAsync({ id: editId, ...form });
        toast.success("Categoria atualizada");
      } else {
        await createCategory.mutateAsync(form);
        toast.success("Categoria criada");
      }
      utils.categories.listAll.invalidate();
      setOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message ?? "Erro");
    }
  };

  const resetForm = () => {
    setEditId(null);
    setForm({ name: "", slug: "", description: "", color: "#FF4500", icon: "" });
  };

  const openEdit = (cat: any) => {
    setEditId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description ?? "", color: cat.color ?? "#FF4500", icon: cat.icon ?? "" });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] text-[#FF4500] uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#FF4500] rounded-full" />
            Gerenciamento
          </div>
          <h1 className="text-2xl font-light tracking-tight text-white">Categorias</h1>
          <p className="text-[10px] font-mono text-zinc-500 mt-2 uppercase tracking-widest">Gerencie os nichos de leads</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <button className="px-4 py-2.5 text-[10px] uppercase tracking-widest text-white bg-[#FF4500] hover:bg-[#FF4500]/90 transition-colors flex items-center gap-2">
              <Plus className="h-3.5 w-3.5" /> Nova Categoria
            </button>
          </DialogTrigger>
          <DialogContent className="bg-[#0F0F0F] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white font-light">{editId ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5">Nome</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Consórcios"
                  className="w-full px-3 py-2 bg-[#050505] border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#FF4500]/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5">Slug</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="Ex: consorcios"
                  className="w-full px-3 py-2 bg-[#050505] border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#FF4500]/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5">Descrição</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descrição breve"
                  className="w-full px-3 py-2 bg-[#050505] border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#FF4500]/50 transition-colors"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5">Cor</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-9 w-9 border border-white/10 cursor-pointer bg-transparent" />
                    <input
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="flex-1 px-3 py-2 bg-[#050505] border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-[#FF4500]/50 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5">Ícone (Lucide)</label>
                  <input
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    placeholder="FolderOpen"
                    className="w-full px-3 py-2 bg-[#050505] border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#FF4500]/50 transition-colors"
                  />
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!form.name || !form.slug}
                className="w-full py-3 text-[10px] uppercase tracking-widest text-white bg-[#FF4500] hover:bg-[#FF4500]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editId ? "Salvar Alterações" : "Criar Categoria"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {categories && categories.length === 0 && (
        <EmptyState
          icon={Layers}
          title="Nenhuma categoria criada"
          description="Crie sua primeira categoria de leads para começar a organizar seus dados."
          actionLabel="Criar Categoria"
          onAction={() => setOpen(true)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories?.map((cat) => (
          <div key={cat.id} className="bg-[#050505] border border-white/10 p-5 hover:border-white/20 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 border border-white/10 flex items-center justify-center"
                  style={{ backgroundColor: `${cat.color ?? "#FF4500"}15` }}
                >
                  <LucideIcon
                    name={cat.icon ?? "FolderOpen"}
                    className="h-5 w-5"
                    style={{ color: cat.color ?? "#FF4500" }}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">{cat.name}</h3>
                  <p className="text-[10px] font-mono text-zinc-600 tracking-widest">{cat.slug}</p>
                </div>
              </div>
              <button
                onClick={() => openEdit(cat)}
                className="w-8 h-8 border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <Edit2 className="h-3 w-3 text-zinc-500" />
              </button>
            </div>
            {cat.description && <p className="text-sm text-zinc-400 font-light mt-3 leading-relaxed">{cat.description}</p>}
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/10">
              <span className="text-[10px] font-mono text-[#FF4500] uppercase tracking-widest">
                {cat.leadCount.toLocaleString("pt-BR")} leads
              </span>
              <span className={`text-[10px] font-mono uppercase tracking-widest ${cat.isActive ? "text-emerald-500" : "text-zinc-600"}`}>
                {cat.isActive ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
