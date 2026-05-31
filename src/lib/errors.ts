/**
 * Centralized error catalog + AppError. Mirrors the stable error codes in
 * /docs/04-API-Design.md §4.2 so the client can switch on `code`.
 */

export const ERROR_CODES = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  QUOTA_EXCEEDED: 403,
  VALIDATION_ERROR: 400,
  RESUME_TOO_LARGE: 413,
  UNSUPPORTED_FILE_TYPE: 400,
  PARSE_FAILED: 422,
  ANALYSIS_FAILED: 422,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  BILLING_ERROR: 402,
  INTERNAL: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = ERROR_CODES[code];
    this.details = details;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details ?? {},
      },
    };
  }
}

export const isAppError = (e: unknown): e is AppError => e instanceof AppError;
