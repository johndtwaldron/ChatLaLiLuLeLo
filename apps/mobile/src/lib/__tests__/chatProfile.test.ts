import { streamReply } from '../api';
import { currentChatProfile, saveGoogleProfile, disconnectGoogleProfile } from '../googleProfile';
import { ChatRequestSchema } from '../../../../edge/lib/schema';
import { streamChat } from '../../../../edge/lib/openai';
jest.mock('openai', () => jest.fn(), { virtual: true });

describe('session profile for chat', () => {
  afterEach(() => disconnectGoogleProfile());
  it('shares name, but attaches photo only for a photo reference', () => {
    saveGoogleProfile({ firstName: 'John', picture: 'https://lh3.googleusercontent.com/photo' });
    expect(currentChatProfile('Hello')).toEqual({ firstName: 'John' });
    expect(currentChatProfile('What do you see in my profile picture?')?.picture).toBeTruthy();
    disconnectGoogleProfile();
    expect(currentChatProfile('my pfp')).toBeUndefined();
  });
  it.each(['http://lh3.googleusercontent.com/photo', 'https://localhost/photo', 'https://googleusercontent.com.attacker.test/photo'])('rejects unsafe backend image URL: %s', picture => {
    expect(ChatRequestSchema.safeParse({ mode: 'JD', profile: { firstName: 'John', picture } }).success).toBe(false);
  });
  it('sends vision content on the latest user turn with completion storage disabled', async () => {
    const create = jest.fn().mockResolvedValue({});
    await streamChat({ openai: { chat: { completions: { create } } } as any, systemPrompt: 'Codec', mode: 'JD',
      messages: [{ role: 'user', content: 'hello' }, { role: 'assistant', content: 'hi' }, { role: 'user', content: 'my pfp?' }],
      profile: { firstName: 'John', picture: 'https://lh3.googleusercontent.com/photo' } });
    const payload = create.mock.calls[0][0];
    expect(payload.store).toBe(false);
    expect(payload.messages[1].content).toBe('hello');
    expect(payload.messages[3].content).toEqual([{ type: 'text', text: 'my pfp?' }, { type: 'image_url', image_url: { url: 'https://lh3.googleusercontent.com/photo', detail: 'low' } }]);
    expect(JSON.stringify(payload.messages[4])).toContain('John');
  });
});


describe('profile deployment compatibility', () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; });
  it('never posts a profile to an older backend', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok' }) });
    await expect(streamReply({ mode: 'JD', profile: { firstName: 'John' } }, () => {})).rejects.toThrow('temporarily unavailable');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect((fetch as jest.Mock).mock.calls[0][0]).toContain('/health');
  });
});
