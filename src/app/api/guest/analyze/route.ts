import type { NextRequest } from "next/server";
import { extractRawText } from "@/lib/parsing/extract";
import { aiParseResume, runFullAnalysis } from "@/lib/ai/engine";
import { weightedOverall } from "@/lib/ai/rubrics/score-v1";
import { detectFileType } from "@/lib/parsing/file-type";
import {
  MAX_GUEST_FILE_BYTES,
  MAX_EXTRACTED_CHARS,
  MAX_JD_CHARS,
} from "@/lib/constants";
import { ok, handleError, AppError } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 60;

// Guest analysis is unauthenticated and calls OpenAI — guard it tightly.
const BURST = { limit: 3, windowMs: 60_000 }; // 3 / minute
const DAILY = { limit: 30, windowMs: 24 * 60 * 60_000 }; // 30 / day

/**
 * Guest analysis — no auth, no persistence. Rate-limited per IP to contain
 * OpenAI cost/abuse. Validates the file, bounds the input, runs the pipeline
 * in-memory, and returns the result inline. Nothing is saved.
 */
export async function POST(req: NextRequest) {
  const started = Date.now();
  const ip = clientIp(req);
  try {
    // 1) Reject obviously-oversized payloads before buffering (abuse guard).
    //    Vercel also caps the request body (~4.5MB) at the platform edge.
    const declared = Number(req.headers.get("content-length") ?? 0);
    if (declared > MAX_GUEST_FILE_BYTES + 64 * 1024) {
      throw new AppError("RESUME_TOO_LARGE", "File exceeds the 4MB limit.");
    }

    // 2) Read the body FIRST so every later rejection responds cleanly without
    //    leaving an undrained request stream (which resets the connection).
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw new AppError(
        "VALIDATION_ERROR",
        "Expected a multipart form upload with a resume file.",
      );
    }
    const file = form.get("file");
    const jdText = String(form.get("jdText") ?? "").trim().slice(0, MAX_JD_CHARS);
    const jdTitle = String(form.get("jdTitle") ?? "").trim().slice(0, 200);

    if (!(file instanceof File)) {
      throw new AppError("VALIDATION_ERROR", "Please choose a resume file.");
    }
    // Read the file bytes now so the request stream is fully drained before any
    // validation throw (an undrained file part resets the connection locally).
    const buffer = await file.arrayBuffer();

    // 3) Rate limit (burst + daily) before any expensive OpenAI work.
    const burst = await rateLimit(ip, { ...BURST, namespace: "guest-burst" });
    const daily = await rateLimit(ip, { ...DAILY, namespace: "guest-daily" });
    const blocked = !burst.success ? burst : !daily.success ? daily : null;
    if (blocked) {
      logger.warn("Guest analyze rate limited", {
        ip,
        namespace: !burst.success ? "burst" : "daily",
      });
      return rateLimitedResponse(blocked.resetMs);
    }

    // 4) Validate the upload.
    if (buffer.byteLength === 0) {
      throw new AppError("VALIDATION_ERROR", "The uploaded file is empty.");
    }
    if (buffer.byteLength > MAX_GUEST_FILE_BYTES) {
      throw new AppError("RESUME_TOO_LARGE", "File exceeds the 4MB limit.");
    }
    const fileType = detectFileType(file.type, file.name);
    if (!fileType) {
      throw new AppError(
        "UNSUPPORTED_FILE_TYPE",
        "Only PDF and DOCX files are supported.",
      );
    }

    // 5) Extract + bound the text before sending to the model.
    const rawText = (await extractRawText(buffer, fileType)).slice(
      0,
      MAX_EXTRACTED_CHARS,
    );
    const { data: parsed } = await aiParseResume(rawText);

    const result = await runFullAnalysis({
      rawText,
      parsedJson: JSON.stringify(parsed),
      jdText: jdText.length >= 50 ? jdText : undefined,
    });

    logger.info("Guest analyze ok", {
      ip,
      ms: Date.now() - started,
      jd: jdText.length >= 50,
      bytes: file.size,
    });

    return ok({
      fileName: file.name,
      jdTitle: jdTitle || undefined,
      overallScore: weightedOverall(result.score.subScores),
      subScores: result.score.subScores,
      summary: result.score.summary,
      modelUsed: result.usage.model,
      ats: result.ats,
      match: result.match ?? null,
      suggestions: result.suggestions,
    });
  } catch (e) {
    logger.warn("Guest analyze failed", {
      ip,
      ms: Date.now() - started,
      error: e instanceof Error ? e.message : String(e),
    });
    return handleError(e);
  }
}

function rateLimitedResponse(resetMs: number) {
  const retry = Math.ceil(resetMs / 1000);
  return new Response(
    JSON.stringify({
      error: {
        code: "RATE_LIMITED",
        message: "You're going a bit fast. Please wait a moment and try again.",
        details: { retryAfter: retry },
      },
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retry),
      },
    },
  );
}
