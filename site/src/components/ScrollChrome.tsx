import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useT } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ScrollChrome() {
  const t = useT();
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const top = window.scrollY;
      const max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      setProgress(Math.min(1, Math.max(0, top / max)));
      setShowTop(top > 340);
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)]"
        style={{ transform: `scaleX(${progress})` }}
      />
      <button
        type="button"
        aria-label={t.ui.scrollTop}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={cn(
          "fixed bottom-24 right-3.5 z-40 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--glass-bg)] text-[var(--text-primary)] shadow-[var(--shadow-sm)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent-border)] hover:text-[var(--accent)] cursor-pointer lg:bottom-6 lg:right-6 lg:h-10 lg:w-10",
          showTop
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
        )}
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </>
  );
}
