import { Capacitor } from '@capacitor/core';

/* ------------------------------------------------------------------ *
 * HARDCODED BACKEND CONFIGURATION
 *
 * The mobile build talks to the PC that runs the CogniLearn server.
 * The address below is baked into the app so the phone never needs
 * manual configuration - it simply tries the hardcoded host first and
 * falls back to the other known routes automatically.
 * ------------------------------------------------------------------ */

// PC address on the current Wi-Fi network (same router as the phone).
export const HARDCODED_BACKEND_URL = 'http://192.168.54.240:3000';
export const DEFAULT_LAN_IP = '192.168.54.240:3000';

// Tried in order when the hardcoded host cannot be reached.
const FALLBACK_HOSTS = [
  'http://localhost:3000', // USB debugging + `adb reverse tcp:3000 tcp:3000`
  'http://10.0.2.2:3000', // Android emulator alias for the host loopback
  'http://192.168.18.174:3000', // previous Wi-Fi network, kept as a safety net
];

const STORAGE_WORKING_HOST = 'cognilearn_working_host';
const STORAGE_MANUAL_HOST = 'cognilearn_backend_url';

const HEALTH_TIMEOUT_MS = 4000;
const REQUEST_TIMEOUT_MS = 60000;

/** Thrown when no backend host could be reached at all. */
export class BackendUnavailableError extends Error {
  code = 'BACKEND_UNAVAILABLE';
  constructor(message: string) {
    super(message);
    this.name = 'BackendUnavailableError';
  }
}

/* ----------------------------- storage ----------------------------- */

const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode) - ignore */
  }
};

const removeStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};

/* ------------------------------ helpers ---------------------------- */

/** Turns user input such as "192.168.1.5:3000" into a clean base URL. */
export const normalizeBaseUrl = (raw: string): string | null => {
  const trimmed = (raw || '').trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  try {
    const url = new URL(withScheme);
    return url.origin.replace(/\/+$/, '');
  } catch {
    return null;
  }
};

/** Every host the app is allowed to try, most preferred first. */
export const getCandidateHosts = (): string[] => {
  const manual = normalizeBaseUrl(readStorage(STORAGE_MANUAL_HOST) || '');
  const hosts = [manual, HARDCODED_BACKEND_URL, ...FALLBACK_HOSTS].filter(
    (h): h is string => Boolean(h)
  );
  return Array.from(new Set(hosts));
};

/** The host the app is currently talking to (cached, may be stale). */
export const getActiveBackendUrl = (): string =>
  readStorage(STORAGE_WORKING_HOST) || HARDCODED_BACKEND_URL;

/** Store a manual override (empty string clears it). */
export const setManualBackendUrl = (raw: string): string | null => {
  const normalized = normalizeBaseUrl(raw);
  if (normalized) {
    writeStorage(STORAGE_MANUAL_HOST, normalized);
  } else {
    removeStorage(STORAGE_MANUAL_HOST);
  }
  // Force a fresh probe so the new address takes effect immediately.
  removeStorage(STORAGE_WORKING_HOST);
  return normalized;
};

/** Remove the manual override and the cached host. */
export const clearManualBackendUrl = (): void => {
  removeStorage(STORAGE_MANUAL_HOST);
  removeStorage(STORAGE_WORKING_HOST);
};

/** GET /api/health on a candidate host. Resolves true when the server answers. */
const probeHost = async (base: string, timeoutMs = HEALTH_TIMEOUT_MS): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${base}/api/health`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);
    if (!res.ok) return false;
    const data = await res.json().catch(() => null);
    return !data || data.status === 'ok';
  } catch {
    return false;
  }
};

let inflightResolution: Promise<string | null> | null = null;

/**
 * Finds a reachable backend host.
 * - Web / PWA: same origin as the app, so no host is needed (empty string).
 * - Native (APK): probes the hardcoded host plus every fallback and caches
 *   the winner, so later requests go straight to the working address.
 */
export const resolveBackendUrl = async (
  options: { force?: boolean } = {}
): Promise<string | null> => {
  if (!Capacitor.isNativePlatform()) return '';

  if (!options.force) {
    const cached = readStorage(STORAGE_WORKING_HOST);
    if (cached) return cached;
    if (inflightResolution) return inflightResolution;
  }

  inflightResolution = (async () => {
    const candidates = getCandidateHosts();
    const results = await Promise.all(candidates.map((host) => probeHost(host)));
    const index = results.findIndex(Boolean);
    if (index === -1) {
      removeStorage(STORAGE_WORKING_HOST);
      return null;
    }
    const winner = candidates[index];
    writeStorage(STORAGE_WORKING_HOST, winner);
    return winner;
  })();

  try {
    return await inflightResolution;
  } finally {
    inflightResolution = null;
  }
};

/**
 * Probes every known host and returns the first one that answers.
 * Used by the connection banner and the settings screen.
 */
export const detectWorkingHost = async (): Promise<string | null> => {
  if (!Capacitor.isNativePlatform()) {
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      if (res.ok) return window.location.origin;
    } catch {
      /* ignore */
    }
    return null;
  }

  const candidates = getCandidateHosts();
  const results = await Promise.all(candidates.map((host) => probeHost(host)));
  const index = results.findIndex(Boolean);
  if (index === -1) {
    removeStorage(STORAGE_WORKING_HOST);
    return null;
  }
  const winner = candidates[index];
  writeStorage(STORAGE_WORKING_HOST, winner);
  return winner;
};

/** Absolute URL for an endpoint on the native build, relative on the web. */
export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  if (Capacitor.isNativePlatform()) {
    return `${getActiveBackendUrl()}${cleanEndpoint}`;
  }
  return cleanEndpoint;
};

const buildUnreachableMessage = (): string =>
  `Cannot reach the CogniLearn backend (tried: ${getCandidateHosts().join(', ')}). ` +
  'Start the server with "npm run dev" on your PC and keep the phone on the same Wi-Fi network.';

/**
 * Fetch helper used by every AI feature.
 * - Web / PWA: relative URL, same origin - always works.
 * - Native: resolves the hardcoded host automatically, re-probes once when
 *   the cached address stops working, and throws BackendUnavailableError
 *   when no host can be reached so callers can fall back to on-device mode.
 */
export const safeApiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;

  if (!Capacitor.isNativePlatform()) {
    return fetch(cleanEndpoint, options);
  }

  const attempt = async (base: string): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await fetch(`${base}${cleanEndpoint}`, {
        ...options,
        signal: options.signal ?? controller.signal,
        headers: {
          ...(options.headers as Record<string, string> | undefined),
          'Content-Type': 'application/json',
        },
      });
    } finally {
      clearTimeout(timer);
    }
  };

  let base = await resolveBackendUrl();
  if (!base) {
    // The cached address may be stale (e.g. the PC changed Wi-Fi networks).
    base = await resolveBackendUrl({ force: true });
  }

  if (!base) {
    throw new BackendUnavailableError(buildUnreachableMessage());
  }

  try {
    return await attempt(base);
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Request timed out after 60 seconds. The AI is taking longer than expected.');
    }

    // Network level failure - the host may have changed, so re-probe and retry.
    removeStorage(STORAGE_WORKING_HOST);
    const retryBase = await resolveBackendUrl({ force: true });
    if (retryBase && retryBase !== base) {
      try {
        return await attempt(retryBase);
      } catch {
        /* fall through to the friendly error */
      }
    }

    throw new BackendUnavailableError(buildUnreachableMessage());
  }
};
