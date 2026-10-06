import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Pressable } from 'react-native';

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
  Pressable: 'Pressable', Text: 'Text', View: 'View', Modal: 'Modal',
  StyleSheet: { create: (styles: unknown) => styles },
}));
import { GoogleProfileLink } from '../components/GoogleProfileLink';
import { loadGoogleIdentity, requestGoogleProfilePhoto, saveGoogleProfile } from '../lib/googleProfile';
jest.mock('../lib/theme', () => ({
  getCodecTheme: () => ({ colors: { primary: '#00ffff', background: '#000000' } }),
  subscribeToThemeChanges: () => () => {},
}));
jest.mock('../lib/googleProfile', () => ({
  ...jest.requireActual('../lib/googleProfile'),
  loadGoogleIdentity: jest.fn(), requestGoogleProfilePhoto: jest.fn(),
}));

describe('single Google sync flow', () => {
  let view: renderer.ReactTestRenderer;
  beforeEach(() => {
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID = 'test-client';
    saveGoogleProfile(null);
    (loadGoogleIdentity as jest.Mock).mockResolvedValue({});
  });
  afterEach(() => { act(() => view?.unmount()); delete process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID; jest.clearAllMocks(); });
  const render = async (props = {}) => { await act(async () => { view = renderer.create(<GoogleProfileLink {...props} />); }); };
  const press = async (label: string) => { await act(async () => {
    view.root.findAllByType(Pressable).find(p => p.props.children?.props?.children === label)!.props.onPress();
  }); };
  it('opens activation choice immediately and completes one Google request', async () => {
    const onComplete = jest.fn();
    (requestGoogleProfilePhoto as jest.Mock).mockImplementation(async () => saveGoogleProfile({ firstName: 'Jack', picture: 'https://lh3.googleusercontent.com/photo' }));
    await render({ activation: true, onComplete });
    expect(view.root.findByType('Modal').props.visible).toBe(true);
    expect(JSON.stringify(view.toJSON())).not.toContain('FETCH GOOGLE PROFILE PHOTO');
    await press('SYNC WITH GOOGLE');
    expect(requestGoogleProfilePhoto).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
  it('lets users activate without contacting Google for profile access', async () => {
    const onComplete = jest.fn();
    await render({ activation: true, onComplete });
    await press('ACTIVATE CODEC WITHOUT SYNC');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(requestGoogleProfilePhoto).not.toHaveBeenCalled();
  });
  it('has one ongoing sync control and can disconnect then reconnect', async () => {
    saveGoogleProfile({ firstName: 'Jack', picture: null });
    await render();
    await press('NANOMACHINE SYNC');
    await press('DISCONNECT GOOGLE');
    expect(JSON.stringify(view.toJSON())).toContain('SYNC WITH GOOGLE');
    expect(JSON.stringify(view.toJSON())).not.toContain('Synced as Jack');
  });
  it('does not dismiss activation when Google access fails', async () => {
    const onComplete = jest.fn();
    (requestGoogleProfilePhoto as jest.Mock).mockRejectedValue(new Error('Permission denied'));
    await render({ activation: true, onComplete });
    await press('SYNC WITH GOOGLE');
    expect(JSON.stringify(view.toJSON())).toContain('Permission denied');
    expect(onComplete).not.toHaveBeenCalled();
  });
});
