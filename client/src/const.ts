export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Generate login URL for Google OAuth.
 * Redirects to our backend which initiates the Google OAuth flow.
 */
export const getLoginUrl = (returnPath?: string) => {
  const path = returnPath || "/";
  const origin = window.location.origin;
  return `/api/oauth/google?returnPath=${encodeURIComponent(path)}&origin=${encodeURIComponent(origin)}`;
};
