import { useEffect, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { translations, type Lang } from "@/data/i18n";
import { withBase } from "@/lib/utils";

export type Theme = "dark" | "light";

export interface ToastItem {
  id: number;
  message: string;
}

// ---------- Language Store ----------
// Each language has its own URL: "/" is Russian, "/en/" is English. The server
// renders the page in its URL's language, and hydration starts from the same
// value (read back from <html lang>), so crawlers and users get real content.
let ssrLang: Lang = "ru";
const langListeners = new Set<() => void>();
let langInitialized = false;

function pageLang(): Lang {
  if (typeof document === "undefined") return ssrLang;
  return document.documentElement.lang === "en" ? "en" : "ru";
}

let currentLang: Lang = pageLang();
const hydrationLang: Lang = currentLang;

/** Server only: set the language the current page is rendered in. */
export function setSSRLang(lang: Lang) {
  ssrLang = lang;
  currentLang = lang;
}

/** Path of the page for a language, e.g. "/diorhc/" or "/diorhc/en/". */
export function langPath(lang: Lang): string {
  return withBase(lang === "en" ? "en/" : "");
}

function normalizeLang(val: string | null | undefined): Lang | null {
  if (!val) return null;
  const base = val.trim().toLowerCase().split("-")[0];
  return base === "en" ? "en" : base === "ru" ? "ru" : null;
}

function syncDocumentMeta(lang: Lang) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang;
  const meta = translations[lang].meta;
  document.title = meta.title;
  const descEl = document.querySelector('meta[name="description"]');
  if (descEl) descEl.setAttribute("content", meta.description);
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", meta.title);
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute("content", meta.description);
}

// Keep the address bar on the URL of the language being shown.
function syncUrl(lang: Lang) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("lang");
  url.pathname = langPath(lang);
  if (url.href !== window.location.href) {
    window.history.replaceState(window.history.state, "", url);
  }
}

/**
 * Subpages (projects/…) are plain Astro HTML in one language: there the URL
 * decides the language and switching loads the other page (<html data-lang-fixed>).
 */
function isLangFixed(): boolean {
  return (
    typeof document !== "undefined" &&
    document.documentElement.hasAttribute("data-lang-fixed")
  );
}

function initLangFromClient() {
  if (langInitialized || typeof window === "undefined") return;
  langInitialized = true;
  if (isLangFixed()) return;
  // Only an explicit choice overrides the URL: ?lang= or a language the
  // visitor picked earlier. No browser-language guessing, so a crawler with an
  // English locale still sees the Russian page as Russian.
  const paramLang = normalizeLang(
    new URLSearchParams(window.location.search).get("lang")
  );
  let stored: Lang | null = null;
  try {
    stored = normalizeLang(localStorage.getItem("lang"));
  } catch {
    stored = null;
  }
  const chosen = paramLang ?? stored ?? currentLang;
  if (chosen !== currentLang) {
    currentLang = chosen;
    syncDocumentMeta(chosen);
    langListeners.forEach((cb) => cb());
  }
  syncUrl(chosen);
}

export function setLang(next: Lang) {
  currentLang = next;
  if (typeof window !== "undefined") {
    syncDocumentMeta(next);
    syncUrl(next);
    try {
      localStorage.setItem("lang", next);
    } catch {
      /* ignore */
    }
  }
  langListeners.forEach((cb) => cb());
}

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

/** Switches language with a short crossfade of the whole page. */
export async function toggleLang() {
  const next: Lang = currentLang === "ru" ? "en" : "ru";
  if (typeof document === "undefined") return setLang(next);
  if (isLangFixed()) {
    const alt = document.querySelector<HTMLLinkElement>(
      `link[rel="alternate"][hreflang="${next}"]`
    );
    try {
      localStorage.setItem("lang", next);
    } catch {
      /* ignore */
    }
    if (alt) window.location.assign(new URL(alt.href).pathname + window.location.hash);
    return;
  }
  const doc = document as DocWithVT;
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || reduced) return setLang(next);

  document.documentElement.classList.add("lang-fade");
  // flushSync: every island re-renders inside the callback, so the "new"
  // snapshot already holds the other language.
  const transition = doc.startViewTransition(() => flushSync(() => setLang(next)));
  // A hidden tab aborts the animation (the switch itself still happens).
  transition.ready.catch(() => {});
  try {
    await transition.finished;
  } finally {
    document.documentElement.classList.remove("lang-fade");
  }
}

export function useLang(): Lang {
  useEffect(() => {
    initLangFromClient();
  }, []);
  return useSyncExternalStore(
    (cb) => {
      langListeners.add(cb);
      return () => langListeners.delete(cb);
    },
    () => currentLang,
    () => (typeof document === "undefined" ? ssrLang : hydrationLang)
  );
}

export function useT() {
  const lang = useLang();
  return translations[lang];
}

// ---------- Theme Store ----------
let currentTheme: Theme = "dark";
const themeListeners = new Set<() => void>();
let themeInitialized = false;

function initThemeFromClient() {
  if (themeInitialized || typeof window === "undefined") return;
  themeInitialized = true;
  const attr = document.documentElement.getAttribute("data-theme");
  const resolved: Theme = attr === "light" ? "light" : "dark";
  if (resolved !== currentTheme) {
    currentTheme = resolved;
    themeListeners.forEach((cb) => cb());
  }
}

function applyThemeToDOM(theme: Theme, persist: boolean) {
  currentTheme = theme;
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", theme === "light" ? "#fafafa" : "#09090b");
    }
    if (persist) {
      try {
        localStorage.setItem("theme", theme);
      } catch {
        /* ignore */
      }
    }
  }
  themeListeners.forEach((cb) => cb());
}

export async function toggleTheme(anchorEl?: HTMLElement | null) {
  const next: Theme = currentTheme === "dark" ? "light" : "dark";
  if (typeof document === "undefined") return;

  const reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    const x = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
    const y = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
    document.documentElement.style.setProperty("--ripple-x", `${x}%`);
    document.documentElement.style.setProperty("--ripple-y", `${y}%`);
  }

  const docWithVT = document as DocWithVT;

  if (docWithVT.startViewTransition && !reduced) {
    document.documentElement.classList.add("theme-ripple");
    const transition = docWithVT.startViewTransition(() => {
      applyThemeToDOM(next, true);
    });
    transition.ready.catch(() => {});
    try {
      await transition.finished;
    } finally {
      document.documentElement.classList.remove("theme-ripple");
    }
  } else {
    applyThemeToDOM(next, true);
  }
}

export function useTheme(): Theme {
  useEffect(() => {
    initThemeFromClient();
  }, []);
  return useSyncExternalStore(
    (cb) => {
      themeListeners.add(cb);
      return () => themeListeners.delete(cb);
    },
    () => currentTheme,
    () => "dark"
  );
}

// ---------- Toast Store ----------
let toastSeq = 0;
let toasts: ToastItem[] = [];
const toastListeners = new Set<() => void>();

export function showToast(message: string) {
  if (!message) return;
  const id = ++toastSeq;
  toasts = [...toasts.slice(-2), { id, message }];
  toastListeners.forEach((cb) => cb());
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    toastListeners.forEach((cb) => cb());
  }, 2600);
}

export function useToasts(): ToastItem[] {
  return useSyncExternalStore(
    (cb) => {
      toastListeners.add(cb);
      return () => toastListeners.delete(cb);
    },
    () => toasts,
    () => []
  );
}
