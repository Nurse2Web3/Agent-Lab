import { motion, useSpring, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";

interface ScoreRingProps {
  score: number; // 0-5 scale from overallScore
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
}

export function ScoreRing({
  score,
  size = 80,
  strokeWidth = 8,
  showLabel = true,
  label,
}: ScoreRingProps) {
  // Convert 0-5 score to 0-100
  const percentage = Math.min(100, Math.max(0, (score / 5) * 100));

  // Calculate ring dimensions
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine color based on score
  const getColor = (pct: number) => {
    if (pct >= 80) return { stroke: "#10b981", glow: "#10b981" }; // green
    if (pct >= 50) return { stroke: "#f59e0b", glow: "#f59e0b" }; // amber
    return { stroke: "#ef4444", glow: "#ef4444" }; // red
  };

  const color = getColor(percentage);

  // Animated value
  const [displayOffset, setDisplayOffset] = useState(circumference);

  useEffect(() => {
    const controls = animate(displayOffset, strokeDashoffset, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (value) => setDisplayOffset(value),
    });
    return () => controls.stop();
  }, [strokeDashoffset, circumference]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background ring */}
        <svg
          width={size}
          height={size}
          className="rotate-[-90deg]"
          style={{ transformOrigin: "center" }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted-foreground) / 0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Animated score ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={displayOffset}
            style={{
              filter: `drop-shadow(0 0 ${strokeWidth}px ${color.glow}40)`,
            }}
          />
        </svg>
        {/* Center score number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold tabular-nums" style={{ color: color.stroke }}>
            {Math.round(percentage)}
          </span>
        </div>
      </div>
      {showLabel && (
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          {label || "Score"}
        </span>
      )}
    </div>
  );
}
