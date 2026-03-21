import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mic, MicOff, Upload, Loader2, Copy, FileAudio } from "lucide-react";
import { useState, useRef } from "react";

export default function AudioPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const uploadMutation = trpc.voice.upload.useMutation();
  const transcribeMutation = trpc.voice.transcribe.useMutation({
    onSuccess: (data) => {
      setTranscription(data.text);
      toast.success(`Audio transcrito! (${Math.round(data.duration || 0)}s)`);
    },
    onError: (e) => toast.error(e.message),
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size > 16 * 1024 * 1024) {
          toast.error("Audio muito grande (max 16MB). Tente gravar um trecho menor.");
          return;
        }
        await processAudio(blob, "audio/webm");
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Gravando... Fale sobre sua experiencia profissional.");
    } catch {
      toast.error("Nao foi possivel acessar o microfone. Verifique as permissoes.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) {
      toast.error("Arquivo muito grande (max 16MB).");
      return;
    }
    const validTypes = ["audio/webm", "audio/mp3", "audio/mpeg", "audio/wav", "audio/ogg", "audio/m4a", "audio/mp4"];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato nao suportado. Use MP3, WAV, WebM, OGG ou M4A.");
      return;
    }
    await processAudio(file, file.type);
  };

  const processAudio = async (blob: Blob, mimeType: string) => {
    try {
      toast.info("Enviando audio...");
      const buffer = await blob.arrayBuffer();
      const base64 = btoa(Array.from(new Uint8Array(buffer), b => String.fromCharCode(b)).join(''));
      const { url } = await uploadMutation.mutateAsync({ base64, mimeType });
      toast.info("Transcrevendo...");
      await transcribeMutation.mutateAsync({ audioUrl: url, language: "pt" });
    } catch {
      toast.error("Erro ao processar audio.");
    }
  };

  const copyText = () => {
    navigator.clipboard.writeText(transcription);
    toast.success("Texto copiado!");
  };

  const isProcessing = uploadMutation.isPending || transcribeMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Input por Audio</h1>
        <p className="text-muted-foreground">Grave ou envie um audio descrevendo sua experiencia. A IA transcreve automaticamente.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Gravar Audio</CardTitle>
            <CardDescription>Clique para gravar e fale sobre sua experiencia profissional, habilidades e objetivos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4 py-8">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`h-24 w-24 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? "bg-destructive text-destructive-foreground animate-pulse shadow-lg shadow-destructive/30"
                    : "bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/30"
                } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isRecording ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
              </button>
              <p className="text-sm text-muted-foreground">
                {isRecording ? "Gravando... Clique para parar" : isProcessing ? "Processando audio..." : "Clique para iniciar a gravacao"}
              </p>
              {isProcessing && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enviar Arquivo de Audio</CardTitle>
            <CardDescription>Envie um arquivo MP3, WAV, WebM, OGG ou M4A (max 16MB).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <FileAudio className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Clique para selecionar arquivo</p>
              <p className="text-xs text-muted-foreground mt-1">MP3, WAV, WebM, OGG, M4A</p>
              <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} disabled={isProcessing} />
            </label>
          </CardContent>
        </Card>
      </div>

      {transcription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Transcricao</CardTitle>
              <Button variant="outline" size="sm" onClick={copyText}>
                <Copy className="h-4 w-4 mr-2" /> Copiar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea rows={8} value={transcription} readOnly className="bg-muted" />
            <p className="text-xs text-muted-foreground mt-2">
              Voce pode copiar este texto e colar nos campos do formulario de curriculo.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
