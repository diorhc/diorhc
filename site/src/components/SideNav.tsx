import { useEffect, useState } from "react";
import { MotionConfig, motion } from "motion/react";
import { useT } from "@/lib/store";
import { cn } from "@/lib/utils";

const SECTIONS = ["home", "about", "projects", "skills", "reviews", "contact"] as const;
type SectionId = (typeof SECTIONS)[number];

export function SideNav() {
  const t = useT();
  const [active, setActive] = useState<SectionId>("home");
  const [fills, setFills] = useState<number[]>([0, 0, 0, 0, 0]);

  useEffect(() => {
    const els = SECTIONS.map((id) => document.getElementById(id)).filter(
      Boolean
    ) as HTMLElement[];
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id as SectionId);
          }
        });
      },
      { threshold: 0.35 }
    );

    els.forEach((el) => observer.observe(el));

    let ticking = false;
    const computeProgress = () => {
      ticking = false;
      const anchorY = window.scrollY + window.innerHeight * 0.36;
      const tops = els.map((el) => el.offsetTop);
      const nextFills = tops.slice(0, -1).map((start, i) => {
        const end = tops[i + 1] ?? start + window.innerHeight;
        const pct = Math.max(
          0,
          Math.min(1, (anchorY - start) / Math.max(1, end - start))
        );
        return Math.round(pct * 100);
      });
      setFills(nextFills);
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(computeProgress);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    computeProgress();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const scrollTo = (id: SectionId) => {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <MotionConfig reducedMotion="user">
    <aside
      className="fixed left-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex"
      aria-label={t.ui.sectionNav}
    >
      <span
        aria-hidden="true"
        className="font-mono-code text-[11px] font-semibold tracking-[0.35em] text-[var(--text-muted)] [writing-mode:vertical-rl] rotate-180 select-none"
      >
        DIORHC
      </span>
      <div className="flex flex-col items-center rounded-full border border-[var(--border-subtle)] bg-[var(--glass-bg)] px-3 py-4 shadow-[var(--shadow-sm)] backdrop-blur-xl">
        {SECTIONS.map((id, idx) => {
          const label = t.nav[id];
          const isActive = id === active;
          return (
            <div key={id} className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => scrollTo(id)}
                aria-label={label}
                title={label}
                className={cn(
                  "group relative flex h-5 w-5 items-center justify-center rounded-full border-2 border-transparent transition-colors cursor-pointer",
                  !isActive && "hover:border-[var(--border-strong)]"
                )}
              >
                {/* The ring travels along the rail to the active section */}
                {isActive && (
                  <motion.span
                    layoutId="sidenav-ring"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                    className="absolute -inset-0.5 rounded-full border-2 border-[var(--accent)] bg-[var(--accent-soft)]"
                  />
                )}
                <span
                  className={cn(
                    "relative h-1.5 w-1.5 rounded-full transition-transform",
                    isActive
                      ? "scale-125 bg-[var(--accent)]"
                      : "bg-[var(--text-muted)]"
                  )}
                />
                <span className="pointer-events-none absolute left-full ml-3.5 whitespace-nowrap rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 font-mono-code text-[11px] uppercase tracking-wider text-[var(--text-primary)] opacity-0 shadow-[var(--shadow-sm)] transition-all duration-150 -translate-x-1 group-hover:translate-x-0 group-hover:opacity-100">
                  {label}
                </span>
              </button>
              {idx < SECTIONS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="relative my-1.5 h-10 w-0.5 overflow-hidden rounded-full bg-[var(--border-subtle)]"
                >
                  <span
                    className="absolute inset-x-0 top-0 rounded-full bg-gradient-to-b from-[var(--accent)] to-[var(--secondary)]"
                    style={{ height: `${fills[idx] ?? 0}%` }}
                  />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </aside>
    </MotionConfig>
  );
}
