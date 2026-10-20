import { Capacitor } from '@capacitor/core';

// HARDCODED BACKEND URL - Change this to your PC's IP address
export const HARDCODED_BACKEND_URL = 'http://localhost:3000';

export const DEFAULT_LAN_IP = '192.168.18.174:3000';

// All candidate backend hosts to try, in priority order
const CANDIDATE_HOSTS = [
  HARDCODED_BACKEND_URL,       // ALWAYS TRY THIS FIRST
  'http://localhost:3000',      // Works via USB ADB reverse (adb reverse tcp:3000 tcp:3000)
  'http://10.0.2.2:3000',      // Android emulator alias for host loopback
  `http://${DEFAULT_LAN_IP}`,  // Wi-Fi LAN IP of the PC (same network)
];

const SESSION_HOST_KEY = 'cognilearn_working_host';
const MANUAL_HOST_KEY = 'cognilearn_backend_url';

export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  if (Capacitor.isNativePlatform()) {
    // ALWAYS USE HARDCODED URL ON MOBILE
    return `${HARDCODED_BACKEND_URL}${cleanEndpoint}`;
  }
  return cleanEndpoint;
};

/**
 * HARDCODED API fetch - Always uses the hardcoded backend URL on mobile
 */
export const safeApiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;

  // On web/dev server, use relative URL directly
  if (!Capacitor.isNativePlatform()) {
    return fetch(cleanEndpoint, options);
  }

  // MOBILE: ALWAYS USE HARDCODED URL
  const url = `${HARDCODED_BACKEND_URL}${cleanEndpoint}`;
  console.log(`[API] Fetching from hardcoded URL: ${url}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30 seconds for AI requests
    
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    console.log(`[API] Response received - Status: ${res.status}`);
    
    return res;
  } catch (error: any) {
    console.error(`[API] Failed to connect to ${url}:`, error.message);
    
    // Better error messages
    let errorMessage = 'Cannot connect to backend server. ';
    
    if (error.name === 'AbortError') {
      errorMessage += 'Request timeout after 30 seconds. The AI is taking longer than expected.';
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage += `Make sure:\n` +
        `1. Server is running (npm run dev)\n` +
        `2. USB debugging is enabled\n` +
        `3. Run: adb reverse tcp:3000 tcp:3000\n` +
        `4. Or connect to same Wi-Fi network`;
    } else {
      errorMessage += error.message;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Test the hardcoded backend URL
 */
export const detectWorkingHost = async (): Promise<string | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${HARDCODED_BACKEND_URL}/api/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      console.log(`[API] Backend is reachable at: ${HARDCODED_BACKEND_URL}`);
      return HARDCODED_BACKEND_URL;
    }
  } catch (error: any) {
    console.error(`[API] Backend not reachable:`, error.message);
  }
  return null;
};
