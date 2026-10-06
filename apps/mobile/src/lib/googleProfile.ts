import { recordSessionLog } from './sessionLogs';
import { useSyncExternalStore } from 'react';

export interface CodecProfile { firstName: string; picture: string | null }
const STORAGE_KEY = 'codec.google-profile.v1';
let profile: CodecProfile | null = null;
let loaded = false;
let profileRevision = 0;
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
  recordSessionLog('info', '[GOOGLE PROFILE]', { photoProvided: typeof data.picture === 'string', photoAccepted: !!picture });
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
  profileRevision++;
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


interface GoogleOAuth {
  initTokenClient(options: {
    client_id: string; scope: string; include_granted_scopes: boolean;
    callback: (response: { access_token?: string; error?: string }) => void;
    error_callback: () => void;
  }): { requestAccessToken(options: { prompt: string }): void };
}

// Trigger directly from a click, so Brave can open Google's consent popup.
// Tokens stay inside this request and are never saved or logged.
export function requestGoogleProfilePhoto(clientId: string): Promise<void> {
  const oauth = (window as Window & { google?: { accounts?: { oauth2?: GoogleOAuth } } }).google?.accounts?.oauth2;
  if (!oauth) return Promise.reject(new Error('Google profile access is not ready. Close and reopen the linking panel.'));
  recordSessionLog('info', '[GOOGLE PHOTO REQUEST]', { origin: window.location.origin });
  const revision = profileRevision;
  return new Promise((resolve, reject) => {
    const client = oauth.initTokenClient({
      client_id: clientId,
      scope: 'openid profile',
      include_granted_scopes: false,
      error_callback: () => {
        recordSessionLog('warn', '[GOOGLE PHOTO REQUEST] Popup closed or blocked');
        reject(new Error('Google profile popup was closed or blocked. Please try again.'));
      },
      callback: async response => {
        let accessToken = response.access_token;
        if (response.error || !accessToken) {
          recordSessionLog('warn', '[GOOGLE PHOTO REQUEST] Permission not granted');
          reject(new Error('Google profile permission was not granted.'));
          return;
        }
        try {
          const result = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer',
            signal: AbortSignal.timeout(15000),
          });
          if (!result.ok) throw new Error('Google profile request failed. Please try again.');
          const data = await result.json();
          const next = sanitizeProfile({ firstName: data.given_name, picture: data.picture });
          // A late response must not restore a disconnected or replaced profile.
          if (revision !== profileRevision) { resolve(); return; }
          if (!next.picture) throw new Error('Google’s profile endpoint also returned no photo. Your current link is unchanged.');
          saveGoogleProfile(next);
          resolve();
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Could not fetch your Google profile photo.'));
        } finally {
          accessToken = undefined;
          response.access_token = undefined;
        }
      },
    });
    client.requestAccessToken({ prompt: 'consent' });
  });
}

// Also clear profiles when a page enters the browser's back/forward cache.
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => saveGoogleProfile(null));
}
