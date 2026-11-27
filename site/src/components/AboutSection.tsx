import { useEffect, useRef, useState } from "react";
import { SectionLabel } from "@/components/ui/section-label";
import { PROJECTS } from "@/data/projects";
import { DEFAULT_GF_RATINGS } from "@/data/reviews";
import { loadGreasyForkStats } from "@/lib/greasyfork";
import { useLang, useT } from "@/lib/store";

function AnimatedCounter({
  target,
  active,
  lang,
  suffix = "+",
}: {
  target: number;
  active: boolean;
  lang: "ru" | "en";
  /** "+" for a growing lower bound (installs); "" for an exact count. */
  suffix?: string;
}) {
  const [display, setDisplay] = useState(target);
  const shownRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const reduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(target);
      return;
    }

    // First reveal counts up from zero; a later target (fresh API data)
    // continues from the number already on screen instead of restarting.
    const from = shownRef.current ?? 0;
    let raf = 0;
    const start = performance.now();
    const duration = 750;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = Math.max(1, Math.round(from + (target - from) * eased));
      shownRef.current = value;
      setDisplay(value);
      if (p < 1) {
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, active]);

  const formatted = new Intl.NumberFormat(lang === "en" ? "en-US" : "ru-RU").format(
    display
  );
  return (
    <>
      {formatted}
      {suffix}
    </>
  );
}

export function AboutSection({
  initialInstalls = DEFAULT_GF_RATINGS.installs,
  totalStars = 0,
}: {
  /** Greasy Fork installs at build time; refreshed on the client. */
  initialInstalls?: number;
  /** Sum of GitHub stars across the project repos, fetched at build time. */
  totalStars?: number;
}) {
  const t = useT();
  const lang = useLang();
  const sectionRef = useRef<HTMLElement>(null);
  const [installs, setInstalls] = useState<number>(initialInstalls);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadGreasyForkStats().then((stats) => {
      if (!cancelled && stats) setInstalls(stats.installs);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const microSegments = 12;
  const activeSegments = 9;

  return (
      <section
        id="about"
        ref={sectionRef}
        aria-labelledby="about-title"
        className="relative flex min-h-[100svh] items-center py-24"
      >
        <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-7">
          <SectionLabel id="about-title" text={t.about.eyebrow} />

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-12">
            {/* Nothing-inspired framed editorial text block matching the exact right card bounds */}
            <div className="flex h-full flex-col justify-between border-y border-dotted border-[var(--border-strong)] py-6 sm:py-7"
            >
              {/* Top micro-stamp */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent-soft)]"
                  />
                  <span className="font-dot text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-primary)]">
                    DIORHC // 01
                  </span>
                </div>
                <span className="font-dot text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
                  {t.about.specStatus}
                </span>
              </div>

              {/* Exact original About copy in one unified Cyrillic+Latin font */}
              <div className="my-auto space-y-4 py-5">
                <p className="font-sans text-[17px] font-medium leading-[1.6] text-[var(--text-primary)] sm:text-[19px]">
                  {t.about.p1}
                </p>
                <p className="font-sans text-sm leading-[1.7] text-[var(--text-secondary)] sm:text-[15px]">
                  {t.about.p2}
                </p>
              </div>

              {/* Bottom micro-stamp */}
              <div className="flex items-center justify-between gap-3 font-mono-code text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                <span>JS · TS · PY · RUST</span>
                <span
                  aria-hidden="true"
                  className="h-px flex-1 border-b border-dotted border-[var(--border-strong)]"
                />
                <span className="font-dot text-[11px] font-bold text-[var(--text-secondary)]">
                  GITHUB / GF
                </span>
              </div>
            </div>

            {/* Right Bento Metrics Card */}
            <div className="h-full"
            >
              <div className="flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-sm)]">
                <div className="relative z-10 flex flex-1 flex-col justify-between divide-y divide-[var(--border-subtle)]">
                  {/* Top Featured Telemetry Row */}
                  <div className="p-6 sm:p-7">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="font-mono-code text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                        {t.about.statInstalls}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-2.5 py-0.5 font-mono-code text-[10px] font-semibold tracking-wider text-[var(--accent)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                        <span>{t.about.liveTag}</span>
                      </span>
                    </div>

                    <div className="font-display mb-1.5 text-4xl font-bold tracking-tight tabular-nums text-[var(--text-primary)] sm:text-5xl">
                      <AnimatedCounter
                        target={installs}
                        active={inView}
                        lang={lang}
                      />
                    </div>

                    <p className="mb-4 text-xs text-[var(--text-secondary)] sm:text-sm">
                      {t.about.installsSub}
                    </p>

                    <div
                      aria-hidden="true"
                      className="grid grid-cols-12 gap-1.5"
                    >
                      {Array.from({ length: microSegments }).map((_, idx) => (
                        <span
                          key={idx}
                          className={
                            idx < activeSegments
                              ? "h-1.5 rounded-full bg-[var(--accent)]"
                              : "h-1.5 rounded-full bg-[var(--border-strong)] opacity-50"
                          }
                        />
                      ))}
                    </div>
                  </div>

                  {/* Bottom Split Bento Row */}
                  <div className="grid grid-cols-1 divide-y divide-[var(--border-subtle)] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                    <div className="p-5 sm:p-6">
                      <div className="font-display mb-1 text-3xl font-bold tracking-tight tabular-nums text-[var(--text-primary)]">
                        <AnimatedCounter target={PROJECTS.length} active={inView} lang={lang} suffix="" />
                      </div>
                      <div className="mb-1.5 text-sm font-medium text-[var(--text-primary)]">
                        {t.about.statProjects}
                      </div>
                      <div className="font-mono-code text-[11px] text-[var(--text-muted)]">
                        {t.about.projectsTags}
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <div className="font-display mb-1 text-3xl font-bold tracking-tight tabular-nums text-[var(--text-primary)]">
                        {totalStars > 0 ? (
                          <AnimatedCounter target={totalStars} active={inView} lang={lang} suffix="" />
                        ) : (
                          "—"
                        )}
                      </div>
                      <div className="mb-1.5 text-sm font-medium text-[var(--text-primary)]">
                        {t.about.statStars}
                      </div>
                      <div className="font-mono-code text-[11px] text-[var(--text-muted)]">
                        {t.about.starsTags}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
  );
}
