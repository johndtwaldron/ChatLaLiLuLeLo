import { z } from 'zod';

export const ModeSchema = z.enum(['BTC', 'JD', 'GW', 'MGS', 'RICK']);
export type Mode = z.infer<typeof ModeSchema>;

export const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

export const ModelSchema = z.enum(['gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo', 'mock']);
export type ModelType = z.infer<typeof ModelSchema>;

export const ChatRequestSchema = z.object({
  mode: ModeSchema,
  profile: z.object({
    firstName: z.string().trim().min(1).max(40),
    picture: z.string().url().max(2048).refine(value => {
      const url = new URL(value);
      return url.protocol === 'https:' && (url.hostname === 'googleusercontent.com' || url.hostname.endsWith('.googleusercontent.com')) && !url.username && !url.password;
    }, 'Only Google-hosted profile photos are supported').optional(),
  }).optional(),
  messages: z.array(MessageSchema).optional(),
  options: z.object({
    research: z.boolean().optional(),
    max_tokens: z.number().min(50).max(1000).optional(),
    temperature: z.number().min(0).max(2).optional(),
    model: ModelSchema.optional(),
  }).optional(),
  client: z.object({
    sessionId: z.string().optional(),
    appVersion: z.string().optional(),
  }).optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const StreamEventSchema = z.union([
  z.object({
    type: z.literal('delta'),
    token: z.string(),
  }),
  z.object({
    type: z.literal('done'),
    usage: z.object({
      prompt_tokens: z.number().optional(),
      completion_tokens: z.number().optional(),
      total_tokens: z.number().optional(),
    }).optional(),
  }),
  z.object({
    type: z.literal('error'),
    message: z.string(),
  }),
]);

export type StreamEvent = z.infer<typeof StreamEventSchema>;
