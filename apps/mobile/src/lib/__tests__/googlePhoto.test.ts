import { largerGooglePhoto } from '../googlePhoto';
import * as photos from '../googlePhoto';
import { saveGoogleProfile, disconnectGoogleProfile, currentChatProfile } from '../googleProfile';

const base = 'https://lh3.googleusercontent.com';
describe('Google photo variants', () => {
  afterEach(() => { disconnectGoogleProfile(); jest.restoreAllMocks(); });
  it.each([
    [`${base}/avatar=s96-c`, `${base}/avatar=s512-c`],
    [`${base}/avatar=s96-c-k-no`, `${base}/avatar=s512-c-k-no`],
    [`${base}/photo.jpg?sz=96`, `${base}/photo.jpg?sz=512`],
    [`${base}/id/s96-c/photo.jpg`, `${base}/id/s512-c/photo.jpg`],
    [`${base}/avatar`, `${base}/avatar=s512`],
  ])('requests server-sized variant without changing photo identity', (source, expected) => {
    expect(largerGooglePhoto(source)).toBe(expected);
  });
  it('rejects foreign hosts', () => { expect(() => largerGooglePhoto('https://attacker.test/photo')).toThrow(); });
  it('uses the verified larger variant for AI and clears it on disconnect', async () => {
    jest.spyOn(photos, 'measureGooglePhoto').mockImplementation(async url => url.includes('s512') ? { width: 512, height: 512 } : { width: 96, height: 96 });
    saveGoogleProfile({ firstName: 'John', picture: `${base}/avatar=s96-c` });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(currentChatProfile()).toEqual({ firstName: 'John', picture: `${base}/avatar=s512-c`, photoDimensions: { width: 512, height: 512 } });
    disconnectGoogleProfile();
    expect(currentChatProfile()).toBeUndefined();
  });
  it('falls back to the thumbnail when Google refuses the larger version', async () => {
    jest.spyOn(photos, 'measureGooglePhoto').mockImplementation(async url => {
      if (url.includes('s512')) throw new Error('unavailable');
      return { width: 96, height: 96 };
    });
    saveGoogleProfile({ firstName: 'John', picture: `${base}/avatar=s96-c` });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(currentChatProfile()?.picture).toBe(`${base}/avatar=s96-c`);
  });
  it('cannot restore a photo when probes finish after disconnect', async () => {
    const finishes: Array<(value: { width: number; height: number }) => void> = [];
    jest.spyOn(photos, 'measureGooglePhoto').mockImplementation(() => new Promise(resolve => { finishes.push(resolve); }));
    saveGoogleProfile({ firstName: 'John', picture: `${base}/avatar=s96-c` });
    disconnectGoogleProfile();
    finishes.forEach(finish => finish({ width: 512, height: 512 }));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(currentChatProfile()).toBeUndefined();
  });
});
