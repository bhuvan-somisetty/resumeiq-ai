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
    _client = new OpenAI({ apiKey });
  }
  return _client;
}
