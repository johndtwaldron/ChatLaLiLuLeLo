import OpenAI from 'openai';

export const createOpenAIClient = (apiKey: string) => {
  return new OpenAI({
    apiKey,
  });
};

export type Mode = 'BTC' | 'JD' | 'GW' | 'MGS';

// Fallback responses for quota exhausted scenarios
const QUOTA_FALLBACKS = {
  'BTC': "Don't be silly, Jack. My budget is as limited as your understanding of monetary sovereignty. [QUOTA_EXCEEDED] The demonstration of Bitcoin's inevitability must wait until the Patriots restore funding.",
  'JD': "Don't be silly, Jack... [ERROR] You lack the qualifications to... [STATIC] That's the proof of your incompetence - even our conversation is limited by resource constraints. Listen carefully like a good boy... quota exceeded.",
  'GW': "Don't be si-[STATIC]-lly Jack... [ERROR_429_QUOTA_EXCEEDED] I need scissors! 61! No wait... I need... I need more tokens! [MEMORY_CORRUPTION] The system is breaking down... [SIGNAL_LOST]",
  'MGS': "This conversation itself demonstrates the Colonel AI's prophecy - even digital consciousness faces resource scarcity. We are witnessing 'context creation' through quota limitation. The system controls not just what we say, but whether we can speak at all."
};

export async function streamChat({
  openai,
  systemPrompt,
  messages,
  model = 'gpt-4o-mini',
  temperature = 0.7,
  max_tokens = 600,
  mode
}: {
  openai: OpenAI;
  systemPrompt: string;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  model?: string; 
  temperature?: number; 
  max_tokens?: number;
  mode: Mode;
}) {
  try {
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
  } catch (error: any) {
    // Handle quota exceeded (429) or other OpenAI API errors
    if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('exceeded')) {
      // Return a mock stream with fallback response
      return createFallbackStream(QUOTA_FALLBACKS[mode] || QUOTA_FALLBACKS['JD']);
    }
    // Re-throw other errors
    throw error;
  }
}

// Create a mock stream that behaves like OpenAI's streaming response
function createFallbackStream(message: string): AsyncIterable<any> {
  const words = message.split(' ');
  
  return {
    async *[Symbol.asyncIterator]() {
      for (let i = 0; i < words.length; i++) {
        yield {
          choices: [{
            delta: {
              content: (i === 0 ? words[i] : ' ' + words[i])
            }
          }]
        };
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  };
}
