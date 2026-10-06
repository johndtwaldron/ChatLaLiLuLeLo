export type Role = 'user' | 'assistant' | 'system';

// New clean snapshot-based types
export type ModeTag = 'JD' | 'BTC' | 'GW' | 'MGS' | 'RICK';
export type ModelTag = 'gpt-4.1' | 'gpt-4.1-mini' | 'gpt-4o-mini' | 'mock';

export type MsgMeta = {
  mode: ModeTag;
  model: ModelTag;
  at: number;          // Date.now()
  kind?: 'system' | 'user' | 'ai';
};

export type ChatMsg = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  meta: MsgMeta;
};

// Legacy interfaces for backward compatibility
export interface MessageMeta {
  mode: 'GW' | 'JD' | 'MGS' | 'BTC';
  model: 'gpt-4.1' | 'gpt-4.1-mini' | 'gpt-4o-mini' | 'mock';
  tag: string; // e.g. "[JD]:[gpt-4.1-mini]:"
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  meta: MessageMeta;
}

export interface Message {
  id: string;
  text: string;
  speaker: 'colonel' | 'user';
  timestamp: number;
  meta?: MsgMeta; // Updated to use new meta type
}
