import { inngest } from "@/inngest/client";

/**
 * Placeholder durable function. The analysis pipeline currently runs
 * synchronously in AnalysisService; this scaffolds the async path so the
 * Inngest serve endpoint is valid and ready to host the real pipeline.
 */
export const analysisRequested = inngest.createFunction(
  { id: "analysis-requested" },
  { event: "analysis/requested" },
  async ({ event, step }) => {
    await step.run("acknowledge", async () => ({
      received: event.data.analysisId,
    }));
    return { ok: true };
  },
);

export const functions = [analysisRequested];
