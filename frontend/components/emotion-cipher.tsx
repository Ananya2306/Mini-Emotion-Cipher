"use client";

import { useState, useCallback } from "react";
import { Copy, Check, Loader2, AlertCircle, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmotionBadge } from "./emotion-badge";
import { HistoryItem, type HistoryEntry } from "./history-item";

type Mode = "encrypt" | "decrypt";

interface Emotion {
  label: string;
  score: number;
}

interface ApiResponse {
  text?: string;
  ciphertext?: string;
  emotions: Emotion[];
}

// This is what we store and share for decryption
interface EncryptedPackage {
  ciphertext: string;
  emotions: Emotion[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function EmotionCipher() {
  const [mode, setMode] = useState<Mode>("encrypt");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedPackage, setCopiedPackage] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    setError(null);
    setOutput(null);

    try {
      if (mode === "encrypt") {
        // ── ENCRYPT ──────────────────────────────────────────
        if (!API_URL) {
          // Demo mode fallback
          await new Promise((r) => setTimeout(r, 800));
          const demo: ApiResponse = {
            ciphertext: `DEMO.${btoa(input).slice(0, 24)}...`,
            emotions: [{ label: "joy", score: 0.91 }],
          };
          setOutput(demo);
          setHistory((prev) =>
            [
              {
                id: crypto.randomUUID(),
                type: mode,
                ciphertext: demo.ciphertext!,
                emotions: demo.emotions,
                timestamp: new Date(),
              },
              ...prev,
            ].slice(0, 5)
          );
          return;
        }

        const res = await fetch(`${API_URL}/encrypt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: input }),
        });

        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data: ApiResponse = await res.json();
        setOutput(data);

        setHistory((prev) =>
          [
            {
              id: crypto.randomUUID(),
              type: mode,
              ciphertext: data.ciphertext!,
              emotions: data.emotions,
              timestamp: new Date(),
            },
            ...prev,
          ].slice(0, 5)
        );
      } else {
        // ── DECRYPT ──────────────────────────────────────────
        // Input should be the JSON package from encrypt output
        let pkg: EncryptedPackage;

        try {
          pkg = JSON.parse(input);
          if (!pkg.ciphertext || !pkg.emotions) throw new Error("missing fields");
        } catch {
          setError(
            "Invalid format. Please paste the full encrypted package (JSON) that was generated during encryption."
          );
          return;
        }

        if (!API_URL) {
          // Demo mode fallback
          await new Promise((r) => setTimeout(r, 800));
          setOutput({
            text: "This is a demo decrypted message.",
            emotions: pkg.emotions,
          });
          return;
        }

        const res = await fetch(`${API_URL}/decrypt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ciphertext: pkg.ciphertext,
            emotions: pkg.emotions,
          }),
        });

        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data: ApiResponse = await res.json();
        setOutput(data);

        setHistory((prev) =>
          [
            {
              id: crypto.randomUUID(),
              type: mode,
              ciphertext: pkg.ciphertext,
              emotions: data.emotions,
              timestamp: new Date(),
            },
            ...prev,
          ].slice(0, 5)
        );
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Unable to connect to the server. Please check your connection.");
      } else {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }, [input, mode]);

  // Copy the full encrypted package (ciphertext + emotions as JSON)
  const handleCopyPackage = useCallback(async () => {
    if (!output?.ciphertext) return;
    const pkg: EncryptedPackage = {
      ciphertext: output.ciphertext,
      emotions: output.emotions,
    };
    await navigator.clipboard.writeText(JSON.stringify(pkg, null, 2));
    setCopiedPackage(true);
    setTimeout(() => setCopiedPackage(false), 2000);
  }, [output]);

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
        background: "linear-gradient(135deg, #0a0a1a 0%, #0d1117 50%, #0a1628 100%)",
      }}
    >
      {/* Color blobs */}
      <div
        className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{ background: "rgba(139, 92, 246, 0.15)", filter: "blur(120px)" }}
      />
      <div
        className="fixed bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full pointer-events-none z-0"
        style={{ background: "rgba(6, 182, 212, 0.12)", filter: "blur(100px)" }}
      />
      <div
        className="fixed top-[10%] right-[-50px] w-[350px] h-[350px] rounded-full pointer-events-none z-0"
        style={{ background: "rgba(236, 72, 153, 0.1)", filter: "blur(90px)" }}
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
            {(["encrypt", "decrypt"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-mono text-sm font-medium transition-all duration-300",
                  mode === m
                    ? "bg-white text-gray-900"
                    : "text-white/40 hover:text-white/70"
                )}
              >
                <span className="text-base">{m === "encrypt" ? "⚿" : "◈"}</span>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Input Section */}
        <div className="glass p-6 mb-6 transition-all duration-300 focus-within:border-purple-500/50 focus-within:shadow-[0_0_30px_rgba(139,92,246,0.15)]">
          <label className="block font-mono text-xs text-white/50 mb-3 uppercase tracking-wider">
            {mode === "encrypt" ? "Your Message" : "Encrypted Package (JSON)"}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "encrypt"
                ? "Type your message here..."
                : '{ "ciphertext": "...", "emotions": [...] }'
            }
            className={cn(
              "w-full h-36 bg-transparent border-0 resize-none text-white placeholder:text-white/30 focus:outline-none focus:ring-0",
              mode === "decrypt" ? "font-mono text-xs" : "font-sans text-base"
            )}
          />
        </div>

        {/* Hint for decrypt mode */}
        {mode === "decrypt" && (
          <p className="font-mono text-xs text-white/30 mb-6 px-1">
            ↑ Paste the full JSON package copied from the encrypt output
          </p>
        )}

        {/* Action Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || !input.trim()}
          className={cn(
            "w-full h-14 rounded-[14px] font-mono text-sm font-bold text-white",
            "transition-all duration-300 flex items-center justify-center gap-2",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            !isLoading && "hover:scale-[1.01] hover:shadow-[0_0_40px_rgba(124,58,237,0.4)]"
          )}
          style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : mode === "encrypt" ? (
            <>⚿ Encrypt & Detect Emotion</>
          ) : (
            <>◈ Decrypt & Reveal Emotion</>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-6 glass p-4 border-red-500/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-mono text-sm text-red-400 font-medium">Error</p>
                <p className="text-sm text-red-400/70 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Output */}
        {output && (
          <div className="mt-8 space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">

            {/* Emotions */}
            {output.emotions?.length > 0 && (
              <div className="glass p-6">
                <label className="block font-mono text-xs text-white/50 mb-4 uppercase tracking-wider">
                  Detected Emotions
                </label>
                <div className="flex flex-wrap gap-3">
                  {output.emotions.map((emotion, i) => (
                    <EmotionBadge
                      key={i}
                      label={emotion.label}
                      score={emotion.score}
                      animationDelay={i * 0.2}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Encrypt output — show copyable JSON package */}
            {mode === "encrypt" && output.ciphertext && (
              <div className="glass p-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="font-mono text-xs text-white/50 uppercase tracking-wider">
                    Encrypted Package
                  </label>
                  <span className="font-mono text-xs text-white/30">
                    Save this to decrypt later
                  </span>
                </div>
                <div className="relative">
                  <pre className="glass-inset p-4 font-mono text-xs text-white/80 break-all whitespace-pre-wrap overflow-auto max-h-48">
                    {JSON.stringify(
                      { ciphertext: output.ciphertext, emotions: output.emotions },
                      null,
                      2
                    )}
                  </pre>
                  <button
                    onClick={handleCopyPackage}
                    className="absolute top-3 right-3 p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-all duration-200"
                    title="Copy encrypted package"
                  >
                    {copiedPackage ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="font-mono text-xs text-white/20 mt-3">
                  ↑ Copy this JSON and paste it in Decrypt mode to recover the original message
                </p>
              </div>
            )}

            {/* Decrypt output — show original message */}
            {mode === "decrypt" && output.text && (
              <div className="glass p-6">
                <label className="block font-mono text-xs text-white/50 mb-4 uppercase tracking-wider">
                  Original Message
                </label>
                <div className="glass-inset p-4 text-white/90 font-sans text-base leading-relaxed">
                  {output.text}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History */}
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