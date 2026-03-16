import * as React from "react";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const onChange = () => setReduced(Boolean(mq.matches));
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

export default function SignatureSpotlight({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  const onMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (reduced) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--spot-x", `${x}%`);
      el.style.setProperty("--spot-y", `${y}%`);
    },
    [reduced],
  );

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className="relative"
      style={
        {
          "--spot-x": "25%",
          "--spot-y": "25%",
          backgroundImage:
            "radial-gradient(700px 400px at var(--spot-x) var(--spot-y), hsl(var(--brand) / 0.20), transparent 60%)",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
