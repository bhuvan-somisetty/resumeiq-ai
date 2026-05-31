import type { NextRequest } from "next/server";
import { requireUser } from "@/server/auth/current-user";
import { jdRepo } from "@/server/repositories/jd.repo";
import { createJobDescriptionSchema } from "@/lib/validators/resume.schema";
import { created, handleError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = createJobDescriptionSchema.parse(await req.json());
    const jd = await jdRepo.create(user.id, body);
    return created(jd);
  } catch (e) {
    return handleError(e);
  }
}
