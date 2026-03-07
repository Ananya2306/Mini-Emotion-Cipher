"use client";

import { useState, useCallback, useEffect } from "react";
import { Copy, Check, Loader2, AlertCircle, History, Shuffle, Share2 } from "lucide-react";
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

interface EncryptedPackage {
  ciphertext: string;
  emotions: Emotion[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const EMOJIS = ["😊", "😢", "😤", "😨", "🥰", "😮", "😌", "🤩", "🤔", "😇"];

const SUGGESTIONS = [
  "I just got promoted! 🎉",
  "Today was really hard...",
  "I can't believe they did that 😤",
  "Feeling grateful for everything",
  "I'm so nervous about tomorrow",
  "This made my whole day better!",
  "I feel completely lost right now",
  "Everything is falling into place ✨"
];

const EMOTION_COLORS: Record<string, string> = {
  joy: "#FFD700", excitement: "#FF6B35", sadness: "#4FC3F7", anger: "#FF1744",
  fear: "#AA00FF", love: "#FF4081", surprise: "#00E5FF", nervousness: "#FF9100",
  anxiety: "#FF9100", gratitude: "#76FF03", neutral: "#90A4AE", anticipation: "#FF9100",
  trust: "#4FC3F7", disgust: "#76FF03"
};

function getTopEmotionColor(emotions: Emotion[] | undefined) {
  if (!emotions || emotions.length === 0) {
    return { color1: "rgba(139, 92, 246, 0.15)", color2: "rgba(6, 182, 212, 0.12)", color3: "rgba(236, 72, 153, 0.1)" };
  }
  const top = emotions[0].label.toLowerCase();
  switch (top) {
    case "joy": return { color1: "rgba(255, 215, 0, 0.15)", color2: "rgba(255, 165, 0, 0.12)", color3: "rgba(255, 140, 0, 0.1)" };
    case "sadness": return { color1: "rgba(33, 150, 243, 0.15)", color2: "rgba(3, 169, 244, 0.12)", color3: "rgba(0, 188, 212, 0.1)" };
    case "anger": return { color1: "rgba(244, 67, 54, 0.15)", color2: "rgba(229, 57, 53, 0.12)", color3: "rgba(211, 47, 47, 0.1)" };
    case "fear": return { color1: "rgba(156, 39, 176, 0.15)", color2: "rgba(103, 58, 183, 0.12)", color3: "rgba(81, 45, 168, 0.1)" };
    case "surprise": return { color1: "rgba(0, 230, 118, 0.15)", color2: "rgba(0, 188, 212, 0.12)", color3: "rgba(38, 198, 218, 0.1)" };
    case "disgust": return { color1: "rgba(76, 175, 80, 0.15)", color2: "rgba(139, 195, 74, 0.12)", color3: "rgba(56, 142, 60, 0.1)" };
    default: return { color1: "rgba(139, 92, 246, 0.15)", color2: "rgba(6, 182, 212, 0.12)", color3: "rgba(236, 72, 153, 0.1)" };
  }
}

export function EmotionCipher() {
  const [mode, setMode] = useState<Mode>("encrypt");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedPackage, setCopiedPackage] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [encryptionsCount, setEncryptionsCount] = useState(0);
  const [streakMilestone, setStreakMilestone] = useState<{ message: string; style: string } | null>(null);
  const [activeSuggestions, setActiveSuggestions] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showShareCard, setShowShareCard] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [emojiPositions, setEmojiPositions] = useState<{ x: number; delay: number; duration: number; emoji: string }[]>([]);
  const MAX_CHARS = 280;

  // ── useEffect 1: mount + server ping ─────────────────────────────
  useEffect(() => {
    setMounted(true);
    if (API_URL) {
      const ping = () => fetch(`${API_URL}/health`).catch(() => {});
      ping();
      const pingInterval = setInterval(ping, 10 * 60 * 1000);
      return () => clearInterval(pingInterval);
    }
  }, []);

  // ── useEffect 2: post-mount setup ─────────────────────────────────
  useEffect(() => {
    if (!mounted) return;
    const positions = Array.from({ length: 10 }).map(() => ({
      x: Math.random() * 100,
      delay: Math.random() * -20,
      duration: 12 + Math.random() * 8,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
    }));
    setEmojiPositions(positions);
    const saved = localStorage.getItem("emotion_cipher_streak");
    if (saved) setEncryptionsCount(parseInt(saved, 10) || 0);
    const shuffled = [...SUGGESTIONS].sort(() => 0.5 - Math.random());
    setActiveSuggestions(shuffled.slice(0, 3));
  }, [mounted]);

  // ── Handlers ──────────────────────────────────────────────────────
  const shuffleSuggestions = useCallback(() => {
    const shuffled = [...SUGGESTIONS].sort(() => 0.5 - Math.random());
    setActiveSuggestions(shuffled.slice(0, 3));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, MAX_CHARS);
    setInput(val);
    if (mode === "encrypt") {
      setIsTyping(true);
      if (typingTimeout) clearTimeout(typingTimeout);
      setTypingTimeout(setTimeout(() => setIsTyping(false), 1000));
    }
  };

  const incrementStreak = useCallback((currentCount: number) => {
    const newCount = currentCount + 1;
    setEncryptionsCount(newCount);
    localStorage.setItem("emotion_cipher_streak", newCount.toString());
    if (newCount === 3) {
      setStreakMilestone({ message: "You're on fire! 🔥", style: "border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.5)] text-orange-200" });
      setTimeout(() => setStreakMilestone(null), 2000);
    } else if (newCount === 5) {
      setStreakMilestone({ message: "Emotion Master! ⚡", style: "border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.5)] text-yellow-200" });
      setTimeout(() => setStreakMilestone(null), 2000);
    } else if (newCount === 10) {
      setStreakMilestone({ message: "Cipher Legend! 👑", style: "border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.5)] text-white" });
      setTimeout(() => setStreakMilestone(null), 2000);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setError(null);
    setOutput(null);
    setShowCelebration(false);
    setShowShareCard(false);

    try {
      if (mode === "encrypt") {
        incrementStreak(encryptionsCount);

        if (!API_URL) {
          await new Promise((r) => setTimeout(r, 800));
          const demo: ApiResponse = { ciphertext: `DEMO.${btoa(input).slice(0, 24)}...`, emotions: [{ label: "joy", score: 0.91 }] };
          setOutput(demo);
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 1000);
          setHistory((prev) => [{ id: Math.random().toString(36).substring(2, 9), type: mode, ciphertext: demo.ciphertext!, emotions: demo.emotions, timestamp: new Date() }, ...prev].slice(0, 5));
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
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 1000);
        setHistory((prev) => [{ id: Math.random().toString(36).substring(2, 9), type: mode, ciphertext: data.ciphertext!, emotions: data.emotions, timestamp: new Date() }, ...prev].slice(0, 5));

      } else {
        let pkg: EncryptedPackage;
        try {
          pkg = JSON.parse(input);
          if (!pkg.ciphertext || !pkg.emotions) throw new Error("missing fields");
        } catch {
          setError("Invalid format. Please paste the full encrypted package (JSON) that was generated during encryption.");
          return;
        }

        if (!API_URL) {
          await new Promise((r) => setTimeout(r, 800));
          setOutput({ text: "This is a demo decrypted message.", emotions: pkg.emotions });
          return;
        }

        const res = await fetch(`${API_URL}/decrypt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ciphertext: pkg.ciphertext, emotions: pkg.emotions }),
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data: ApiResponse = await res.json();
        setOutput(data);
        setHistory((prev) => [{ id: Math.random().toString(36).substring(2, 9), type: mode, ciphertext: pkg.ciphertext, emotions: data.emotions, timestamp: new Date() }, ...prev].slice(0, 5));
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
  }, [input, mode, encryptionsCount, incrementStreak]);

  const handleCopyPackage = useCallback(async () => {
    if (!output?.ciphertext) return;
    await navigator.clipboard.writeText(JSON.stringify({ ciphertext: output.ciphertext, emotions: output.emotions }, null, 2));
    setCopiedPackage(true);
    setTimeout(() => setCopiedPackage(false), 2000);
  }, [output]);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode); setInput(""); setOutput(null); setError(null); setShowShareCard(false);
  };

  const blobColors = getTopEmotionColor(output?.emotions);

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #0d1117 50%, #0a1628 100%)" }}>

      {/* Floating Emojis */}
      {mounted && emojiPositions.map((pos, i) => (
        <div key={i} className="fixed text-2xl pointer-events-none z-0 animate-float-up"
          style={{ left: `${pos.x}vw`, bottom: "-50px", opacity: 0.08, animationDelay: `${pos.delay}s`, animationDuration: `${pos.duration}s` }}>
          {pos.emoji}
        </div>
      ))}

      {/* Blobs */}
      <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none z-0 transition-colors duration-[1500ms]"
        style={{ background: blobColors.color1, filter: "blur(120px)" }} />
      <div className="fixed bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full pointer-events-none z-0 transition-colors duration-[1500ms]"
        style={{ background: blobColors.color2, filter: "blur(100px)" }} />
      <div className="fixed top-[10%] right-[-50px] w-[350px] h-[350px] rounded-full pointer-events-none z-0 transition-colors duration-[1500ms]"
        style={{ background: blobColors.color3, filter: "blur(90px)" }} />

      <div className="relative z-10 max-w-[680px] mx-auto px-6 py-16">

        {/* Streak */}
        {encryptionsCount > 0 && (
          <div className="absolute top-6 right-6">
            <div className={cn("px-3 py-1.5 rounded-full font-mono text-xs font-bold transition-all duration-500",
              streakMilestone ? streakMilestone.style : "glass-subtle text-white/70")}>
              {streakMilestone ? streakMilestone.message : `🔥 ${encryptionsCount} streak`}
            </div>
          </div>
        )}

        {/* Header */}
        <header className="text-center mb-14">
          <h1 className="font-serif italic text-6xl md:text-7xl text-white mb-4 tracking-tight">mini Emotion Cipher</h1>
          <p className="font-mono text-sm text-white/40 tracking-wide mb-5">feelings stay readable · words stay private</p>
          <span className="inline-flex items-center gap-2 px-4 py-2 glass-subtle font-mono text-xs text-white/50">Emotion Cipher v1.0</span>
        </header>

        {/* Tabs */}
        <div className="glass p-1.5 mb-8">
          <div className="flex gap-1">
            {(["encrypt", "decrypt"] as Mode[]).map((m) => (
              <button key={m} onClick={() => handleModeChange(m)}
                className={cn("flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-mono text-sm font-medium transition-all duration-300",
                  mode === m ? "bg-white text-gray-900" : "text-white/40 hover:text-white/70")}>
                <span className="text-base">{m === "encrypt" ? "⚿" : "◈"}</span>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="glass p-6 mb-6 transition-all duration-300 focus-within:border-purple-500/50 focus-within:shadow-[0_0_30px_rgba(139,92,246,0.15)]">
          <label className="block font-mono text-xs text-white/50 mb-3 uppercase tracking-wider">
            {mode === "encrypt" ? "Your Message" : "Encrypted Package (JSON)"}
          </label>
          <textarea value={input} onChange={handleInputChange}
            placeholder={mode === "encrypt" ? "Type your message here..." : '{ "ciphertext": "...", "emotions": [...] }'}
            className={cn("w-full h-36 bg-transparent border-0 resize-none text-white placeholder:text-white/30 focus:outline-none focus:ring-0",
              mode === "decrypt" ? "font-mono text-xs" : "font-sans text-base")} />
          {mode === "encrypt" && (
            <div className="flex justify-between items-end mt-4">
              <div>{isTyping && <span className="font-mono text-xs text-white/50 animate-pulse">✍️ composing...</span>}</div>
              <div className={cn("font-mono text-xs", input.length >= 270 ? "text-red-400" : input.length >= 250 ? "text-amber-400" : "text-white/30")}>
                {input.length} / {MAX_CHARS}
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {mode === "encrypt" && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/30">Try these:</span>
              <button onClick={shuffleSuggestions} className="text-white/20 hover:text-white/50 transition-colors"><Shuffle className="w-3 h-3" /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeSuggestions.map((s, i) => (
                <button key={i} onClick={() => { setInput(s); setIsTyping(false); }}
                  className="glass-subtle px-3 py-1.5 rounded-lg font-sans text-xs text-white/40 hover:text-white/80 hover:bg-white/5 transition-all text-left">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === "decrypt" && (
          <p className="font-mono text-xs text-white/30 mb-6 px-1">↑ Paste the full JSON package copied from the encrypt output</p>
        )}

        {/* Button */}
        <button onClick={handleSubmit} disabled={isLoading || !input.trim()}
          className={cn("w-full h-14 rounded-[14px] font-mono text-sm font-bold text-white relative overflow-hidden group",
            "transition-all duration-300 flex items-center justify-center gap-2",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            !isLoading && "hover:scale-[1.01] hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] active:scale-[0.97]")}
          style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 mix-blend-overlay" />
          {isLoading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>)
            : mode === "encrypt" ? (<span className="relative z-10">⚿ Encrypt & Detect Emotion</span>)
            : (<span className="relative z-10">◈ Decrypt & Reveal Emotion</span>)}
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
          <div className="mt-8 space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 relative">

            {/* Celebration */}
            {showCelebration && (
              <div className="absolute -inset-4 pointer-events-none z-50 flex items-center justify-center">
                {["✦", "✧", "★", "✦", "✧", "★"].map((spark, i) => (
                  <span key={i} className="absolute text-yellow-300/80 animate-sparkle"
                    style={{ left: `calc(50% + ${Math.cos((i * 60) * Math.PI / 180) * 80}px)`, top: `calc(50% + ${Math.sin((i * 60) * Math.PI / 180) * 80}px)`, fontSize: `${16 + i * 2}px`, animationDelay: `${i * 0.1}s` }}>
                    {spark}
                  </span>
                ))}
              </div>
            )}

            {/* Emotions */}
            {output.emotions?.length > 0 && (
              <div className="glass p-6">
                <label className="block font-mono text-xs text-white/50 mb-4 uppercase tracking-wider">Detected Emotions</label>
                <div className="flex flex-wrap gap-3">
                  {output.emotions.map((emotion, i) => (
                    <EmotionBadge key={i} label={emotion.label} score={emotion.score} animationDelay={i * 0.2} />
                  ))}
                </div>
              </div>
            )}

            {/* Encrypt Output */}
            {mode === "encrypt" && output.ciphertext && (
              <div className="glass p-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="font-mono text-xs text-white/50 uppercase tracking-wider">Encrypted Package</label>
                  <span className="font-mono text-xs text-white/30">Save this to decrypt later</span>
                </div>
                <div className="relative">
                  <pre className="glass-inset p-4 font-mono text-xs text-white/80 break-all whitespace-pre-wrap overflow-auto max-h-48">
                    {JSON.stringify({ ciphertext: output.ciphertext, emotions: output.emotions }, null, 2)}
                  </pre>
                  <button onClick={handleCopyPackage}
                    className="absolute top-3 right-3 p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-all duration-200">
                    {copiedPackage ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="font-mono text-xs text-white/20 mt-3">↑ Copy this JSON and paste it in Decrypt mode to recover the original message</p>
                <div className="mt-6 border-t border-white/10 pt-4 flex justify-end">
                  <button onClick={() => setShowShareCard(!showShareCard)}
                    className="flex items-center gap-2 font-mono text-xs text-white/50 hover:text-white transition-colors">
                    <Share2 className="w-4 h-4" /> Share Result
                  </button>
                </div>
                {showShareCard && (
                  <div className="mt-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="w-[400px] h-[220px] mx-auto rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden"
                      style={{ background: "linear-gradient(135deg, #0f172a, #020617)", boxShadow: `0 0 30px ${blobColors.color1}` }}>
                      <div className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{ background: `radial-gradient(circle at 50% 120%, ${blobColors.color1}, transparent 70%)` }} />
                      <h3 className="relative z-10 font-serif italic text-2xl text-white">mini Emotion Cipher</h3>
                      <div className="relative z-10 flex gap-2 flex-wrap">
                        {output.emotions.slice(0, 3).map((e, i) => <EmotionBadge key={i} label={e.label} score={e.score} />)}
                      </div>
                      <div className="relative z-10">
                        <p className="font-sans text-sm text-white/80 italic mb-2">"{input.split(" ").slice(0, 3).join(" ")}..."</p>
                        <p className="font-mono text-[10px] text-white/40">feelings stay readable · words stay private</p>
                      </div>
                    </div>
                    <p className="text-center font-mono text-xs text-white/30 mt-4">Screenshot & share! 📸</p>
                  </div>
                )}
              </div>
            )}

            {/* Decrypt Output */}
            {mode === "decrypt" && output.text && (
              <div className="glass p-6">
                <label className="block font-mono text-xs text-white/50 mb-4 uppercase tracking-wider">Original Message</label>
                <div className="glass-inset p-4 text-white/90 font-sans text-base leading-relaxed">{output.text}</div>
              </div>
            )}
          </div>
        )}

        {/* History + Pattern */}
        {history.length > 0 && (
          <div className="mt-14 space-y-8">
            {encryptionsCount >= 2 && (
              <div>
                <span className="font-mono text-xs text-white/30 uppercase tracking-wider">Your Emotion Pattern</span>
                <div className="space-y-3 glass-subtle p-5 mt-4">
                  {(() => {
                    const encryptEntries = history.filter(h => h.type === "encrypt");
                    const counts: Record<string, number> = {};
                    let total = 0;
                    encryptEntries.forEach(entry => {
                      if (entry.emotions[0]) { counts[entry.emotions[0].label] = (counts[entry.emotions[0].label] || 0) + 1; total++; }
                    });
                    if (total === 0) return null;
                    return Object.entries(counts)
                      .map(([label, count]) => ({ label, percentage: Math.round((count / total) * 100) }))
                      .sort((a, b) => b.percentage - a.percentage)
                      .map((stat, i) => {
                        const color = EMOTION_COLORS[stat.label.toLowerCase()] || "#7c3aed";
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between font-mono text-xs">
                              <span className="text-white/60 capitalize">{stat.label}</span>
                              <span className="text-white/30">{stat.percentage}%</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${stat.percentage}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}80` }} />
                            </div>
                          </div>
                        );
                      });
                  })()}
                </div>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-white/30" />
                <h2 className="font-mono text-xs text-white/30 uppercase tracking-wider">Recent</h2>
              </div>
              <div className="space-y-2">
                {history.map((entry) => <HistoryItem key={entry.id} entry={entry} />)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
