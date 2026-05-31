import type { NextRequest } from "next/server";
import { requireUser } from "@/server/auth/current-user";
import { analysisService } from "@/server/services/analysis.service";
import { createAnalysisSchema } from "@/lib/validators/resume.schema";
import { ok, handleError } from "@/lib/api";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const input = createAnalysisSchema.parse(await req.json());
    const result = await analysisService.run(user, input);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
