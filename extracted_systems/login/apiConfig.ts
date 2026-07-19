import { projectId, publicAnonKey } from './supabase/info';

/**
 * Centralized server API configuration.
 *
 * Override with Vite environment variables when needed:
 *   VITE_SERVER_ORIGIN      – scheme + host up to (but not including) the function path.
 *                             Defaults to the project's Supabase Functions endpoint.
 *   VITE_SERVER_BASE_PATH   – path prefix that the edge-function router expects.
 *                             Defaults to '/make-server-e46cd33a'.
 */
const SERVER_ORIGIN: string =
  (import.meta.env.VITE_SERVER_ORIGIN as string | undefined) ??
  `https://${projectId}.supabase.co/functions/v1`;

export const SERVER_BASE_PATH: string =
  (import.meta.env.VITE_SERVER_BASE_PATH as string | undefined) ??
  '/make-server-e46cd33a';

/**
 * Full base URL for the edge function, e.g.
 *   https://xmdfbjfmiavuxlpzawan.supabase.co/functions/v1/make-server-e46cd33a
 */
export const SERVER_BASE_URL = `${SERVER_ORIGIN}${SERVER_BASE_PATH}`;

/** Authorization headers required by the Supabase edge function. */
export const getServerHeaders = (): Record<string, string> => ({
  Authorization: `Bearer ${publicAnonKey}`,
});

/** Convenience helper used by fetch utilities in App.tsx. */
export const getServerRequestContext = () => ({
  headers: getServerHeaders(),
  baseUrl: SERVER_BASE_URL,
});
