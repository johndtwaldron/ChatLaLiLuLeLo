import { useSyncExternalStore } from 'react';

export interface CodecProfile { firstName: string; picture: string | null }
const STORAGE_KEY = 'codec.google-profile.v1';
let profile: CodecProfile | null = null;
let loaded = false;
const listeners = new Set<() => void>();

export function sanitizeProfile(value: unknown): CodecProfile {
  const data = value as Partial<CodecProfile> | null;
  if (!data || typeof data.firstName !== 'string' || !data.firstName.trim()) {
    throw new Error('Google did not provide a first name.');
  }
  let picture: string | null = null;
  if (typeof data.picture === 'string') {
    try {
      const url = new URL(data.picture);
      if (url.protocol === 'https:' && (url.hostname === 'googleusercontent.com' || url.hostname.endsWith('.googleusercontent.com'))) picture = url.href;
    } catch { /* A missing or invalid photo uses the silhouette. */ }
  }
  return { firstName: data.firstName.trim().slice(0, 40), picture };
}

// This profile is cosmetic only. It never authorizes backend requests.
export function profileFromCredential(credential: string, clientId: string, nonce: string): CodecProfile {
  try {
    const segment = credential.split('.')[1];
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')), c => c.charCodeAt(0));
    const claims = JSON.parse(new TextDecoder().decode(bytes));
    if (!['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss) ||
        claims.aud !== clientId || claims.nonce !== nonce ||
        typeof claims.exp !== 'number' || claims.exp <= Date.now() / 1000) {
      throw new Error('Unexpected credential');
    }
    return sanitizeProfile({ firstName: claims.given_name, picture: claims.picture });
  } catch { throw new Error('Could not read your Google profile. Please try again.'); }
}

// Display data lives only in memory for the current page/app instance.
// Remove the previous persistent implementation's data without reading it.
function getSnapshot(): CodecProfile | null {
  if (!loaded && typeof window !== 'undefined') {
    loaded = true;
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* Storage may be blocked. */ }
  }
  return profile;
}

export function saveGoogleProfile(next: CodecProfile | null): void {
  profile = next ? sanitizeProfile(next) : null;
  getSnapshot();
  listeners.forEach(fn => fn());
}

export function useGoogleProfile(): CodecProfile | null {
  return useSyncExternalStore(fn => {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, getSnapshot, () => null);
}

export interface GoogleIdentity {
  initialize(options: { client_id: string; nonce: string; auto_select: boolean; callback: (response: { credential: string }) => void }): void;
  renderButton(element: HTMLElement, options: { theme: string; size: string; text: string }): void;
  cancel(): void;
  disableAutoSelect(): void;
}
type GoogleWindow = Window & { google?: { accounts?: { id?: GoogleIdentity } } };
let loading: Promise<GoogleIdentity> | null = null;

export function loadGoogleIdentity(): Promise<GoogleIdentity> {
  const existing = (window as GoogleWindow).google?.accounts?.id;
  if (existing) return Promise.resolve(existing);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    const timeout = setTimeout(() => fail(), 15000);
    const fail = () => {
      clearTimeout(timeout);
      script.remove();
      loading = null;
      reject(new Error('Google sign-in could not load. Check your connection and try again.'));
    };
    script.onerror = fail;
    script.onload = () => {
      clearTimeout(timeout);
      const identity = (window as GoogleWindow).google?.accounts?.id;
      if (identity) resolve(identity);
      else fail();
    };
    document.head.appendChild(script);
  });
  return loading;
}

export function disconnectGoogleProfile(): void {
  (window as GoogleWindow).google?.accounts?.id?.disableAutoSelect();
  saveGoogleProfile(null);
}
