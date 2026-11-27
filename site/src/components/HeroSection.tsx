import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Copy } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandIcon } from "@/components/ui/brand-icon";
import { CONTACTS } from "@/data/contacts";
import { Memoji3D } from "@/components/Memoji3D";
import { showToast, useT } from "@/lib/store";
import { copyToClipboard } from "@/lib/utils";

/** Copies the handle; the icon morphs to a check for a moment. */
function CopyHandleButton() {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onCopy = async () => {
    if (!(await copyToClipboard("@diorhc"))) return;
    setCopied(true);
    showToast(t.hero.handleCopied);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={copied ? t.hero.handleCopied : t.hero.copyHandle}
      title={t.hero.copyHandle}
      className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 font-mono-code text-xs text-[var(--text-secondary)] transition-all hover:-translate-y-0.5 hover:border-[var(--accent-border)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] active:translate-y-0 active:scale-[0.97] cursor-pointer"
    >
      <span className="relative inline-flex h-4 w-4">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={copied ? "check" : "copy"}
            initial={{ opacity: 0, scale: 0.5, filter: "blur(2px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.5, filter: "blur(2px)" }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute inset-0 inline-flex"
          >
            {copied ? (
              <Check className="h-4 w-4 text-[var(--accent)]" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </motion.span>
        </AnimatePresence>
      </span>
      @diorhc
    </button>
  );
}

export function HeroSection() {
  const t = useT();

  return (
    <MotionConfig reducedMotion="user">
      <section
        id="home"
        aria-labelledby="hero-title"
        className="relative flex min-h-[100svh] items-center overflow-hidden pt-20 pb-24 lg:py-28"
      >
        <div className="relative z-10 mx-auto grid w-full max-w-[1180px] grid-cols-1 items-center gap-4 px-5 sm:px-7 sm:gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-14">
          <div className="min-w-0 text-center lg:text-left">
            <Badge variant="secondary" className="mb-4 px-3.5 py-1.5 sm:mb-5">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_0_4px_var(--accent-soft)]" />
              <span>{t.hero.badge}</span>
            </Badge>

            <h1
              id="hero-title"
              className="font-display mb-4 text-4xl font-bold tracking-[-0.035em] leading-[1.08] sm:text-5xl lg:text-6xl"
            >
              <span>{t.hero.greeting} </span>
              <span className="gradient-text">diorhc</span>
              <span className="text-[var(--accent)]" aria-hidden="true">
                +
              </span>
            </h1>

            <p className="mx-auto mb-6 max-w-xl sm:mb-8 text-base text-[var(--text-secondary)] sm:text-lg lg:mx-0">
              {t.hero.subtitle}
            </p>

            <div className="mb-6 flex flex-col justify-center gap-3 sm:mb-8 sm:flex-row lg:justify-start">
              <Button asChild size="lg">
                <a href="#projects">
                  <span>{t.hero.ctaProjects}</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <a href="#contact">{t.hero.ctaContact}</a>
              </Button>
            </div>

            <div
              className="flex items-center justify-center gap-3 lg:justify-start"
              role="group"
              aria-label={t.ui.socialLinks}
            >
              {CONTACTS.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${item.name} — ${item.handle}`}
                  title={item.name}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-all hover:-translate-y-0.5 hover:border-[var(--accent-border)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                >
                  <BrandIcon icon={item.icon} className="h-5 w-5" />
                </a>
              ))}
              <CopyHandleButton />
            </div>
          </div>

          <div className="order-first min-w-0 lg:order-none">
            <Memoji3D />
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
