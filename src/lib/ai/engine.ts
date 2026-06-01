import "server-only";
import type { z } from "zod";
import { getGemini } from "@/lib/ai/client";
import { MODELS, estimateCostCents } from "@/lib/ai/models";
import {
  parsePrompt,
  scorePrompt,
  atsPrompt,
  matchPrompt,
  suggestPrompt,
} from "@/lib/ai/prompts";
import {
  parsedResumeSchema,
  resumeScoreResultSchema,
  atsReportResultSchema,
  matchResultSchema,
  suggestionsResultSchema,
} from "@/lib/ai/schemas";
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

function is429(err: unknown): boolean {
  const status =
    typeof err === "object" && err !== null && "status" in err
      ? (err as { status?: number }).status
      : undefined;
  const msg = err instanceof Error ? err.message : String(err);
  return status === 429 || /RESOURCE_EXHAUSTED|rate limit|quota|too many requests/i.test(msg);
}

/**
 * Call Gemini, retrying transient 429s (free-tier per-minute limits) with
 * backoff. The SDK does not auto-retry. Backoff stays well under the function
 * timeout so a hard quota still fails fast.
 */
async function generateWithRetry(
  client: ReturnType<typeof getGemini>,
  model: string,
  params: Parameters<ReturnType<typeof getGemini>["models"]["generateContent"]>[0],
) {
  const backoffs = [1500, 4000];
  for (let i = 0; ; i++) {
    try {
      return await client.models.generateContent(params);
    } catch (err) {
      if (is429(err) && i < backoffs.length) {
        logger.warn("Gemini 429 — backing off", { attempt: i + 1, model });
        await sleep(backoffs[i]!);
        continue;
      }
      throw err;
    }
  }
}

/** Translate a Gemini SDK error into a user-safe AppError. */
function mapGeminiError(err: unknown): AppError {
  const status =
    typeof err === "object" && err !== null && "status" in err
      ? (err as { status?: number }).status
      : undefined;
  const name = err instanceof Error ? err.name : "";
  const cause = err instanceof Error ? err.message : String(err);

  // 429 = free-tier rate/quota limit.
  if (status === 429 || /quota|rate limit|RESOURCE_EXHAUSTED/i.test(cause)) {
    logger.warn("Gemini rate/quota limited", { cause });
    return new AppError(
      "RATE_LIMITED",
      "The analysis service is busy right now. Please try again in a moment.",
      { diag: cause.slice(0, 800) }, // TEMP diagnostic — remove after debugging
    );
  }
  // 400/401/403 = bad/missing key or permission — don't leak details.
  if (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    /API key not valid|PERMISSION_DENIED/i.test(cause)
  ) {
    logger.error("Gemini auth/config failure", { status, cause });
    return new AppError(
      "ANALYSIS_FAILED",
      "The analysis service is temporarily unavailable.",
    );
  }
  if (name.includes("Timeout") || /timeout|ETIMEDOUT|ECONN/i.test(cause)) {
    logger.warn("Gemini timeout/connection error", { cause });
    return new AppError(
      "ANALYSIS_FAILED",
      "The analysis timed out. Please try again.",
    );
  }
  logger.error("Gemini request failed", { status, cause });
  return new AppError(
    "ANALYSIS_FAILED",
    "We couldn't complete the analysis. Please try again.",
    { diag: `status=${status} ${cause.slice(0, 700)}` }, // TEMP diagnostic
  );
}

function sumUsage(parts: AiUsage[]): AiUsage {
  return parts.reduce<AiUsage>(
    (acc, u) => ({
      model: u.model,
      tokensInput: acc.tokensInput + u.tokensInput,
      tokensOutput: acc.tokensOutput + u.tokensOutput,
      costCents: acc.costCents + u.costCents,
    }),
    { model: MODELS.analysis, tokensInput: 0, tokensOutput: 0, costCents: 0 },
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
  parsedJson: string;
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
 * Run the full analysis pipeline (score → ATS → optional JD match → suggestions).
 * Steps run concurrently where independent to minimize latency.
 */
export async function runFullAnalysis(
  input: FullAnalysisInput,
): Promise<FullAnalysisOutput> {
  if (isDemoMode()) return demoFullAnalysis(input);

  const model = input.deep ? MODELS.analysis : MODELS.analysis;

  // Sequential (not parallel) to avoid bursting the Gemini free-tier per-minute
  // request limit, which returns 429s when several calls fire at once.
  const scoreRes = await jsonCall(
    resumeScoreResultSchema,
    scorePrompt.system,
    scorePrompt.user(input.parsedJson),
    model,
  );
  const atsRes = await jsonCall(
    atsReportResultSchema,
    atsPrompt.system,
    atsPrompt.user(input.rawText, input.parsedJson),
    MODELS.fast,
  );
  const matchRes = input.jdText
    ? await jsonCall(
        matchResultSchema,
        matchPrompt.system,
        matchPrompt.user(input.parsedJson, input.jdText),
        model,
      )
    : null;

  const context = input.jdText
    ? `JOB DESCRIPTION (tailor suggestions to it):\n"""\n${input.jdText.slice(0, 6000)}\n"""`
    : "Focus on general resume quality and impact.";

  const suggestRes = await jsonCall(
    suggestionsResultSchema,
    suggestPrompt.system,
    suggestPrompt.user(input.parsedJson, context),
    model,
  );

  const usageParts = [scoreRes.usage, atsRes.usage, suggestRes.usage];
  if (matchRes) usageParts.push(matchRes.usage);

  return {
    score: scoreRes.data,
    ats: atsRes.data,
    match: matchRes?.data,
    suggestions: suggestRes.data.suggestions,
    usage: sumUsage(usageParts),
  };
}
