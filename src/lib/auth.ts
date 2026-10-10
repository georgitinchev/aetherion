/** Routes reachable without a session. Everything else requires signing in. */
export const PUBLIC_PATHS = ["/login", "/auth/callback"];

/**
 * Only allow redirects back to same-site paths, so `?next=` can't be abused
 * to bounce users to another origin after login.
 */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}
