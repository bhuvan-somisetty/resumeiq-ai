import { requireUser } from "@/server/auth/current-user";
import { usageService } from "@/server/services/usage.service";
import { ok, handleError } from "@/lib/api";
import { PLANS } from "@/lib/constants";

export async function GET() {
  try {
    const user = await requireUser();
    const usage = await usageService.getUsage(user.id, user.plan);
    return ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        imageUrl: user.imageUrl,
        plan: user.plan,
      },
      plan: PLANS[user.plan],
      usage,
    });
  } catch (e) {
    return handleError(e);
  }
}
