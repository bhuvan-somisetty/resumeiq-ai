import { Inngest } from "inngest";

/**
 * Inngest client. Background-job orchestration for future async pipelines
 * (see /docs/02-System-Architecture.md §2.4). The MVP runs analysis
 * synchronously; this is wired and ready for the durable pipeline migration.
 */
export const inngest = new Inngest({ id: "resumeiq-ai" });

/** Typed event catalog. */
export type Events = {
  "analysis/requested": {
    data: { analysisId: string; userId: string };
  };
};
