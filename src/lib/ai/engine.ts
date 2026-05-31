import "server-only";
import type { z } from "zod";
import { getOpenAI } from "@/lib/ai/client";
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
 * Core JSON completion helper. Calls OpenAI in JSON mode, validates the response
 * against a Zod schema, and retries once on malformed output before failing.
 */
async function jsonCall<T>(
  schema: z.ZodType<T>,
  system: string,
  user: string,
  model: string = MODELS.analysis,
): Promise<CallResult<T>> {
  const client = getOpenAI();
  let lastErr: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    let completion;
    try {
      completion = await client.chat.completions.create({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content:
              attempt === 0
                ? user
                : `${user}\n\nYour previous response was not valid JSON for the schema. Return ONLY valid JSON.`,
          },
        ],
      });
    } catch (err) {
      throw mapOpenAiError(err);
    }

    const content = completion.choices[0]?.message?.content ?? "";
    const usage: AiUsage = {
      model,
      tokensInput: completion.usage?.prompt_tokens ?? 0,
      tokensOutput: completion.usage?.completion_tokens ?? 0,
      costCents: estimateCostCents(
        model,
        completion.usage?.prompt_tokens ?? 0,
        completion.usage?.completion_tokens ?? 0,
      ),
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

/** Translate an OpenAI SDK error into a user-safe AppError. */
function mapOpenAiError(err: unknown): AppError {
  const status =
    typeof err === "object" && err !== null && "status" in err
      ? (err as { status?: number }).status
      : undefined;
  const name = err instanceof Error ? err.name : "";
  const cause = err instanceof Error ? err.message : String(err);

  if (status === 429) {
    logger.warn("OpenAI rate limited", { cause });
    return new AppError(
      "RATE_LIMITED",
      "The analysis service is busy right now. Please try again in a moment.",
    );
  }
  if (status === 401 || status === 403) {
    // Misconfiguration (bad/missing key) — don't leak details to the client.
    logger.error("OpenAI auth failure", { status, cause });
    return new AppError(
      "ANALYSIS_FAILED",
      "The analysis service is temporarily unavailable.",
    );
  }
  if (name.includes("Timeout") || name.includes("Connection")) {
    logger.warn("OpenAI timeout/connection error", { cause });
    return new AppError(
      "ANALYSIS_FAILED",
      "The analysis timed out. Please try again.",
    );
  }
  logger.error("OpenAI request failed", { status, cause });
  return new AppError(
    "ANALYSIS_FAILED",
    "We couldn't complete the analysis. Please try again.",
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

  const [scoreRes, atsRes, matchRes] = await Promise.all([
    jsonCall(
      resumeScoreResultSchema,
      scorePrompt.system,
      scorePrompt.user(input.parsedJson),
      model,
    ),
    jsonCall(
      atsReportResultSchema,
      atsPrompt.system,
      atsPrompt.user(input.rawText, input.parsedJson),
      MODELS.fast,
    ),
    input.jdText
      ? jsonCall(
          matchResultSchema,
          matchPrompt.system,
          matchPrompt.user(input.parsedJson, input.jdText),
          model,
        )
      : Promise.resolve(null),
  ]);

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
