import "server-only";
import { logger } from "@/lib/logger";

/**
 * Lightweight rate limiter for serverless routes.
 *
 * - If `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set, uses Upstash
 *   Redis (durable + shared across all serverless instances) — recommended for
 *   production. No SDK dependency; talks to the REST pipeline API directly.
 * - Otherwise falls back to a per-instance in-memory fixed window. Best-effort
 *   (resets on cold start, not shared across instances) but still blocks bursts.
 *
 * Fail-open: if the backend errors, the request is allowed (availability over
 * strict enforcement) and the error is logged.
 */

export interface RateResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number; // ms until the window resets
}

const hasUpstash = () =>
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

// ── In-memory fallback ────────────────────────────────────────────────
const globalForRL = globalThis as unknown as {
  __rlStore?: Map<string, { count: number; resetAt: number }>;
};
const store = (globalForRL.__rlStore ??= new Map());

function memoryLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, limit, remaining: limit - 1, resetMs: windowMs };
  }
  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  return {
    success: entry.count <= limit,
    limit,
    remaining,
    resetMs: entry.resetAt - now,
  };
}

// Opportunistic cleanup so the map can't grow unbounded on a long-lived instance.
function sweep() {
  if (store.size < 5000) return;
  const now = Date.now();
  for (const [k, v] of store) if (now >= v.resetAt) store.delete(k);
}

// ── Upstash backend ───────────────────────────────────────────────────
async function upstashLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["PEXPIRE", key, windowMs, "NX"],
      ["PTTL", key],
    ]),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  const out = (await res.json()) as Array<{ result: number }>;
  const count = out[0]?.result ?? 1;
  const ttl = out[2]?.result ?? windowMs;
  const remaining = Math.max(0, limit - count);
  return {
    success: count <= limit,
    limit,
    remaining,
    resetMs: ttl > 0 ? ttl : windowMs,
  };
}

/**
 * Enforce `limit` requests per `windowMs` for `identifier` (e.g. an IP). The
 * `namespace` keeps independent limits (e.g. per route) from colliding.
 */
export async function rateLimit(
  identifier: string,
  opts: { limit: number; windowMs: number; namespace: string },
): Promise<RateResult> {
  const key = `rl:${opts.namespace}:${identifier}`;
  try {
    if (hasUpstash()) return await upstashLimit(key, opts.limit, opts.windowMs);
  } catch (err) {
    logger.warn("Rate limiter backend failed; falling back to memory", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
  sweep();
  return memoryLimit(key, opts.limit, opts.windowMs);
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
