import { isBlockedMessage } from "./moderation";

export interface Env {
  GUESTBOOK_KV: KVNamespace;
}

interface HistoryEntry {
  message: string;
  updatedAt: string;
}

interface StoredMessage {
  message: string;
  updatedAt: string | null;
  history: HistoryEntry[];
}

const LATEST_KEY = "guestbook:latest";
const DEFAULT_MESSAGE = "DIORHC+";
const MAX_LENGTH = 40;
const MAX_HISTORY = 5;
// Workers KV rejects expirationTtl below 60, so this cannot be shorter.
// KV is eventually consistent: the limit stops casual spam, not a determined
// script. A strict limit would need a Durable Object or the Rate Limiting binding.
const RATE_LIMIT_SECONDS = 60;

const ALLOWED_CHAR_REGEX =
  /^[0-9A-Za-zА-Яа-яЁё\s.,:;!?'"`\-–—()\[\]{}/\\|+=<>~#@%^&_]+$/u;
const BLOCKED_SUBSTRINGS = ["HTTP://", "HTTPS://", "WWW.", ".COM/", ".RU/"];

function isAllowedOrigin(origin: string | null): string | null {
  if (!origin) return null;
  if (origin === "https://diorhc.github.io") return origin;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return origin;
  }
  return null;
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = isAllowedOrigin(origin) ?? "https://diorhc.github.io";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function jsonResponse(
  body: unknown,
  status: number,
  origin: string | null
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(origin),
    },
  });
}

function sanitizeMessage(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned || cleaned.length > MAX_LENGTH) return null;
  if (!ALLOWED_CHAR_REGEX.test(cleaned)) return null;
  const upper = cleaned.toUpperCase();
  if (BLOCKED_SUBSTRINGS.some((s) => upper.includes(s))) return null;
  return cleaned;
}

function normalizeStored(raw: Partial<StoredMessage> | null): StoredMessage {
  if (!raw || !raw.message) {
    return { message: DEFAULT_MESSAGE, updatedAt: null, history: [] };
  }
  const history = Array.isArray(raw.history)
    ? raw.history.slice(0, MAX_HISTORY)
    : raw.updatedAt
      ? [{ message: raw.message, updatedAt: raw.updatedAt }]
      : [];
  return {
    message: raw.message,
    updatedAt: raw.updatedAt ?? null,
    history,
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname !== "/api/message") {
      return jsonResponse({ error: "Not found" }, 404, origin);
    }

    if (request.method === "GET") {
      const raw = await env.GUESTBOOK_KV.get<Partial<StoredMessage>>(
        LATEST_KEY,
        "json"
      );
      return jsonResponse(normalizeStored(raw), 200, origin);
    }

    if (request.method === "POST") {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const rateKey = `rl:${ip}`;
      const existingRate = await env.GUESTBOOK_KV.get(rateKey);
      if (existingRate) {
        return jsonResponse(
          {
            error: `Rate limited. Wait ${RATE_LIMIT_SECONDS} seconds before posting again.`,
            code: "rate_limited",
          },
          429,
          origin
        );
      }

      let payload: { message?: unknown };
      try {
        payload = (await request.json()) as { message?: unknown };
      } catch {
        return jsonResponse({ error: "Invalid JSON body" }, 400, origin);
      }

      const message = sanitizeMessage(payload.message);
      if (!message) {
        return jsonResponse(
          {
            error: "Message must be 1-40 supported characters without URLs.",
            code: "invalid",
          },
          400,
          origin
        );
      }

      if (isBlockedMessage(message)) {
        return jsonResponse(
          { error: "Message did not pass the content filter.", code: "blocked" },
          400,
          origin
        );
      }

      const current = normalizeStored(
        await env.GUESTBOOK_KV.get<Partial<StoredMessage>>(LATEST_KEY, "json")
      );
      const updatedAt = new Date().toISOString();
      const nextHistory: HistoryEntry[] = [
        { message, updatedAt },
        ...current.history.filter((entry) => entry.message !== message),
      ].slice(0, MAX_HISTORY);

      const record: StoredMessage = {
        message,
        updatedAt,
        history: nextHistory,
      };

      await Promise.all([
        env.GUESTBOOK_KV.put(LATEST_KEY, JSON.stringify(record)),
        env.GUESTBOOK_KV.put(rateKey, "1", {
          expirationTtl: RATE_LIMIT_SECONDS,
        }),
      ]);

      return jsonResponse({ ok: true, ...record }, 200, origin);
    }

    return jsonResponse({ error: "Method not allowed" }, 405, origin);
  },
};
