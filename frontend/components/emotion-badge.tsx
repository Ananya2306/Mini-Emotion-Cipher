"use client";

import { cn } from "@/lib/utils";

interface EmotionBadgeProps {
  label: string;
  score: number;
  className?: string;
  animationDelay?: number;
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

export function EmotionBadge({
  label,
  score,
  className,
  animationDelay = 0,
}: EmotionBadgeProps) {
  const color = getEmotionColor(label);
  const percentage = Math.round(score * 100);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-sm font-medium",
        "backdrop-blur-xl transition-all duration-300 animate-badge-float",
        "hover:scale-105",
        className
      )}
      style={{
        background: "rgba(255, 255, 255, 0.05)",
        border: `1px solid ${color}50`,
        color: color,
        boxShadow: `0 0 20px ${color}20`,
        animationDelay: `${animationDelay}s`,
      }}
    >
      <span className="capitalize">{label}</span>
      <span
        className="text-xs px-2 py-0.5 rounded-md"
        style={{ background: `${color}20` }}
      >
        {percentage}%
      </span>
    </span>
  );
}
