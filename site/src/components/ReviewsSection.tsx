import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ThumbsUp } from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import {
  DEFAULT_GF_RATINGS,
  GREASYFORK_REVIEWS,
  type GreasyForkAggregate,
  type ReviewScript,
} from "@/data/reviews";
import { loadGreasyForkStats } from "@/lib/greasyfork";
import { useLang, useT } from "@/lib/store";
import { cn } from "@/lib/utils";

type ReviewFilter = "all" | ReviewScript;

export function ReviewsSection({
  initialStats = DEFAULT_GF_RATINGS,
}: {
  /** Greasy Fork ratings at build time; refreshed on the client. */
  initialStats?: GreasyForkAggregate;
}) {
  const lang = useLang();
  const t = useT();

  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [stats, setStats] = useState<GreasyForkAggregate>(initialStats);

  useEffect(() => {
    let cancelled = false;
    loadGreasyForkStats().then((fresh) => {
      if (!cancelled && fresh && fresh.good > 0) setStats(fresh);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalVotes = Math.max(1, stats.good + stats.ok + stats.bad);
  const approvalPct = Math.round(((stats.good + stats.ok) / totalVotes) * 100);

  const filters: Array<{ value: ReviewFilter; label: string }> = [
    { value: "all", label: t.reviews.filterAll },
    { value: "youtube-plus", label: "YouTube +" },
    { value: "telegram-plus", label: "Telegram +" },
  ];

  const visibleReviews = useMemo(
    () =>
      filter === "all"
        ? GREASYFORK_REVIEWS
        : GREASYFORK_REVIEWS.filter((item) => item.script === filter),
    [filter]
  );

  return (
    <MotionConfig reducedMotion="user">
      <section
        id="reviews"
        aria-labelledby="reviews-title"
        className="relative flex min-h-[100svh] items-center py-24"
      >
        <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-7">
          <SectionLabel id="reviews-title" text={t.reviews.eyebrow} />

          {/* Unified Live Greasy Fork Telemetry & Filter Bar */}
          <div className="mb-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-sm)]">
            <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-2.5 py-1 font-mono-code text-[10px] font-semibold tracking-wider text-[var(--accent)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  <span>{t.reviews.liveBadge}</span>
                </span>

                <div className="flex items-center gap-5 sm:gap-7">
                  <div>
                    <div className="font-display text-2xl font-bold tracking-tight tabular-nums text-[var(--text-primary)]">
                      {stats.good}
                    </div>
                    <div className="font-mono-code text-[11px] text-[var(--text-secondary)]">
                      {t.reviews.goodLabel}
                    </div>
                  </div>

                  <div className="h-8 w-px bg-[var(--border-subtle)]" aria-hidden="true" />

                  <div>
                    <div className="font-display text-2xl font-bold tracking-tight tabular-nums text-[var(--text-primary)]">
                      {stats.ok}
                    </div>
                    <div className="font-mono-code text-[11px] text-[var(--text-secondary)]">
                      {t.reviews.okLabel}
                    </div>
                  </div>

                  <div className="h-8 w-px bg-[var(--border-subtle)]" aria-hidden="true" />

                  <div>
                    <div className="font-display text-2xl font-bold tracking-tight tabular-nums text-[var(--accent)]">
                      {approvalPct}%
                    </div>
                    <div className="font-mono-code text-[11px] text-[var(--text-secondary)]">
                      {t.reviews.approvalLabel}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
                <div
                  role="group"
                  aria-label={t.ui.reviewsFilter}
                  className="inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--bg-base)] p-1"
                >
                  {filters.map((item) => {
                    const active = filter === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setFilter(item.value)}
                        className={cn(
                          "relative rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer",
                          active
                            ? "text-[var(--accent-fg)]"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="reviewsFilterTab"
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 32,
                            }}
                            className="absolute inset-0 rounded-full bg-[var(--accent)]"
                          />
                        )}
                        <span className="relative z-10">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                <a
                  href="https://greasyfork.org/ru/users/1473734-diorhc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent-border)] hover:text-[var(--accent)]"
                >
                  <span>{t.reviews.leaveReview}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Verified Real Greasy Fork Reviews Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleReviews.map((review) => {
              const localizedQuote = review.quote[lang];
              const showOriginal = review.original !== localizedQuote;
              const isYoutube = review.script === "youtube-plus";

              return (
                <div key={review.id}>
                  <div className="flex h-full flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-sm)] transition-colors hover:border-[var(--accent-border)]">
                    <div className="relative z-10">
                      {/* Meta row */}
                      <div className="mb-4 flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="font-mono-code inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] text-xs font-bold uppercase text-[var(--text-primary)]">
                            {review.author.slice(0, 2)}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
                              {review.author}
                            </div>
                            <div className="font-mono-code text-[11px] text-[var(--text-muted)]">
                              {review.date}
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <Badge
                            variant={isYoutube ? "default" : "secondary"}
                            className="font-mono-code text-[10px]"
                          >
                            {review.scriptLabel}
                          </Badge>
                          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-2 py-0.5 font-mono-code text-[10px] font-semibold text-[var(--accent)]">
                            <ThumbsUp className="h-2.5 w-2.5" />
                            {t.reviews.verifiedTag}
                          </span>
                        </div>
                      </div>

                      {/* Review body */}
                      <p className="text-sm leading-relaxed text-[var(--text-primary)]">
                        “{localizedQuote}”
                      </p>

                      {showOriginal && (
                        <p className="font-mono-code mt-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/80 px-2.5 py-1.5 text-[11px] italic text-[var(--text-secondary)]">
                          {review.original}
                        </p>
                      )}
                    </div>

                    <div className="relative z-10 mt-5 border-t border-[var(--border-subtle)] pt-3">
                      <a
                        href={review.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono-code text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
                      >
                        <span>{t.reviews.openOriginal}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
