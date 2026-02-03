import { useEffect, useState } from "react";

export function useFallbackDate(active: boolean, intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!active) return undefined;
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [active, intervalMs]);

  return now;
}
