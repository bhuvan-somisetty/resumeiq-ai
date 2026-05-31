import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, isAppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

/** Standard success envelope (see /docs/04-API-Design.md §4.2). */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function accepted<T>(data: T) {
  return NextResponse.json({ data }, { status: 202 });
}

/** Normalize any thrown error into the standard error envelope. */
export function handleError(error: unknown) {
  if (isAppError(error)) {
    // Server-fault AppErrors (5xx) are logged at error; client faults at warn.
    const level = error.status >= 500 ? "error" : "warn";
    logger[level]("Handled API error", {
      code: error.code,
      status: error.status,
      message: error.message,
    });
    return NextResponse.json(error.toJSON(), { status: error.status });
  }
  if (error instanceof ZodError) {
    logger.warn("Request validation failed", {
      issues: error.flatten().fieldErrors,
    });
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request.",
          details: { issues: error.flatten() },
        },
      },
      { status: 400 },
    );
  }
  logger.error("Unhandled API error", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  return NextResponse.json(
    {
      error: { code: "INTERNAL", message: "Something went wrong.", details: {} },
    },
    { status: 500 },
  );
}

export { AppError };
