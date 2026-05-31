/**
 * Minimal structured logger. Swap the sink for Axiom/Sentry in production
 * (see /docs/02-System-Architecture.md §2.9).
 */
type Level = "debug" | "info" | "warn" | "error";

function log(level: Level, message: string, meta?: Record<string, unknown>) {
  const entry = {
    level,
    message,
    ...meta,
    ts: new Date().toISOString(),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (m: string, meta?: Record<string, unknown>) => log("debug", m, meta),
  info: (m: string, meta?: Record<string, unknown>) => log("info", m, meta),
  warn: (m: string, meta?: Record<string, unknown>) => log("warn", m, meta),
  error: (m: string, meta?: Record<string, unknown>) => log("error", m, meta),
};
