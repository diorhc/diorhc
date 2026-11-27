import { useEffect, useState } from "react";
import { Box, Cpu, Home, Layers, MessageSquareQuote, User } from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import { useT } from "@/lib/store";
import { cn } from "@/lib/utils";

const ITEMS = [
  { id: "home", Icon: Home },
  { id: "about", Icon: User },
  { id: "projects", Icon: Layers },
  { id: "skills", Icon: Cpu },
  { id: "reviews", Icon: MessageSquareQuote },
  { id: "contact", Icon: Box },
] as const;

type SectionId = (typeof ITEMS)[number]["id"];

export function MobileDock() {
  const t = useT();
  const [active, setActive] = useState<SectionId>("home");

  useEffect(() => {
    const els = ITEMS.map((item) => document.getElementById(item.id)).filter(
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
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: SectionId) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <MotionConfig reducedMotion="user">
    <nav
      className="fixed bottom-3.5 left-1/2 z-40 flex w-[min(96vw,480px)] -translate-x-1/2 items-center gap-0.5 rounded-full border border-[var(--border-strong)] bg-[var(--glass-bg)] p-1.5 shadow-[var(--shadow-lg)] backdrop-blur-xl lg:hidden"
      aria-label={t.ui.mobileNav}
    >
      {ITEMS.map(({ id, Icon }) => {
        const isActive = active === id;
        const label = t.nav[id];
        return (
          <button
            key={id}
            type="button"
            onClick={() => scrollTo(id)}
            aria-label={label}
            className={cn(
              "relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-full px-1 py-1.5 text-[11px] font-medium transition-colors cursor-pointer",
              isActive
                ? "text-[var(--accent)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            {/* One pill that slides to the active item instead of jumping */}
            {isActive && (
              <motion.span
                layoutId="dock-active"
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
                className="absolute inset-0 rounded-full bg-[var(--accent-soft)]"
              />
            )}
            <Icon className="relative h-4 w-4 shrink-0" />
            <span className="relative max-w-full truncate">{label}</span>
          </button>
        );
      })}
    </nav>
    </MotionConfig>
  );
}
