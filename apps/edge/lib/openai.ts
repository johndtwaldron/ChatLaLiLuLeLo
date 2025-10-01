import OpenAI from 'openai';

export const createOpenAIClient = (apiKey: string) => {
  return new OpenAI({
    apiKey,
  });
};

export type Mode = 'BTC' | 'JD' | 'GW' | 'MGS';

export async function streamChat({
  openai,
  systemPrompt,
  messages,
  model = 'gpt-4o-mini',
  temperature = 0.7,
  max_tokens = 600
}: {
  openai: OpenAI;
  systemPrompt: string;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  model?: string; 
  temperature?: number; 
  max_tokens?: number;
}) {
  // Compose with system prompt on top
  const payload: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content
    }))
  ];

  const stream = await openai.chat.completions.create({
    model,
    messages: payload,
    temperature,
    max_tokens,
    stream: true,
  });

  return stream; // AsyncIterable<ChatCompletionChunk>
}
