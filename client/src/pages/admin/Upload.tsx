import { trpc } from "@/lib/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload as UploadIcon, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight, Loader2, Sparkles, FileUp, XCircle } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type MappingResult = {
  mapping: Record<string, string | null>;
  newFields: Array<{
    name: string;
    label: string;
    type: string;
    filterable: boolean;
    isContact: boolean;
  }>;
};

type Step = "select" | "upload" | "mapping" | "processing" | "done";

export default function AdminUpload() {
  const [step, setStep] = useState<Step>("select");
  const [categoryId, setCategoryId] = useState<string>("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [originalColumns, setOriginalColumns] = useState<string[]>([]);
  const [batchId, setBatchId] = useState("");
  const [mappingResult, setMappingResult] = useState<MappingResult | null>(null);
  const [editedMapping, setEditedMapping] = useState<Record<string, string>>({});
  const [processResult, setProcessResult] = useState<{ processed: number; total: number } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<"sending" | "analyzing" | "">("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories } = trpc.categories.listAll.useQuery();
  const initBatch = trpc.upload.initBatch.useMutation();
  const analyzeColumns = trpc.upload.analyzeColumns.useMutation();
  const processLeads = trpc.upload.processLeads.useMutation();

  useEffect(() => {
    if (uploadPhase === "sending") {
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 45) { clearInterval(interval); return 45; }
          return prev + Math.random() * 8;
        });
      }, 200);
      return () => clearInterval(interval);
    }
    if (uploadPhase === "analyzing") {
      setUploadProgress(50);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) { clearInterval(interval); return 90; }
          return prev + Math.random() * 5;
        });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [uploadPhase]);

  useEffect(() => {
    if (step === "processing") {
      setProcessingProgress(0);
      const totalEstimate = Math.max(2000, parsedRows.length * 10);
      const interval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 92) { clearInterval(interval); return 92; }
          const increment = (100 / (totalEstimate / 150)) * (0.5 + Math.random());
          return Math.min(prev + increment, 92);
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [step, parsedRows.length]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const parseFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    let rows: Record<string, string>[] = [];
    let cols: string[] = [];

    if (ext === "csv" || ext === "txt") {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) { toast.error("Arquivo vazio ou sem dados"); return; }
      const separator = text.includes(";") ? ";" : ",";
      cols = lines[0].split(separator).map((c) => c.trim().replace(/^"|"$/g, ""));
      rows = lines.slice(1).map((line) => {
        const values = line.split(separator).map((v) => v.trim().replace(/^"|"$/g, ""));
        const row: Record<string, string> = {};
        cols.forEach((col, i) => { row[col] = values[i] ?? ""; });
        return row;
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
      if (jsonData.length === 0) { toast.error("Planilha vazia"); return; }
      cols = Object.keys(jsonData[0]);
      rows = jsonData.map((row: Record<string, string>) => {
        const r: Record<string, string> = {};
        cols.forEach((c) => { r[c] = String(row[c] ?? ""); });
        return r;
      });
    } else if (ext === "json") {
      const text = await file.text();
      const data = JSON.parse(text);
      const arr = Array.isArray(data) ? data : [data];
      if (arr.length === 0) { toast.error("JSON vazio"); return; }
      cols = Array.from(new Set(arr.flatMap((item: any) => Object.keys(item))));
      rows = arr.map((item: any) => {
        const r: Record<string, string> = {};
        cols.forEach((c) => { r[c] = String(item[c] ?? ""); });
        return r;
      });
    } else {
      toast.error("Formato não suportado. Use CSV, Excel, TXT ou JSON.");
      return;
    }

    setOriginalColumns(cols);
    setParsedRows(rows);
    setFileName(file.name);
    setFileSize(file.size);
    return { rows, cols };
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!categoryId) { toast.error("Selecione uma categoria primeiro"); return; }
    const result = await parseFile(file);
    if (!result) return;
    setStep("upload");
    setUploadPhase("sending");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const res = await initBatch.mutateAsync({
          categoryId: parseInt(categoryId),
          fileName: file.name,
          fileContent: base64,
        });
        setBatchId(res.batchId);
        setUploadPhase("analyzing");
        const mapping = await analyzeColumns.mutateAsync({
          batchId: res.batchId,
          sampleRows: result.rows.slice(0, 10),
          originalColumns: result.cols,
        });
        setMappingResult(mapping);
        const initial: Record<string, string> = {};
        for (const [col, field] of Object.entries(mapping.mapping)) {
          if (field) initial[col] = field as string;
        }
        for (const [col, field] of Object.entries(mapping.mapping)) {
          if (!field) {
            const newField = mapping.newFields.find(
              (f: any) => f.label.toLowerCase().includes(col.toLowerCase()) || col.toLowerCase().includes(f.name)
            );
            if (newField) initial[col] = newField.name;
          }
        }
        setEditedMapping(initial);
        setUploadProgress(100);
        setTimeout(() => {
          setStep("mapping");
          setUploadPhase("");
        }, 400);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao processar arquivo");
      setStep("select");
      setUploadPhase("");
    }
  }, [categoryId, parseFile, initBatch, analyzeColumns]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await processFile(file);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      await processFile(file);
    },
    [processFile]
  );

  const handleProcess = useCallback(async () => {
    if (!batchId || parsedRows.length === 0) return;
    setStep("processing");
    setProcessingProgress(0);
    try {
      const result = await processLeads.mutateAsync({
        batchId,
        mapping: editedMapping,
        newFields: mappingResult?.newFields?.map((f) => ({
          ...f,
          type: f.type as any,
        })),
        rows: parsedRows,
      });
      setProcessingProgress(100);
      setTimeout(() => {
        setProcessResult(result);
        setStep("done");
        toast.success(`${result.processed} leads importados com sucesso!`);
      }, 500);
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao processar leads");
      setStep("mapping");
    }
  }, [batchId, parsedRows, editedMapping, mappingResult, processLeads]);

  const reset = () => {
    setStep("select");
    setCategoryId("");
    setFileName("");
    setFileSize(0);
    setParsedRows([]);
    setOriginalColumns([]);
    setBatchId("");
    setMappingResult(null);
    setEditedMapping({});
    setProcessResult(null);
    setUploadProgress(0);
    setUploadPhase("");
    setProcessingProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectedCategory = categories?.find((c) => c.id === parseInt(categoryId));

  const steps: { key: Step; label: string }[] = [
    { key: "select", label: "Categoria" },
    { key: "upload", label: "Upload" },
    { key: "mapping", label: "Mapeamento IA" },
    { key: "processing", label: "Processando" },
    { key: "done", label: "Concluído" },
  ];
  const stepKeys: Step[] = ["select", "upload", "mapping", "processing", "done"];
  const currentIdx = stepKeys.indexOf(step);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="font-mono text-[10px] text-[#FF4500] uppercase tracking-widest mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#FF4500] rounded-full" />
          Importação
        </div>
        <h1 className="text-2xl font-light tracking-tight text-white">Upload de Leads</h1>
        <p className="text-xs font-mono text-zinc-500 mt-2 uppercase tracking-widest">
          Envie arquivos CSV, Excel, TXT ou JSON. A IA mapeia automaticamente as colunas.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 text-sm">
        {steps.map((s, i, arr) => {
          const stepIdx = stepKeys.indexOf(s.key);
          const isActive = stepIdx === currentIdx;
          const isDone = stepIdx < currentIdx;
          return (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`h-7 w-7 flex items-center justify-center text-xs font-mono transition-colors ${
                  isDone
                    ? "bg-[#FF4500] text-white"
                    : isActive
                    ? "bg-[#FF4500]/20 text-[#FF4500] border border-[#FF4500]/50"
                    : "bg-white/5 text-zinc-600 border border-white/10"
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`hidden sm:inline text-xs ${isActive ? "text-white" : "text-zinc-600"}`}>
                {s.label}
              </span>
              {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-zinc-700" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Select Category + File Upload */}
      {step === "select" && (
        <div className="bg-[#050505] border border-white/10 p-6 space-y-5">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-lg font-light text-white">Selecione a Categoria</h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
              Escolha em qual nicho os leads serão importados
            </p>
          </div>

          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-full max-w-md bg-[#0F0F0F] border-white/10 text-white">
              <SelectValue placeholder="Selecione uma categoria..." />
            </SelectTrigger>
            <SelectContent className="bg-[#0F0F0F] border-white/10">
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5" style={{ backgroundColor: cat.color ?? "#FF4500" }} />
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {categoryId && (
            <div
              className={`relative border border-dashed p-10 text-center transition-all cursor-pointer ${
                dragOver
                  ? "border-[#FF4500] bg-[#FF4500]/5"
                  : "border-white/20 hover:border-[#FF4500]/50 hover:bg-white/[0.02]"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.json,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 border border-white/10 bg-[#0F0F0F] flex items-center justify-center">
                  <FileUp className="h-6 w-6 text-[#FF4500]" />
                </div>
                <div>
                  <p className="text-sm font-light text-white">
                    {dragOver ? "Solte o arquivo aqui" : "Arraste ou clique para enviar"}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-500 mt-2 uppercase tracking-widest">
                    CSV, Excel (.xlsx/.xls), JSON ou TXT — até 50MB
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Uploading */}
      {step === "upload" && (
        <div className="bg-[#050505] border border-white/10 p-8">
          <div className="max-w-md mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 border border-white/10 bg-[#0F0F0F] flex items-center justify-center shrink-0">
                <FileSpreadsheet className="h-5 w-5 text-[#FF4500]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-light text-white truncate">{fileName}</p>
                <p className="text-[10px] font-mono text-zinc-500 tracking-widest">
                  {formatFileSize(fileSize)} — {parsedRows.length.toLocaleString("pt-BR")} registros
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  {uploadPhase === "sending" && "Enviando arquivo..."}
                  {uploadPhase === "analyzing" && "IA analisando colunas..."}
                </span>
                <span className="text-[10px] font-mono text-white tabular-nums">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="h-1 bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-[#FF4500] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              {uploadPhase === "sending" && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FF4500]" />
                  <span>Fazendo upload para armazenamento seguro...</span>
                </>
              )}
              {uploadPhase === "analyzing" && (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-[#FF4500] animate-pulse" />
                  <span>Inteligência artificial identificando campos...</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Mapping Review */}
      {step === "mapping" && mappingResult && (
        <div className="bg-[#050505] border border-white/10 p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Sparkles className="h-4 w-4 text-[#FF4500]" />
            <div>
              <h3 className="text-lg font-light text-white">Mapeamento Inteligente</h3>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
                A IA mapeou as colunas do seu arquivo. Revise e ajuste se necessário.
              </p>
            </div>
          </div>

          <div className="border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th className="text-left p-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Coluna do Arquivo</th>
                  <th className="text-left p-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Mapeado Para</th>
                  <th className="text-left p-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody>
                {originalColumns.map((col) => {
                  const mapped = editedMapping[col];
                  const isNew = mapped && mappingResult.newFields.some((f) => f.name === mapped);
                  return (
                    <tr key={col} className="border-t border-white/5">
                      <td className="p-3 font-mono text-xs text-zinc-300">{col}</td>
                      <td className="p-3">
                        <Select
                          value={mapped || "__ignore__"}
                          onValueChange={(val) => {
                            setEditedMapping((prev) => {
                              const next = { ...prev };
                              if (val === "__ignore__") delete next[col];
                              else next[col] = val;
                              return next;
                            });
                          }}
                        >
                          <SelectTrigger className="w-48 h-8 text-xs bg-[#0F0F0F] border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0F0F0F] border-white/10">
                            <SelectItem value="__ignore__">
                              <span className="text-zinc-500">Ignorar</span>
                            </SelectItem>
                            {selectedCategory &&
                              (selectedCategory.fieldDefinitions as any[])?.map((f: any) => (
                                <SelectItem key={f.name} value={f.name}>
                                  {f.label}
                                </SelectItem>
                              ))}
                            {mappingResult.newFields.map((f) => (
                              <SelectItem key={f.name} value={f.name}>
                                {f.label} (novo)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        {mapped ? (
                          <span className={`text-[10px] font-mono uppercase tracking-widest ${isNew ? "text-zinc-400" : "text-[#FF4500]"}`}>
                            {isNew ? "Novo campo" : "Mapeado"}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
                            Ignorado
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Preview */}
          <div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">
              Prévia dos dados ({Math.min(3, parsedRows.length)} de {parsedRows.length.toLocaleString("pt-BR")})
            </p>
            <div className="border border-white/10 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/[0.03]">
                    {Object.values(editedMapping).map((field) => (
                      <th key={field} className="text-left p-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                        {field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, 3).map((row, i) => (
                    <tr key={i} className="border-t border-white/5">
                      {Object.entries(editedMapping).map(([col, field]) => (
                        <td key={`${i}-${field}`} className="p-2 whitespace-nowrap max-w-[200px] truncate text-zinc-300">
                          {row[col] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={reset}
              className="px-5 py-2.5 text-[10px] uppercase tracking-widest text-zinc-400 border border-white/10 hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleProcess}
              disabled={Object.keys(editedMapping).length === 0}
              className="px-5 py-2.5 text-[10px] uppercase tracking-widest text-white bg-[#FF4500] hover:bg-[#FF4500]/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Confirmar e Importar {parsedRows.length.toLocaleString("pt-BR")} Leads
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Processing */}
      {step === "processing" && (
        <div className="bg-[#050505] border border-white/10 p-8">
          <div className="max-w-md mx-auto space-y-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 border border-[#FF4500]/30 bg-[#FF4500]/10 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-[#FF4500] animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-lg font-light text-white">Importando Leads</p>
                <p className="text-[10px] font-mono text-zinc-500 mt-2 uppercase tracking-widest">
                  Processando {parsedRows.length.toLocaleString("pt-BR")} registros na categoria{" "}
                  <span className="text-[#FF4500]">{selectedCategory?.name}</span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  {processingProgress < 30 && "Validando dados (CPF, e-mail, telefone)..."}
                  {processingProgress >= 30 && processingProgress < 60 && "Enriquecendo e classificando leads..."}
                  {processingProgress >= 60 && processingProgress < 90 && "Salvando no banco de dados..."}
                  {processingProgress >= 90 && "Finalizando..."}
                </span>
                <span className="text-[10px] font-mono text-white tabular-nums">{Math.round(processingProgress)}%</span>
              </div>
              <div className="h-1 bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-[#FF4500] transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            </div>

            <p className="text-[10px] text-center font-mono text-zinc-600 uppercase tracking-widest">
              Não feche esta página. O tempo depende da quantidade de registros.
            </p>
          </div>
        </div>
      )}

      {/* Step 5: Done */}
      {step === "done" && processResult && (
        <div className="relative p-[1px] bg-gradient-to-b from-[#FF4500]/50 to-transparent">
          <div className="bg-[#050505] border border-white/10 p-12 flex flex-col items-center gap-5">
            <div className="w-16 h-16 bg-[#FF4500]/10 border border-[#FF4500]/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-[#FF4500]" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-xl font-light text-white">Importação Concluída</p>
              <p className="text-zinc-400 text-sm font-light">
                <span className="text-2xl font-light text-white">{processResult.processed.toLocaleString("pt-BR")}</span>
                {" "}de {processResult.total.toLocaleString("pt-BR")} leads importados com sucesso
              </p>
              <span
                className="inline-block mt-2 text-[10px] font-mono uppercase tracking-widest px-3 py-1 border"
                style={{
                  color: selectedCategory?.color ?? "#FF4500",
                  borderColor: `${selectedCategory?.color ?? "#FF4500"}40`,
                  backgroundColor: `${selectedCategory?.color ?? "#FF4500"}10`,
                }}
              >
                {selectedCategory?.name}
              </span>
            </div>
            {processResult.processed < processResult.total && (
              <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-4 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{processResult.total - processResult.processed} registros ignorados (dados inválidos ou duplicados)</span>
              </div>
            )}
            <button
              onClick={reset}
              className="mt-2 px-6 py-3 text-[10px] uppercase tracking-widest text-white bg-[#FF4500] hover:bg-[#FF4500]/90 transition-colors flex items-center gap-2"
            >
              <UploadIcon className="h-3.5 w-3.5" />
              Importar Mais Leads
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
