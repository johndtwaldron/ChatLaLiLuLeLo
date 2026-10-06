import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Platform, Pressable } from 'react-native';

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
  Pressable: 'Pressable', Text: 'Text', View: 'View', Modal: 'Modal',
  StyleSheet: { create: (styles: unknown) => styles },
}));
import { TextDecoder } from 'util';
import { GoogleProfileLink } from '../components/GoogleProfileLink';
import { loadGoogleIdentity, requestGoogleProfilePhoto, saveGoogleProfile } from '../lib/googleProfile';

Object.assign(globalThis, { TextDecoder });
jest.mock('../lib/theme', () => ({
  getCodecTheme: () => ({ colors: { primary: '#00ffff', background: '#000000' } }),
  subscribeToThemeChanges: () => () => {},
}));
jest.mock('../lib/googleProfile', () => ({
  ...jest.requireActual('../lib/googleProfile'),
  loadGoogleIdentity: jest.fn(),
  requestGoogleProfilePhoto: jest.fn(),
}));

describe('Google linking dialog', () => {
  const originalPlatform = Platform.OS;
  let view: renderer.ReactTestRenderer;
  beforeEach(() => {
    Platform.OS = 'web';
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID = 'test-client';
    saveGoogleProfile(null);
  });
  afterEach(() => {
    act(() => view?.unmount());
    Platform.OS = originalPlatform;
    delete process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    jest.clearAllMocks();
  });
  const open = async () => {
    await act(async () => {
      view = renderer.create(<GoogleProfileLink />, { createNodeMock: e => e.type === 'div' ? { replaceChildren: jest.fn() } : null });
    });
    await act(async () => { view.root.findAllByType(Pressable)[0].props.onPress(); });
  };
  it('completes a mocked Google callback, then disconnects', async () => {
    const identity = { initialize: jest.fn(), renderButton: jest.fn() };
    (loadGoogleIdentity as jest.Mock).mockResolvedValue(identity);
    await open();
    expect(identity.renderButton).toHaveBeenCalled();
    const options = identity.initialize.mock.calls[0][0];
    const claims = { iss: 'https://accounts.google.com', aud: 'test-client', nonce: options.nonce, exp: Date.now() / 1000 + 60, given_name: 'Jack', picture: 'https://lh3.googleusercontent.com/photo' };
    const credential = `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;
    await act(async () => { options.callback({ credential }); });
    expect(localStorage.getItem('codec.google-profile.v1')).toBeNull();
    expect(JSON.stringify(view.toJSON())).toContain('GOOGLE NANOMACHINES: LINKED');
    await act(async () => { view.root.findAllByType(Pressable)[0].props.onPress(); });
    const disconnect = view.root.findAllByType(Pressable).find(p => p.props.children?.props?.children === 'DISCONNECT GOOGLE')!;
    await act(async () => { disconnect.props.onPress(); });
    expect(localStorage.getItem('codec.google-profile.v1')).toBeNull();
  });
  it('offers explicit photo access for a linked profile without a photo', async () => {
    saveGoogleProfile({ firstName: 'Jack', picture: null });
    (requestGoogleProfilePhoto as jest.Mock).mockResolvedValue(undefined);
    await open();
    expect(JSON.stringify(view.toJSON())).toContain('Google may remember your consent');
    const fetchPhoto = view.root.findAllByType(Pressable).find(p => p.props.children?.props?.children === 'FETCH GOOGLE PROFILE PHOTO')!;
    await act(async () => { fetchPhoto.props.onPress(); });
    expect(requestGoogleProfilePhoto).toHaveBeenCalledWith('test-client');
  });
  it('shows missing configuration without loading Google', async () => {
    delete process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    await open();
    expect(JSON.stringify(view.toJSON())).toContain('Google linking needs an app client ID');
    expect(loadGoogleIdentity).not.toHaveBeenCalled();
  });
  it('keeps the dialog usable when the SDK fails', async () => {
    (loadGoogleIdentity as jest.Mock).mockRejectedValue(new Error('Connection failed'));
    await open();
    expect(JSON.stringify(view.toJSON())).toContain('Connection failed');
    expect(JSON.stringify(view.toJSON())).toContain('TRY AGAIN');
  });
});
