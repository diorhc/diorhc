import { cn } from "@/lib/utils";

interface SectionLabelProps {
  id: string;
  text: string;
  className?: string;
}

/**
 * Minimal section heading styled exclusively as a lime monospace index label
 * flanked by subtle hairline rules.
 */
export function SectionLabel({ id, text, className }: SectionLabelProps) {
  return (
    <div className={cn("mb-10 flex items-center justify-center gap-4", className)}>
      <span
        aria-hidden="true"
        className="h-px max-w-[120px] flex-1 bg-gradient-to-r from-transparent to-[var(--border-strong)]"
      />
      <h2
        id={id}
        className="font-mono-code shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)] sm:text-sm"
      >
        {text}
      </h2>
      <span
        aria-hidden="true"
        className="h-px max-w-[120px] flex-1 bg-gradient-to-l from-transparent to-[var(--border-strong)]"
      />
    </div>
  );
}
