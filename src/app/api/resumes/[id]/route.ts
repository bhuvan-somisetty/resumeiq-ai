import { requireUser } from "@/server/auth/current-user";
import { resumeService } from "@/server/services/resume.service";
import { ok, handleError } from "@/lib/api";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const result = await resumeService.delete(id, user.id);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
