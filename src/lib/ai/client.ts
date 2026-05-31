import "server-only";
import OpenAI from "openai";

/**
 * Lazily-instantiated OpenAI client. Lazy init keeps `next build` from needing a
 * real API key at module-eval time.
 */
let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    _client = new OpenAI({
      apiKey,
      // Bound per-request latency so a hung call can't exhaust the function
      // timeout; retry transient failures (429 / 5xx / network) with backoff.
      timeout: 30_000,
      maxRetries: 2,
    });
  }
  return _client;
}
