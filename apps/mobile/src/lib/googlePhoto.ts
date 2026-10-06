import { getApiUrl } from './api';
// Google-hosted photos can expose multiple server-rendered sizes of the same original.
export function largerGooglePhoto(source: string, size = 512): string {
  const url = new URL(source);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.googleusercontent.com') || url.username || url.password) throw new Error('Invalid Google photo URL');
  if (url.searchParams.has('sz')) {
    url.searchParams.set('sz', String(size));
  } else if (/\/(?:s|w|h)\d+(?:-[^/]+)?\//.test(url.pathname)) {
    url.pathname = url.pathname.replace(/\/(?:s|w|h)\d+(?:-[^/]+)?\//, `/s${size}-c/`);
  } else {
    // Preserve Google's crop/other flags when replacing the existing size suffix.
    url.pathname = /=(?:s|w|h)\d+(?:-[^/]*)?$/.test(url.pathname)
      ? url.pathname.replace(/=(?:s|w|h)\d+((?:-[^/]*)?)$/, `=s${size}$1`)
      : `${url.pathname}=s${size}`;
  }
  return url.href;
}

export async function measureGooglePhoto(url: string, signal: AbortSignal): Promise<{ width: number; height: number }> {
  // Fetch without cookies or persistent caching. Only dimensions survive this probe.
  const response = await fetch(`${getApiUrl()}/profile-photo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ picture: url }), cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', signal });
  if (!response.ok) throw new Error('Photo unavailable');
  const blob = await response.blob();
  if (blob.size > 8 * 1024 * 1024) throw new Error('Photo too large');
  if (signal.aborted) throw new Error('Photo request cancelled');
  const objectUrl = URL.createObjectURL(blob);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      const cleanup = () => { image.onload = null; image.onerror = null; image.src = ''; signal.removeEventListener('abort', cancel); };
      const cancel = () => { cleanup(); reject(new Error('Photo request cancelled')); };
      image.onload = () => { const dimensions = { width: image.naturalWidth, height: image.naturalHeight }; cleanup(); resolve(dimensions); };
      image.onerror = () => { cleanup(); reject(new Error('Photo could not be decoded')); };
      signal.addEventListener('abort', cancel, { once: true });
      if (signal.aborted) { cancel(); return; }
      image.src = objectUrl;
    });
  } finally { URL.revokeObjectURL(objectUrl); }
}
