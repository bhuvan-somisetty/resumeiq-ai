import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/auth/current-user";
import { db } from "@/server/db";
import { ok, handleError, AppError } from "@/lib/api";

const schema = z.object({ helpful: z.boolean() });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const { helpful } = schema.parse(await req.json());

    // Ownership: suggestion belongs to an analysis owned by this user.
    const suggestion = await db.suggestion.findFirst({
      where: { id, analysis: { userId: user.id } },
      select: { id: true },
    });
    if (!suggestion) throw new AppError("NOT_FOUND", "Suggestion not found.");

    await db.suggestion.update({ where: { id }, data: { helpful } });
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
