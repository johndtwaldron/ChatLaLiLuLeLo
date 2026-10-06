import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { useGoogleProfile } from '../googleProfile';
import { TextDecoder } from 'util';
import { profileFromCredential, sanitizeProfile, saveGoogleProfile, disconnectGoogleProfile, requestGoogleProfilePhoto } from '../googleProfile';

Object.assign(globalThis, { TextDecoder });

const token = (changes: Record<string, unknown> = {}) => {
  const claims = { iss: 'https://accounts.google.com', aud: 'test-client', nonce: 'test-nonce', exp: Date.now() / 1000 + 600, given_name: 'Éadaoin', picture: 'https://lh3.googleusercontent.com/photo', ...changes };
  return `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;
};

describe('cosmetic Google profile', () => {
  it('reads a Unicode first name and photo without retaining the credential', () => {
    expect(profileFromCredential(token(), 'test-client', 'test-nonce')).toEqual({ firstName: 'Éadaoin', picture: 'https://lh3.googleusercontent.com/photo' });
  });
  it('keeps the name when Google supplies no photo', () => {
    expect(profileFromCredential(token({ picture: undefined }), 'test-client', 'test-nonce')).toEqual({ firstName: 'Éadaoin', picture: null });
  });
  it.each([{ aud: 'other-client' }, { nonce: 'other-request' }, { exp: 0 }, { iss: 'https://attacker.example' }, { given_name: '' }])('rejects an unexpected credential: %o', claims => {
    expect(() => profileFromCredential(token(claims), 'test-client', 'test-nonce')).toThrow();
  });
  it.each(['http://lh3.googleusercontent.com/a', 'https://googleusercontent.com.attacker.example/a', 'javascript:alert(1)'])('rejects non-Google photo URLs: %s', picture => {
    expect(sanitizeProfile({ firstName: 'Jack', picture }).picture).toBeNull();
  });
  it('keeps display data in memory without persistent storage', () => {
    saveGoogleProfile({ firstName: 'Jack', picture: null });
    expect(localStorage.getItem('codec.google-profile.v1')).toBeNull();
    disconnectGoogleProfile();
    expect(localStorage.getItem('codec.google-profile.v1')).toBeNull();
  });
});


describe('explicit Google photo request', () => {
  let options: any;
  const requestAccessToken = jest.fn();
  const originalFetch = global.fetch;
  beforeEach(() => {
    options = undefined;
    (window as any).google = { accounts: { oauth2: { initTokenClient: jest.fn(config => { options = config; return { requestAccessToken }; }) } } };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ given_name: 'Jack', picture: 'https://lh3.googleusercontent.com/photo' }) });
    (AbortSignal as any).timeout = jest.fn(() => undefined);
    saveGoogleProfile({ firstName: 'Jack', picture: null });
  });
  afterEach(() => { global.fetch = originalFetch; delete (window as any).google; saveGoogleProfile(null); jest.clearAllMocks(); });
  it('requests only basic profile scopes and discards the access token', async () => {
    const pending = requestGoogleProfilePhoto('client');
    expect(options.scope).toBe('openid profile');
    expect(options.include_granted_scopes).toBe(false);
    const response = { access_token: 'temporary-access' };
    await options.callback(response);
    await pending;
    expect(response.access_token).toBeUndefined();
    expect(fetch).toHaveBeenCalledWith('https://openidconnect.googleapis.com/v1/userinfo', expect.objectContaining({ cache: 'no-store', credentials: 'omit' }));
    expect(localStorage.getItem('codec.google-profile.v1')).toBeNull();
  });
  it('does not relink after disconnect while a request is pending', async () => {
    const pending = requestGoogleProfilePhoto('client');
    disconnectGoogleProfile();
    let current: unknown;
    function Observer() { current = useGoogleProfile(); return null; }
    let view: renderer.ReactTestRenderer;
    act(() => { view = renderer.create(React.createElement(Observer)); });
    await options.callback({ access_token: 'temporary-access' });
    await pending;
    expect(current).toBeNull();
    act(() => view!.unmount());
  });
  it('clears the in-memory photo when the page leaves', () => {
    saveGoogleProfile({ firstName: 'Jack', picture: 'https://lh3.googleusercontent.com/photo' });
    let current: unknown;
    function Observer() { current = useGoogleProfile(); return null; }
    let view: renderer.ReactTestRenderer;
    act(() => { view = renderer.create(React.createElement(Observer)); });
    act(() => { window.dispatchEvent(new Event('pagehide')); });
    expect(current).toBeNull();
    act(() => view!.unmount());
  });
  it('reports a missing photo without logging the returned profile', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ given_name: 'Jack' }) });
    const pending = requestGoogleProfilePhoto('client');
    const assertion = expect(pending).rejects.toThrow('also returned no photo');
    await options.callback({ access_token: 'temporary-access' });
    await assertion;
  });
});
