/**
 * Resolve an API endpoint path.
 * All API calls use the same origin (via Replit's path-based proxy),
 * so this is simply an identity function for the path.
 * Kept as a utility so it can be adapted if the base URL changes.
 */
export function apiUrl(path: string): string {
  return path;
}
