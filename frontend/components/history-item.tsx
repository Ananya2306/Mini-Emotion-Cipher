"use client";

import { EmotionBadge } from "./emotion-badge";

export interface HistoryEntry {
  id: string;
  type: "encrypt" | "decrypt";
  ciphertext: string;
  emotions: Array<{ label: string; score: number }>;
  timestamp: Date;
}

interface HistoryItemProps {
  entry: HistoryEntry;
}

const emotionColors: Record<string, string> = {
  joy: "#FFD700",
  excitement: "#FF6B35",
  sadness: "#4FC3F7",
  anger: "#FF1744",
  fear: "#AA00FF",
  love: "#FF4081",
  surprise: "#00E5FF",
  nervousness: "#FF9100",
  anxiety: "#FF9100",
  gratitude: "#76FF03",
  neutral: "#90A4AE",
  anticipation: "#FF9100",
  trust: "#4FC3F7",
};

function getEmotionColor(label: string): string {
  const normalizedLabel = label.toLowerCase();
  return emotionColors[normalizedLabel] || "#7c3aed";
}

export function HistoryItem({ entry }: HistoryItemProps) {
  const truncatedCipher =
    entry.ciphertext.length > 30
      ? entry.ciphertext.slice(0, 30) + "..."
      : entry.ciphertext;

  const topEmotion = entry.emotions[0];
  const emotionColor = topEmotion ? getEmotionColor(topEmotion.label) : "#7c3aed";

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl glass-subtle transition-all duration-300 hover:border-opacity-50"
      style={{
        ["--hover-glow" as string]: emotionColor,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${emotionColor}50`;
        e.currentTarget.style.boxShadow = `0 0 20px ${emotionColor}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div className="flex-shrink-0 font-mono text-white/30 text-xs">
        {entry.type === "encrypt" ? "ENC" : "DEC"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-xs text-white/50 truncate">
          {truncatedCipher}
        </p>
      </div>
      {topEmotion && (
        <EmotionBadge
          label={topEmotion.label}
          score={topEmotion.score}
          className="text-xs px-2.5 py-1"
        />
      )}
    </div>
  );
}
