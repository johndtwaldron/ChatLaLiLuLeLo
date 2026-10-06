import { streamReply } from '../api';
import { currentChatProfile, saveGoogleProfile, disconnectGoogleProfile } from '../googleProfile';
import { ChatRequestSchema } from '../../../../edge/lib/schema';
import { DEFAULT_MODELS, modelCatalog } from '../../../../edge/lib/models';
import { refreshModelCatalog, modelConfigs } from '../theme';
import { streamChat } from '../../../../edge/lib/openai';
jest.mock('openai', () => jest.fn(), { virtual: true });

describe('session profile for chat', () => {
  afterEach(() => disconnectGoogleProfile());
  it('supplies photo context independently of message wording and clears it on disconnect', () => {
    saveGoogleProfile({ firstName: 'John', picture: 'https://lh3.googleusercontent.com/photo' });
    expect(currentChatProfile()).toEqual({ firstName: 'John', picture: 'https://lh3.googleusercontent.com/photo' });
    disconnectGoogleProfile();
    expect(currentChatProfile()).toBeUndefined();
    saveGoogleProfile({ firstName: 'John', picture: null });
    expect(currentChatProfile()).toEqual({ firstName: 'John' });
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
    expect(payload.messages[3].content).toEqual([{ type: 'text', text: 'my pfp?' }, { type: 'image_url', image_url: { url: 'https://lh3.googleusercontent.com/photo', detail: 'auto' } }]);
    expect(JSON.stringify(payload.messages[4])).toContain('John');
    expect(payload.messages[5].content).toContain('not a live camera feed');
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


describe('refreshable model catalogue', () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; });
  it('accepts an explicitly configured compatible future model', () => {
    const addition = { id: 'gpt-future-mini', name: 'Future Mini', description: 'Configured by operator', inputPrice: 1, outputPrice: 5, adapter: 'standard' };
    expect(modelCatalog({ MODEL_CATALOG_JSON: JSON.stringify([addition]) })).toContainEqual(addition);
    expect(() => modelCatalog({ MODEL_CATALOG_JSON: JSON.stringify([{ ...addition, adapter: 'unrecognised' }]) })).toThrow();
  });
  it('loads new dropdown choices without changing frontend code', async () => {
    const extra = { id: 'gpt-future-mini', name: 'Future Mini', description: 'Test', inputPrice: 1, outputPrice: 5, adapter: 'standard' };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ defaultModel: 'gpt-5.4-mini', models: [...DEFAULT_MODELS, extra] }) });
    await refreshModelCatalog();
    expect(modelConfigs[extra.id].name).toBe('Future Mini');
    delete modelConfigs[extra.id];
  });
  it.each(['gpt-5.4-mini', 'gpt-5.4'])('uses compatible streaming parameters for %s', async model => {
    const create = jest.fn().mockResolvedValue({});
    await streamChat({ openai: { chat: { completions: { create } } } as any, systemPrompt: 'Codec', mode: 'JD', model,
      messages: [{ role: 'user', content: 'Hello' }] });
    const payload = create.mock.calls[0][0];
    expect(payload.max_completion_tokens).toBe(600);
    expect(payload.reasoning_effort).toBe('none');
    expect(payload).not.toHaveProperty('max_tokens');
    expect(payload).not.toHaveProperty('temperature');
    expect(payload.store).toBe(false);
  });
});
