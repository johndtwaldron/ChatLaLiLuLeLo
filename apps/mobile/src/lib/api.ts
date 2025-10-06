export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  research?: boolean;
  max_tokens?: number;
  temperature?: number;
  model?: 'gpt-4o-mini' | 'gpt-4o' | 'gpt-3.5-turbo' | 'mock';
}

export interface ChatClient {
  sessionId?: string;
  appVersion?: string;
}

export interface ChatRequest {
  mode: 'BTC' | 'JD' | 'GW' | 'MGS';
  messages?: ChatMessage[];
  options?: ChatOptions;
  client?: ChatClient;
}

export interface StreamEvent {
  type: 'delta' | 'done' | 'error';
  token?: string;
  message?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export function getApiUrl(): string {
  // 1) Prefer runtime var injected by Pages workflow
  // 2) Fallback to Expo env for local dev
  const runtime = (globalThis as any).__DEMO_API_URL as string | undefined;
  return runtime ?? process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';
}

export function streamReply(
  request: ChatRequest, 
  onToken: (token: string) => void,
  onDone?: (usage?: any) => void,
  onError?: (error: string) => void
): Promise<void> {
  const apiUrl = getApiUrl();
  
  return fetch(`${apiUrl}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request)
  }).then(async (response) => {
    if (!response.ok) {
      // Try to extract error details from response body
      try {
        const errorData = await response.json();
        if (errorData.error) {
          throw new Error(errorData.error);
        }
      } catch (jsonError) {
        // Fallback to status-based error
      }
      
      throw new Error(`API error: ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n\n');
      
      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue;
        
        try {
          const eventData = JSON.parse(line.slice(6)); // Remove 'data: ' prefix
          const event = eventData as StreamEvent;
          
          switch (event.type) {
            case 'delta':
              if (event.token) {
                onToken(event.token);
              }
              break;
            case 'done':
              onDone?.(event.usage);
              return;
            case 'error':
              onError?.(event.message || 'Unknown error');
              return;
          }
        } catch (e) {
          console.warn('Failed to parse SSE event:', line);
        }
      }
    }
  }).catch((error) => {
    onError?.(error.message);
    throw error;
  });
}

export async function healthCheck(): Promise<any> {
  const apiUrl = getApiUrl();
  
  try {
    const response = await fetch(`${apiUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
}
