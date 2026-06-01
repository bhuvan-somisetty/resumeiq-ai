import "server-only";
import { GoogleGenAI } from "@google/genai";

/**
 * Lazily-instantiated Google Gemini client. Lazy init keeps `next build` from
 * needing a real API key at module-eval time. Uses the free-tier Gemini API
 * (Google AI Studio key), so no billing is required.
 */
let _client: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    _client = new GoogleGenAI({
      apiKey,
      // Bound per-request latency so a hung call can't exhaust the function timeout.
      httpOptions: { timeout: 30_000 },
    });
  }
  return _client;
}
