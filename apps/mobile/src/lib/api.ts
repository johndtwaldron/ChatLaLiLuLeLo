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
  mode: 'BTC' | 'JD' | 'GW' | 'MGS' | 'RICK';
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
  // 3) Production fallback to Cloudflare Worker
  const runtime = (globalThis as any).__DEMO_API_URL as string | undefined;
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  
  // If we have a runtime URL from Pages deployment, use it
  if (runtime && runtime !== 'undefined') {
    return runtime;
  }
  
  // If we have an environment URL, use it
  if (envUrl && envUrl !== 'undefined') {
    return envUrl;
  }
  
  // Production fallback - use the deployed Cloudflare Worker
  if (typeof window !== 'undefined' && window.location.origin.includes('github.io')) {
    return 'https://chatlalilulelo-backend-prod.chatlalilulelo.workers.dev';
  }
  
  // Local development fallback
  return 'http://localhost:8787';
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
    
    // Buffer for handling incomplete SSE events across chunks
    let buffer = '';

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Append new chunk to buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Split on double newline (SSE event separator)
      const events = buffer.split('\n\n');
      
      // Keep the last (potentially incomplete) event in buffer
      buffer = events.pop() || '';
      
      // Process complete events
      for (const rawEvent of events) {
        if (!rawEvent.trim()) continue;
        
        // Find the data line(s) in this event
        const lines = rawEvent.split('\n');
        const dataLines = lines.filter(line => line.startsWith('data:'));
        
        if (dataLines.length === 0) continue;
        
        // Concatenate multiple data lines (SSE spec allows this)
        const jsonText = dataLines
          .map(line => line.slice(5).trim()) // Remove 'data:' prefix
          .join('');
        
        if (!jsonText) continue;
        
        try {
          const event = JSON.parse(jsonText) as StreamEvent;
          
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
        } catch (parseError) {
          // Log parsing errors but don't crash the stream
          console.warn('[API] Failed to parse SSE event payload:', {
            jsonText: jsonText.slice(0, 100),
            error: parseError instanceof Error ? parseError.message : String(parseError)
          });
          // Continue processing other events
        }
      }
    }
    
    // Process any remaining buffered content
    // Use the same splitting logic as the main loop to handle multiple events
    if (buffer.trim()) {
      const events = buffer.split('\n\n').filter(e => e.trim());
      
      for (const rawEvent of events) {
        const lines = rawEvent.split('\n');
        const dataLines = lines.filter(line => line.startsWith('data:'));
        
        if (dataLines.length === 0) continue;
        
        const jsonText = dataLines
          .map(line => line.slice(5).trim())
          .join('');
        
        if (!jsonText) continue;
        
        try {
          const event = JSON.parse(jsonText) as StreamEvent;
          if (event.type === 'done') {
            onDone?.(event.usage);
          } else if (event.type === 'error') {
            onError?.(event.message || 'Unknown error');
          }
          // Silently ignore other event types in final buffer (e.g. trailing deltas)
        } catch (parseError) {
          // Silently ignore malformed trailing fragments
          // This is normal when stream closes mid-event
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
