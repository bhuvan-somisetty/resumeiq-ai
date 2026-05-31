import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { userRepo } from "@/server/repositories/user.repo";
import { logger } from "@/lib/logger";

/**
 * Clerk → app user sync. Source of truth for provisioning/deprovisioning users.
 * Verified via Svix signature (CLERK_WEBHOOK_SECRET).
 */
export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    logger.warn("Clerk webhook verification failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    if (evt.type === "user.created" || evt.type === "user.updated") {
      const d = evt.data as {
        id: string;
        email_addresses?: { id: string; email_address: string }[];
        primary_email_address_id?: string | null;
        first_name?: string | null;
        last_name?: string | null;
        image_url?: string | null;
      };
      const emails = d.email_addresses ?? [];
      const email =
        emails.find((e) => e.id === d.primary_email_address_id)
          ?.email_address ??
        emails[0]?.email_address ??
        `${d.id}@placeholder.local`;
      await userRepo.upsertFromClerk({
        clerkId: d.id,
        email,
        name: [d.first_name, d.last_name].filter(Boolean).join(" ") || null,
        imageUrl: d.image_url ?? null,
      });
    } else if (evt.type === "user.deleted") {
      const id = (evt.data as { id?: string }).id;
      if (id) {
        await userRepo.deleteByClerkId(id).catch(() => {
          /* already gone */
        });
      }
    }
    return new Response("ok", { status: 200 });
  } catch (err) {
    logger.error("Clerk webhook handler error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return new Response("error", { status: 500 });
  }
}
