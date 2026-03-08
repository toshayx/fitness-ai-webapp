import { useState, useEffect, useRef } from "react";
import { Camera, Send, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { AIModel, AnalyzeResponse } from "@/lib/types";

interface Props {
  onResult: (result: AnalyzeResponse, description: string) => void;
}

export default function FoodInput({ onResult }: Props) {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getModels().then((m) => {
      setModels(m);
      const saved = localStorage.getItem("preferred_model");
      if (saved && m.some((mod) => mod.id === saved)) {
        setSelectedModel(saved);
      } else if (m.length) {
        setSelectedModel(m[0].id);
      }
    });
  }, []);

  const handleModelChange = (id: string) => {
    setSelectedModel(id);
    localStorage.setItem("preferred_model", id);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!text.trim() && !imageBase64) return;
    setError("");
    setLoading(true);
    try {
      const result = await api.analyzeFood(
        text.trim() || null,
        imageBase64,
        selectedModel,
      );
      onResult(result, text.trim() || "Image upload");
      setText("");
      clearImage();
    } catch (err: any) {
      setError(err.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <select
          value={selectedModel}
          onChange={(e) => handleModelChange(e.target.value)}
          className="bg-surface-alt border border-border rounded-lg px-2 py-1.5 text-xs text-text-muted focus:outline-none focus:border-primary"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {imagePreview && (
        <div className="relative inline-block">
          <img
            src={imagePreview}
            alt="Food preview"
            className="max-h-32 rounded-lg border border-border"
          />
          <button
            onClick={clearImage}
            className="absolute -top-1.5 -right-1.5 bg-danger text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
          >
            x
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your food... (e.g. 'grilled chicken breast with rice and salad')"
          rows={2}
          className="flex-1 bg-surface-alt border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary transition-colors"
        />
        <div className="flex flex-col gap-1.5">
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="p-2.5 bg-surface-alt border border-border rounded-lg text-text-muted hover:text-text hover:border-primary/50 transition-colors"
            title="Upload food photo"
          >
            <Camera size={18} />
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || (!text.trim() && !imageBase64)}
            className="p-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-40"
            title="Analyze"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
}
