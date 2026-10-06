import { TextDecoder } from 'util';
import { profileFromCredential, sanitizeProfile, saveGoogleProfile, disconnectGoogleProfile } from '../googleProfile';

Object.assign(globalThis, { TextDecoder });

const token = (changes: Record<string, unknown> = {}) => {
  const claims = { iss: 'https://accounts.google.com', aud: 'test-client', nonce: 'test-nonce', exp: Date.now() / 1000 + 600, given_name: 'Éadaoin', picture: 'https://lh3.googleusercontent.com/photo', ...changes };
  return `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;
};

describe('cosmetic Google profile', () => {
  it('reads a Unicode first name and photo without retaining the credential', () => {
    expect(profileFromCredential(token(), 'test-client', 'test-nonce')).toEqual({ firstName: 'Éadaoin', picture: 'https://lh3.googleusercontent.com/photo' });
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
