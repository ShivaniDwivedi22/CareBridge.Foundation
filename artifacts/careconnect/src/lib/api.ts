/**
 * Resolve an API endpoint path with proper base URL handling for Vercel.
 */
export function apiUrl(path: string): string {
  // In production, use the API_URL environment variable
  const base = import.meta.env.VITE_API_URL;
  if (base) {
    return `${base.replace(/\/$/, '')}${path}`;
  }
  
  // Fallback for development or same-origin setup
  return path;
}

