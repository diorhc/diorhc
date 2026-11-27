import { useRef } from "react";
import { Moon, Sun } from "lucide-react";
import {
  langPath,
  toggleLang,
  toggleTheme,
  useLang,
  useT,
  useTheme,
} from "@/lib/store";

export function UtilityBar({
  altHref,
}: {
  /** The other language's URL on subpages; home pages switch in place. */
  altHref?: string;
} = {}) {
  const lang = useLang();
  const otherLang = lang === "ru" ? "en" : "ru";
  const theme = useTheme();
  const t = useT();
  const themeBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <div
      className="fixed right-4 top-4 z-40 flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--glass-bg)] p-1.5 shadow-[var(--shadow-sm)] backdrop-blur-xl sm:right-6 sm:top-5"
      role="toolbar"
      aria-label={t.ui.quickControls}
    >
      {/* A real link to the other language's page, so crawlers can follow it;
          with JS the switch happens in place and the URL is updated. */}
      <a
        id="langToggle"
        href={altHref ?? langPath(otherLang)}
        hrefLang={otherLang}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          void toggleLang();
        }}
        aria-label={t.ui.langToggle}
        title={t.ui.langToggle}
        className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-transparent px-2.5 font-mono-code text-xs font-semibold tracking-wider text-[var(--text-primary)] transition-all hover:border-[var(--accent-border)] hover:bg-[var(--accent-soft)] cursor-pointer"
      >
        {lang.toUpperCase()}
      </a>

      <button
        id="themeToggle"
        ref={themeBtnRef}
        type="button"
        onClick={() => toggleTheme(themeBtnRef.current)}
        aria-label={t.ui.themeToggle}
        title={t.ui.themeToggle}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-[var(--text-primary)] transition-all hover:border-[var(--accent-border)] hover:bg-[var(--accent-soft)] cursor-pointer"
      >
        {theme === "dark" ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4 text-[var(--accent)]" />
        )}
      </button>
    </div>
  );
}
