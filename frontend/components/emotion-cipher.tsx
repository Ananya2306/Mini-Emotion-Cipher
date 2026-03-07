"use client";

import { useState, useCallback } from "react";
import { Copy, Check, Loader2, AlertCircle, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmotionBadge } from "./emotion-badge";
import { HistoryItem, type HistoryEntry } from "./history-item";

type Mode = "encrypt" | "decrypt";

interface ApiResponse {
  text?: string;
  ciphertext?: string;
  emotions: Array<{ label: string; score: number }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const DEMO_EMOTIONS = [
  { label: "joy", score: 0.85 },
  { label: "anticipation", score: 0.62 },
  { label: "trust", score: 0.45 },
];

function generateDemoCiphertext(text: string): string {
  const encoded = btoa(unescape(encodeURIComponent(text)));
  return `EC.v1.${encoded.slice(0, 32)}...`;
}

export function EmotionCipher() {
  const [mode, setMode] = useState<Mode>("encrypt");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    setError(null);
    setOutput(null);

    if (!API_URL) {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const demoResponse: ApiResponse =
        mode === "encrypt"
          ? {
              ciphertext: generateDemoCiphertext(input),
              emotions: DEMO_EMOTIONS,
            }
          : {
              text: "This is a demo decryption result.",
              emotions: DEMO_EMOTIONS,
            };

      setOutput(demoResponse);

      const newEntry: HistoryEntry = {
        id: crypto.randomUUID(),
        type: mode,
        ciphertext: mode === "encrypt" ? demoResponse.ciphertext! : input,
        emotions: demoResponse.emotions,
        timestamp: new Date(),
      };

      setHistory((prev) => [newEntry, ...prev].slice(0, 5));
      setIsLoading(false);
      return;
    }

    const endpoint = mode === "encrypt" ? "/encrypt" : "/decrypt";
    const body = mode === "encrypt" ? { text: input } : { ciphertext: input };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      setOutput(data);

      const newEntry: HistoryEntry = {
        id: crypto.randomUUID(),
        type: mode,
        ciphertext: mode === "encrypt" ? data.ciphertext! : input,
        emotions: data.emotions,
        timestamp: new Date(),
      };

      setHistory((prev) => [newEntry, ...prev].slice(0, 5));
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError(
          "Unable to connect to the server. This may be a CORS issue or the server is unreachable."
        );
      } else {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [input, mode]);

  const handleCopy = useCallback(async () => {
    if (!output?.ciphertext) return;

    try {
      await navigator.clipboard.writeText(output.ciphertext);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  }, [output?.ciphertext]);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setInput("");
    setOutput(null);
    setError(null);
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0a0a1a 0%, #0d1117 50%, #0a1628 100%)",
      }}
    >
      {/* Color blobs for depth */}
      <div
        className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{
          background: "rgba(139, 92, 246, 0.15)",
          filter: "blur(120px)",
        }}
      />
      <div
        className="fixed bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full pointer-events-none z-0"
        style={{
          background: "rgba(6, 182, 212, 0.12)",
          filter: "blur(100px)",
        }}
      />
      <div
        className="fixed top-[10%] right-[-50px] w-[350px] h-[350px] rounded-full pointer-events-none z-0"
        style={{
          background: "rgba(236, 72, 153, 0.1)",
          filter: "blur(90px)",
        }}
      />

      <div className="relative z-10 max-w-[680px] mx-auto px-6 py-16">
        {/* Header */}
        <header className="text-center mb-14">
          <h1 className="font-serif italic text-6xl md:text-7xl text-white mb-4 tracking-tight">
            mini Emotion Cipher
          </h1>
          <p className="font-mono text-sm text-white/40 tracking-wide mb-5">
            feelings stay readable · words stay private
          </p>
          <span className="inline-flex items-center gap-2 px-4 py-2 glass-subtle font-mono text-xs text-white/50">
            Emotion Cipher v1.0
          </span>
        </header>

        {/* Tab Switcher */}
        <div className="glass p-1.5 mb-8">
          <div className="flex gap-1">
            <button
              onClick={() => handleModeChange("encrypt")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-mono text-sm font-medium transition-all duration-300",
                mode === "encrypt"
                  ? "bg-white text-gray-900"
                  : "text-white/40 hover:text-white/70"
              )}
            >
              <span className="text-base">&#x29BF;</span>
              Encrypt
            </button>
            <button
              onClick={() => handleModeChange("decrypt")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-mono text-sm font-medium transition-all duration-300",
                mode === "decrypt"
                  ? "bg-white text-gray-900"
                  : "text-white/40 hover:text-white/70"
              )}
            >
              <span className="text-base">&#x25C8;</span>
              Decrypt
            </button>
          </div>
        </div>

        {/* Input Section */}
        <div className="glass p-6 mb-6 transition-all duration-300 focus-within:border-purple-500/50 focus-within:shadow-[0_0_30px_rgba(139,92,246,0.15)]">
          <label className="block font-mono text-xs text-white/50 mb-3 uppercase tracking-wider">
            {mode === "encrypt" ? "Your message" : "Ciphertext"}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "encrypt"
                ? "Type your message here..."
                : "Paste your ciphertext here..."
            }
            className="w-full h-32 bg-transparent border-0 resize-none font-sans text-white placeholder:text-white/30 focus:outline-none focus:ring-0"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || !input.trim()}
          className={cn(
            "w-full h-14 rounded-[14px] font-mono text-sm font-bold text-white",
            "transition-all duration-300",
            "flex items-center justify-center gap-2",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100",
            isLoading
              ? "animate-gradient-shimmer"
              : "hover:scale-[1.01] hover:shadow-[0_0_40px_rgba(124,58,237,0.4)]"
          )}
          style={{
            background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : mode === "encrypt" ? (
            <>
              <span>&#x29BF;</span>
              Encrypt & Detect Emotion
            </>
          ) : (
            <>
              <span>&#x25C8;</span>
              Decrypt & Reveal Emotion
            </>
          )}
        </button>

        {/* Error State */}
        {error && (
          <div className="mt-6 glass p-4 border-red-500/30 animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-mono text-sm text-red-400 font-medium">
                  Error
                </p>
                <p className="text-sm text-red-400/70 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Output Section */}
        {output && (
          <div className="mt-8 space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            {/* Emotions */}
            {output.emotions && output.emotions.length > 0 && (
              <div className="glass p-6">
                <label className="block font-mono text-xs text-white/50 mb-4 uppercase tracking-wider">
                  Detected Emotions
                </label>
                <div className="flex flex-wrap gap-3">
                  {output.emotions.map((emotion, index) => (
                    <EmotionBadge
                      key={index}
                      label={emotion.label}
                      score={emotion.score}
                      animationDelay={index * 0.2}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Ciphertext / Decrypted Text */}
            <div className="glass p-6">
              <label className="block font-mono text-xs text-white/50 mb-4 uppercase tracking-wider">
                {mode === "encrypt" ? "Ciphertext" : "Original Message"}
              </label>
              <div className="relative">
                <div
                  className={cn(
                    "glass-inset p-4",
                    mode === "encrypt" ? "font-mono text-sm" : "font-sans",
                    "text-white/90 break-all"
                  )}
                >
                  {mode === "encrypt" ? output.ciphertext : output.text}
                </div>
                {mode === "encrypt" && output.ciphertext && (
                  <button
                    onClick={handleCopy}
                    className="absolute top-3 right-3 p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-all duration-200"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* History Section */}
        {history.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-white/30" />
              <h2 className="font-mono text-xs text-white/30 uppercase tracking-wider">
                Recent
              </h2>
            </div>
            <div className="space-y-2">
              {history.map((entry) => (
                <HistoryItem key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
