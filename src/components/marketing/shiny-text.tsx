"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShinyTextProps {
  text: string;
  className?: string;
  /** Base text color (theme indigo by default). */
  baseColor?: string;
  /** Shine highlight color. */
  shineColor?: string;
  /** Seconds for one sweep. */
  speed?: number;
}

/**
 * Animated "shiny" gradient text — a highlight sweeps left→right across the
 * letters continuously. Built with Framer Motion + CSS `background-clip: text`.
 */
export function ShinyText({
  text,
  className,
  baseColor = "#818cf8",
  shineColor = "#ffffff",
  speed = 3,
}: ShinyTextProps) {
  return (
    <motion.span
      className={cn("inline-block bg-clip-text text-transparent", className)}
      style={{
        backgroundImage: `linear-gradient(100deg, ${baseColor} 25%, ${shineColor} 50%, ${baseColor} 75%)`,
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
      initial={{ backgroundPositionX: "200%" }}
      animate={{ backgroundPositionX: "0%" }}
      transition={{ duration: speed, ease: "linear", repeat: Infinity }}
    >
      {text}
    </motion.span>
  );
}
