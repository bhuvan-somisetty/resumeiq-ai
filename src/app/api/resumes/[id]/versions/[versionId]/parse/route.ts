import { requireUser } from "@/server/auth/current-user";
import { resumeService } from "@/server/services/resume.service";
import { ok, handleError } from "@/lib/api";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  try {
    const { versionId } = await params;
    const user = await requireUser();
    const result = await resumeService.parseVersion(versionId, user.id);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
