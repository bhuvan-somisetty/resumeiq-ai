/**
 * Clerk credential detection for local development.
 *
 * `.env.local` ships *placeholder* Clerk keys so the app can build and boot
 * without a real Clerk project. The placeholder publishable key decodes to the
 * dummy domain `clerk.example.com` — if Clerk is initialized with it, the
 * browser is redirected to `clerk.example.com` and public routes never render.
 *
 * `isClerkConfigured()` returns true only when *real* credentials are present,
 * letting us skip Clerk initialization (provider + middleware + UI controls) in
 * local dev while keeping it fully active in any real environment.
 *
 * Reads only `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, which is inlined at build time
 * and therefore available on the server, the client, and in edge middleware.
 */
export function isClerkConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  if (!key.startsWith("pk_")) return false;

  try {
    // pk_(test|live)_<base64("<frontend-api-domain>$")>
    const encoded = key.split("_").slice(2).join("_");
    const decoded = atob(encoded);
    const domain = decoded.replace(/\$+$/, "");
    return domain.length > 0 && domain !== "clerk.example.com";
  } catch {
    return false;
  }
}
