import "server-only";
import type { z } from "zod";
import { getGemini } from "@/lib/ai/client";
import { MODELS, estimateCostCents } from "@/lib/ai/models";
import { parsePrompt, combinedAnalysisPrompt } from "@/lib/ai/prompts";
import {
  parsedResumeSchema,
  resumeScoreResultSchema,
  atsReportResultSchema,
  matchResultSchema,
  suggestionsResultSchema,
  combinedAnalysisSchema,
} from "@/lib/ai/schemas";
import { weightedOverall } from "@/lib/ai/rubrics/score-v1";
import { logger } from "@/lib/logger";
import { AppError } from "@/lib/errors";
import { isDemoMode } from "@/lib/dev-mode";
import { demoParseResume, demoFullAnalysis } from "@/lib/ai/demo-engine";

export interface AiUsage {
  model: string;
  tokensInput: number;
  tokensOutput: number;
  costCents: number;
}

interface CallResult<T> {
  data: T;
  usage: AiUsage;
}

/**
 * Core JSON completion helper. Calls Gemini in JSON mode, validates the response
 * against a Zod schema, and retries once on malformed output before failing.
 */
async function jsonCall<T>(
  schema: z.ZodType<T>,
  system: string,
  user: string,
  model: string = MODELS.analysis,
): Promise<CallResult<T>> {
  const client = getGemini();
  let lastErr: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    let response;
    try {
      response = await generateWithRetry(client, model, {
        model,
        contents:
          attempt === 0
            ? user
            : `${user}\n\nYour previous response was not valid JSON for the schema. Return ONLY valid JSON.`,
        config: {
          systemInstruction: system,
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });
    } catch (err) {
      throw mapGeminiError(err);
    }

    const content = response.text ?? "";
    const inTok = response.usageMetadata?.promptTokenCount ?? 0;
    const outTok = response.usageMetadata?.candidatesTokenCount ?? 0;
    const usage: AiUsage = {
      model,
      tokensInput: inTok,
      tokensOutput: outTok,
      costCents: estimateCostCents(model, inTok, outTok),
    };

    try {
      const parsed = schema.parse(JSON.parse(content));
      return { data: parsed, usage };
    } catch (err) {
      lastErr = err;
      logger.warn("AI JSON validation failed", { attempt, model });
    }
  }

  throw new AppError("ANALYSIS_FAILED", "The AI returned an invalid response.", {
    cause: lastErr instanceof Error ? lastErr.message : String(lastErr),
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function statusOf(err: unknown): number | undefined {
  return typeof err === "object" && err !== null && "status" in err
    ? (err as { status?: number }).status
    : undefined;
}

function is429(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    statusOf(err) === 429 ||
    /RESOURCE_EXHAUSTED|rate limit|quota|too many requests/i.test(msg)
  );
}

function is503(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    statusOf(err) === 503 || /503|UNAVAILABLE|overloaded/i.test(msg)
  );
}

/**
 * Call Gemini, retrying only *temporary* 503 (UNAVAILABLE / model overloaded)
 * errors up to 3 times with exponential backoff. The SDK does not auto-retry.
 * Quota 429s are NOT retried — a daily cap won't clear in seconds, so we fail
 * fast to a clear "quota reached" message.
 */
async function generateWithRetry(
  client: ReturnType<typeof getGemini>,
  model: string,
  params: Parameters<ReturnType<typeof getGemini>["models"]["generateContent"]>[0],
) {
  const backoffs = [1000, 2000, 4000]; // up to 3 retries
  for (let attempt = 0; ; attempt++) {
    try {
      return await client.models.generateContent(params);
    } catch (err) {
      if (is503(err) && attempt < backoffs.length) {
        logger.warn("Gemini 503 (unavailable) — retrying", {
          attempt: attempt + 1,
          model,
        });
        await sleep(backoffs[attempt]!);
        continue;
      }
      throw err;
    }
  }
}

/** Translate a Gemini SDK error into a user-safe AppError. */
function mapGeminiError(err: unknown): AppError {
  const status = statusOf(err);
  const name = err instanceof Error ? err.name : "";
  const cause = err instanceof Error ? err.message : String(err);

  // 429 / RESOURCE_EXHAUSTED = free-tier quota reached. Log the exact Gemini
  // error (full message, not truncated) for debugging.
  if (is429(err)) {
    logger.warn("Gemini quota exhausted (RESOURCE_EXHAUSTED / 429)", {
      status,
      geminiError: cause,
    });
    return new AppError(
      "RATE_LIMITED",
      "Today's free AI quota has been reached. Please try again later.",
    );
  }
  // 503 after retries — temporary unavailability.
  if (is503(err)) {
    logger.warn("Gemini unavailable (503) after retries", { geminiError: cause });
    return new AppError(
      "ANALYSIS_FAILED",
      "The analysis service is briefly unavailable. Please try again.",
    );
  }
  // 400/401/403 = bad/missing key or permission — don't leak details.
  if (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    /API key not valid|PERMISSION_DENIED/i.test(cause)
  ) {
    logger.error("Gemini auth/config failure", { status, geminiError: cause });
    return new AppError(
      "ANALYSIS_FAILED",
      "The analysis service is temporarily unavailable.",
    );
  }
  if (name.includes("Timeout") || /timeout|ETIMEDOUT|ECONN/i.test(cause)) {
    logger.warn("Gemini timeout/connection error", { geminiError: cause });
    return new AppError(
      "ANALYSIS_FAILED",
      "The analysis timed out. Please try again.",
    );
  }
  logger.error("Gemini request failed", { status, geminiError: cause });
  return new AppError(
    "ANALYSIS_FAILED",
    "We couldn't complete the analysis. Please try again.",
  );
}

/** Extract structured resume data from raw text. */
export async function aiParseResume(rawText: string) {
  if (isDemoMode()) return demoParseResume(rawText);
  return jsonCall(
    parsedResumeSchema,
    parsePrompt.system,
    parsePrompt.user(rawText),
    MODELS.fast,
  );
}

export interface FullAnalysisInput {
  rawText: string;
  /** Optional structured resume JSON (unused by the single-call path). */
  parsedJson?: string;
  jdText?: string;
  deep?: boolean;
}

export interface FullAnalysisOutput {
  score: z.infer<typeof resumeScoreResultSchema>;
  ats: z.infer<typeof atsReportResultSchema>;
  match?: z.infer<typeof matchResultSchema>;
  suggestions: z.infer<typeof suggestionsResultSchema>["suggestions"];
  usage: AiUsage;
}

/**
 * Run the full analysis in a SINGLE Gemini call (score + ATS + suggestions +
 * optional JD match) straight from raw resume text. This replaces the previous
 * 4-call pipeline, cutting free-tier quota usage ~4x while returning the same
 * shape. The overall score is computed deterministically from the sub-scores.
 */
export async function runFullAnalysis(
  input: FullAnalysisInput,
): Promise<FullAnalysisOutput> {
  if (isDemoMode()) return demoFullAnalysis(input);

  const { data, usage } = await jsonCall(
    combinedAnalysisSchema,
    combinedAnalysisPrompt.system,
    combinedAnalysisPrompt.user(input.rawText, input.jdText),
    MODELS.analysis,
  );

  return {
    score: {
      overallScore: weightedOverall(data.subScores),
      subScores: data.subScores,
      summary: data.summary,
    },
    ats: data.ats,
    match: data.match ?? undefined,
    suggestions: data.suggestions,
    usage,
  };
}
