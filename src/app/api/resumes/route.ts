import type { NextRequest } from "next/server";
import { requireUser } from "@/server/auth/current-user";
import { resumeService } from "@/server/services/resume.service";
import { createResumeSchema } from "@/lib/validators/resume.schema";
import { ok, created, handleError } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const resumes = await resumeService.list(user.id);
    return ok(resumes);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = createResumeSchema.parse(await req.json());
    const resume = await resumeService.create(user.id, body.title);
    return created(resume);
  } catch (e) {
    return handleError(e);
  }
}
