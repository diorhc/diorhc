import {
  siAstro,
  siCloudflare,
  siCss,
  siGit,
  siGithubactions,
  siHtml5,
  siJavascript,
  siPython,
  siReact,
  siRust,
  siTypescript,
  type SimpleIcon,
} from "simple-icons";
import { SectionLabel } from "@/components/ui/section-label";
import { SKILLS, type SkillItem } from "@/data/skills";
import { useLang, useT } from "@/lib/store";

// Real logos in their own colours; a compound skill shows both of its tools.
const LOGOS: Record<SkillItem["icon"], SimpleIcon[]> = {
  js: [siJavascript],
  ts: [siTypescript],
  react: [siReact, siAstro],
  htmlcss: [siHtml5, siCss],
  python: [siPython],
  rust: [siRust],
  api: [siCloudflare],
  git: [siGit, siGithubactions],
};

/** Near-black brand colours (Rust) would vanish on the dark theme. */
function isTooDark(hex: string): boolean {
  const n = parseInt(hex, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 40;
}

function SkillLogos({ kind }: { kind: SkillItem["icon"] }) {
  return (
    <span aria-hidden="true" className="flex items-center gap-1.5">
      {LOGOS[kind].map((icon) => (
        <span
          key={icon.slug}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path
              d={icon.path}
              fill={isTooDark(icon.hex) ? "var(--text-primary)" : `#${icon.hex}`}
            />
          </svg>
        </span>
      ))}
    </span>
  );
}

/**
 * All skills at once in a plain grid (it was a 3D carousel showing one card
 * in eight): scannable, no timers, nothing to swipe.
 */
export function SkillsGrid() {
  const lang = useLang();
  const t = useT();

  return (
    <section
      id="skills"
      aria-labelledby="skills-title"
      className="relative flex min-h-[100svh] items-center py-24"
    >
      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-7">
        <SectionLabel id="skills-title" text={t.skills.eyebrow} />

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SKILLS.map((skill) => (
            <li
              key={skill.id}
              className="flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-sm)] transition-colors duration-200 hover:border-[var(--accent-border)]"
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <SkillLogos kind={skill.icon} />
                <span className="rounded-full border border-[var(--border-subtle)] px-2.5 py-0.5 font-mono-code text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                  {t.skills.levels[skill.level]}
                </span>
              </div>

              <h3 className="font-display mb-1.5 text-lg font-bold tracking-tight text-[var(--text-primary)]">
                {skill.name}
              </h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                {skill.desc[lang]}
              </p>

              <ul className="flex flex-wrap gap-1.5">
                {skill.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-[var(--bg-base)] px-2.5 py-0.5 font-mono-code text-[10px] text-[var(--text-secondary)]"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
