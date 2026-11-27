// One shared request per page for the Greasy Fork stats of both scripts:
// the About counter and the Reviews bar read the same JSON.
export const GF_SCRIPT_IDS = [537017, 537433] as const;

const CACHE_KEY = "gf_stats_v1_537017_537433";
const CACHE_TTL_MS = 12 * 3600 * 1000;

export interface GreasyForkStats {
  good: number;
  ok: number;
  bad: number;
  installs: number;
}

const EMPTY: GreasyForkStats = { good: 0, ok: 0, bad: 0, installs: 0 };

function readCache(): GreasyForkStats | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts?: number; data?: GreasyForkStats };
    if (
      parsed?.data &&
      typeof parsed.ts === "number" &&
      Date.now() - parsed.ts < CACHE_TTL_MS
    ) {
      return parsed.data;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function num(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

async function fetchScript(id: number): Promise<GreasyForkStats> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const res = await fetch(`https://api.greasyfork.org/en/scripts/${id}.json`, {
      signal: controller.signal,
    });
    if (!res.ok) return EMPTY;
    const data = (await res.json()) as Record<string, unknown>;
    return {
      good: num(data.good_ratings),
      ok: num(data.ok_ratings),
      bad: num(data.bad_ratings),
      installs: num(data.total_installs),
    };
  } catch {
    return EMPTY;
  } finally {
    clearTimeout(timer);
  }
}

let pending: Promise<GreasyForkStats | null> | null = null;

/** Summed stats of both scripts, or null when Greasy Fork is unreachable. */
export function loadGreasyForkStats(): Promise<GreasyForkStats | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (pending) return pending;

  const cached = readCache();
  if (cached) {
    pending = Promise.resolve(cached);
    return pending;
  }

  pending = Promise.all(GF_SCRIPT_IDS.map(fetchScript)).then((list) => {
    const sum = list.reduce<GreasyForkStats>(
      (acc, s) => ({
        good: acc.good + s.good,
        ok: acc.ok + s.ok,
        bad: acc.bad + s.bad,
        installs: acc.installs + s.installs,
      }),
      EMPTY
    );
    if (sum.installs <= 0) return null;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: sum }));
    } catch {
      /* ignore */
    }
    return sum;
  });
  return pending;
}

let buildPending: Promise<GreasyForkStats | null> | null = null;

/** Build-time snapshot baked into the HTML; the client refreshes it later. */
export function fetchGreasyForkStatsAtBuild(): Promise<GreasyForkStats | null> {
  buildPending ??= Promise.all(GF_SCRIPT_IDS.map(fetchScript)).then((list) => {
    const sum = list.reduce<GreasyForkStats>(
      (acc, s) => ({
        good: acc.good + s.good,
        ok: acc.ok + s.ok,
        bad: acc.bad + s.bad,
        installs: acc.installs + s.installs,
      }),
      EMPTY
    );
    return sum.installs > 0 ? sum : null;
  });
  return buildPending;
}
