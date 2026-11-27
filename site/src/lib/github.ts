// Build-time only: stars are fetched once per deploy instead of by every
// visitor (the unauthenticated GitHub API allows 60 requests per hour per IP).
// In CI, GITHUB_TOKEN raises that limit; locally it works without one.

async function fetchSingleRepoStars(repo: string): Promise<number> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const token = (
    globalThis as { process?: { env?: Record<string, string | undefined> } }
  ).process?.env?.GITHUB_TOKEN;
  try {
    const res = await fetch(`https://api.github.com/repos/diorhc/${repo}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "portfolio-build",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) return 0;
    const data = (await res.json()) as { stargazers_count?: number };
    const count = Number(data.stargazers_count ?? 0);
    return Number.isFinite(count) && count > 0 ? count : 0;
  } catch {
    return 0;
  } finally {
    clearTimeout(timer);
  }
}

let pending: Promise<Record<string, number>> | null = null;

/** Stars per repo name; 0 when GitHub is unreachable (the badge then hides). */
export function fetchRepoStarsAtBuild(
  repos: readonly string[]
): Promise<Record<string, number>> {
  pending ??= Promise.all(
    repos.map(async (repo) => [repo, await fetchSingleRepoStars(repo)] as const)
  ).then((entries) => Object.fromEntries(entries));
  return pending;
}

export interface ReleaseInfo {
  tag: string;
  name: string;
  publishedAt: string;
  url: string;
  /** First lines of the release notes as plain text (markdown stripped). */
  summary: string;
}

function plainSummary(body: string | null | undefined): string {
  const text = (body ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    // GitHub's generated boilerplate and bare links say nothing on their own
    .replace(/\*{0,2}Full Changelog\*{0,2}:?\s*\S+/gi, " ")
    .replace(/What's Changed/gi, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/(?:#\d+[,\s]*){2,}/g, " ")
    .replace(/[#>*_`~|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 180 ? `${text.slice(0, 177).trimEnd()}…` : text;
}

const releaseCache = new Map<string, Promise<ReleaseInfo[]>>();

/** Latest releases of a repo at build time; [] when GitHub is unreachable. */
export function fetchReleasesAtBuild(repo: string, limit = 5): Promise<ReleaseInfo[]> {
  const cached = releaseCache.get(repo);
  if (cached) return cached;
  const token = (
    globalThis as { process?: { env?: Record<string, string | undefined> } }
  ).process?.env?.GITHUB_TOKEN;
  const job = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(
        `https://api.github.com/repos/diorhc/${repo}/releases?per_page=${limit}`,
        {
          signal: controller.signal,
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "portfolio-build",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (!res.ok) return [];
      const list = (await res.json()) as Array<{
        tag_name?: string;
        name?: string | null;
        published_at?: string | null;
        html_url?: string;
        body?: string | null;
        draft?: boolean;
      }>;
      return list
        .filter((r) => !r.draft && r.tag_name && r.html_url && r.published_at)
        .map((r) => ({
          tag: r.tag_name!,
          name: r.name?.trim() || r.tag_name!,
          publishedAt: r.published_at!,
          url: r.html_url!,
          summary: plainSummary(r.body),
        }));
    } catch {
      return [];
    } finally {
      clearTimeout(timer);
    }
  })();
  releaseCache.set(repo, job);
  return job;
}
