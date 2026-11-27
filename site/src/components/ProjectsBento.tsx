import { ArrowRight, ArrowUpRight, ChevronRight, Copy, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { PROJECTS, type ProjectItem, type ProjectMedia } from "@/data/projects";
import { useLang, useT } from "@/lib/store";
import { cn, withBase } from "@/lib/utils";

type Lang = "ru" | "en";

/**
 * Still of the project. Background images, not <img>: Chrome fetches a hidden
 * lazy <img> anyway, while a display:none element's background is never
 * requested, so only the active theme's file loads.
 */
function MediaImage({ media }: { media: Extract<ProjectMedia, { kind: "image" }> }) {
  const layer =
    "absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03]";
  return (
    <>
      <div
        className={cn(layer, "dark:hidden")}
        style={{ backgroundImage: `url("${withBase(media.light)}")` }}
      />
      <div
        className={cn(layer, "hidden dark:block")}
        style={{ backgroundImage: `url("${withBase(media.dark)}")` }}
      />
    </>
  );
}

/** The YTDL window: its URL field, with the same wording as the app. */
function YtdlMock() {
  return (
    <div className="flex h-full items-center justify-center bg-[radial-gradient(120%_90%_at_70%_0%,var(--accent-soft),transparent_60%)] p-5 sm:p-7">
      <div className="w-full max-w-[460px] overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-[var(--shadow-md)] transition-transform duration-500 group-hover:scale-[1.02]">
        <div className="flex items-center gap-1.5 border-b border-[var(--border-subtle)] px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 font-mono-code text-[11px] text-[var(--text-muted)]">YTDL</span>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-3 rounded-full border border-[var(--border-strong)] bg-[var(--bg-base)] px-4 py-2.5">
            <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--text-secondary)]">
              Enter video URL (VK, Yandex, Dzen...)
              <span className="caret-blink ml-0.5 inline-block h-3.5 w-px translate-y-0.5 bg-[var(--accent)]" />
            </span>
            <Copy className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** A Telegram chat opening with the bot: no invented replies, just /start. */
function BotChatMock({ lang }: { lang: Lang }) {
  return (
    <div className="flex h-full items-center justify-center bg-[radial-gradient(120%_90%_at_30%_0%,var(--secondary-soft),transparent_60%)] p-5 sm:p-7">
      <div className="w-full max-w-[420px] overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-[var(--shadow-md)] transition-transform duration-500 group-hover:scale-[1.02]">
        <div className="flex items-center gap-2.5 border-b border-[var(--border-subtle)] px-3.5 py-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--secondary)] font-mono-code text-[11px] font-bold text-white">
            MP
          </span>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-[var(--text-primary)]">MyPort Bot</div>
            <div className="font-mono-code text-[11px] text-[var(--text-muted)]">
              @bydiore_bot · {lang === "en" ? "bot" : "бот"}
            </div>
          </div>
        </div>
        <div className="space-y-2.5 p-3.5">
          <div className="ml-auto w-fit rounded-2xl rounded-br-md bg-[var(--secondary)] px-3 py-1.5 font-mono-code text-[13px] text-white">
            /start
          </div>
          <div className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectMediaView({ media, lang }: { media: ProjectMedia; lang: Lang }) {
  switch (media.kind) {
    case "image":
      return <MediaImage media={media} />;
    case "ytdl-ui":
      return <YtdlMock />;
    case "bot-chat":
      return <BotChatMock lang={lang} />;
  }
}

function ProjectCard({
  project,
  starCount,
  lang,
}: {
  project: ProjectItem;
  starCount: number;
  lang: Lang;
}) {
  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-sm)] transition-colors duration-200 hover:border-[var(--accent-border)]",
        project.bentoClass
      )}
    >
      <div
        aria-hidden="true"
        className="relative h-[190px] overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--bg-base)] sm:h-[230px]"
      >
        <ProjectMediaView media={project.media} lang={lang} />
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <Badge>{project.badge[lang]}</Badge>
          {starCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] px-2.5 py-0.5 font-mono-code text-[11px] text-[var(--text-secondary)]">
              <Star className="h-3 w-3 fill-[var(--accent)] text-[var(--accent)]" aria-hidden="true" />
              {starCount}
              <span className="sr-only">GitHub stars</span>
            </span>
          )}
        </div>

        <h3 className="font-display mb-1.5 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          <a
            href={withBase(`${lang === "en" ? "en/" : ""}projects/${project.id}/`)}
            className="group/title inline-flex items-center gap-1.5 decoration-[var(--accent)] decoration-2 underline-offset-4 hover:underline"
          >
            {project.title}
            <ArrowRight
              className="h-5 w-5 text-[var(--text-muted)] transition-transform group-hover/title:translate-x-0.5 group-hover/title:text-[var(--accent)]"
              aria-hidden="true"
            />
          </a>
        </h3>
        <p className="mb-5 flex-1 text-sm text-[var(--text-secondary)] sm:text-[15px]">
          {project.summary[lang]}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <ul className="flex flex-wrap gap-1.5">
            {project.tech.map((tech) => (
              <li
                key={tech}
                className="rounded-full border border-[var(--border-subtle)] px-2.5 py-0.5 font-mono-code text-[11px] text-[var(--text-secondary)]"
              >
                {tech}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-2">
            {project.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
                  link.variant === "secondary"
                    ? "border border-[var(--border-strong)] text-[var(--text-primary)] hover:border-[var(--accent-border)]"
                    : "bg-[var(--accent)] text-[var(--accent-fg)]"
                )}
              >
                <span>{link.label[lang]}</span>
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProjectsBento({
  stars: starsMap = {},
}: {
  /** Stars per repo, fetched at build time. */
  stars?: Record<string, number>;
}) {
  const lang = useLang();
  const t = useT();

  return (
    <section
      id="projects"
      aria-labelledby="projects-title"
      className="relative flex min-h-[100svh] items-center py-24"
    >
      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-7">
        <SectionLabel id="projects-title" text={t.projects.eyebrow} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {PROJECTS.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              starCount={project.repoName ? starsMap[project.repoName] ?? 0 : 0}
              lang={lang}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
