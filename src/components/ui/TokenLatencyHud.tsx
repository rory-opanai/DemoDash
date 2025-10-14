"use client";
import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/appStore";

export function TokenLatencyHud() {
  const show = useAppStore((s) => s.showLatencyHud);
  const [tps, setTps] = useState(0);
  useEffect(() => {
    if (!show) return;
    const id = setInterval(() => setTps(10 + Math.round(Math.random() * 30)), 1200);
    return () => clearInterval(id);
  }, [show]);
  if (!show) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-foreground/90 px-3 py-2 text-sm text-background shadow-subtle">
      <div className="font-medium">Latency HUD</div>
      <div className="text-xs opacity-80">Tokens/s: {tps}</div>
    </div>
  );
}


