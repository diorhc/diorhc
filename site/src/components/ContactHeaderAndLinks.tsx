import { ArrowUpRight } from "lucide-react";
import { BrandIcon } from "@/components/ui/brand-icon";
import { CONTACTS } from "@/data/contacts";
import { SectionLabel } from "@/components/ui/section-label";
import { useLang, useT } from "@/lib/store";

export function ContactHeader() {
  const t = useT();
  return (
    <div className="mb-8 text-center">
      <SectionLabel id="contact-title" text={t.contact.eyebrow} className="mb-4" />
      <p className="mx-auto max-w-2xl text-sm text-[var(--text-secondary)] sm:text-base">
        {t.contact.text}
      </p>
    </div>
  );
}

export function ContactLinksAndFooter() {
  const t = useT();

  return (
    <div className="mt-10">
      <p className="mb-4 text-center font-mono-code text-xs uppercase tracking-widest text-[var(--text-muted)]">
        {t.contact.connectTitle}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CONTACTS.map((item) => (
          <a
            key={item.name}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent-border)] hover:shadow-[var(--shadow-md)]"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]">
              <BrandIcon icon={item.icon} className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                {item.name}
              </div>
              <div className="truncate font-mono-code text-xs text-[var(--text-secondary)]">
                {item.handle}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

/** Page footer: who, when it was last built, and where the source lives. */
export function SiteFooter({ builtAt }: { builtAt: string }) {
  const t = useT();
  const lang = useLang();
  const date = new Date(builtAt);
  const updated = new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  return (
    // pb-36 on phones clears the dock and the floating back-to-top button.
    <footer className="border-t border-[var(--border-subtle)] pb-36 pt-6 lg:pb-8">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center gap-2 px-5 text-center font-mono-code text-[11px] text-[var(--text-muted)] sm:flex-row sm:justify-between sm:px-7 sm:text-left">
        <p>
          © {date.getFullYear()} Dior E (diorhc) · {t.contact.footer}
        </p>
        <p className="flex items-center gap-3">
          <span>
            {t.contact.footerUpdated}: <time dateTime={builtAt}>{updated}</time>
          </span>
          <a
            href="https://github.com/diorhc/diorhc"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[var(--text-secondary)] underline decoration-[var(--border-strong)] underline-offset-4 transition-colors hover:text-[var(--accent)] hover:decoration-[var(--accent)]"
          >
            {t.contact.footerSource}
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </a>
        </p>
      </div>
    </footer>
  );
}
