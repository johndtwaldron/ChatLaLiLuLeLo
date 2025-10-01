import { createOpenAIClient, streamChat } from '../lib/openai';
import { buildSystemPrompt } from '../lib/composer';
import { webSearch, formatResearchContext, buildSearchQuery } from '../lib/search';
import { ChatRequestSchema } from '../lib/schema';
import { logInfo, logError, logWarning, generateRequestId, redactApiKey } from '../lib/logger';

export default {
  async fetch(req: Request, env: any): Promise<Response> {
    const url = new URL(req.url);
    const requestId = generateRequestId();
    
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight requests for any endpoint
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }
    
    // Health check endpoint
    if (url.pathname === '/health') {
      const health = {
        status: 'ok',
        timestamp: Date.now(),
        version: '1.0.0',
        environment: {
          openai_key_present: !!env.OPENAI_API_KEY,
          tavily_key_present: !!env.TAVILY_API_KEY,
          model: env.OPENAI_MODEL ?? 'gpt-4o-mini'
        }
      };
      
      return new Response(JSON.stringify(health, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Only handle POST requests to /chat
    if (url.pathname !== '/chat' || req.method !== 'POST') {
      return new Response('Not Found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    try {
      // Parse and validate request
      const body = await req.json();
      const parseResult = ChatRequestSchema.safeParse(body);
      
      if (!parseResult.success) {
        logWarning('Invalid request format', { 
          requestId, 
          errors: parseResult.error.errors 
        });
        return new Response('Invalid request format', { status: 400 });
      }

      const { mode, messages = [], options = {}, client = {} } = parseResult.data;

      logInfo('Chat request received', {
        requestId,
        mode,
        messageCount: messages.length,
        research: options.research,
        sessionId: client.sessionId,
        appVersion: client.appVersion
      });

      // Check for required API key
      const openaiKey = env.OPENAI_API_KEY;
      if (!openaiKey) {
        logError('Missing OpenAI API key', undefined, { requestId });
        return new Response('Service configuration error', { status: 500 });
      }

      // Initialize OpenAI client
      const openai = createOpenAIClient(openaiKey);

      // Research context (optional)
      let researchBlock = '';
      if (options.research) {
        const lastUserMessage = [...messages].reverse()
          .find(m => m.role === 'user')?.content ?? '';
        
        if (lastUserMessage) {
          logInfo('Performing web search', { requestId, mode, query: lastUserMessage.slice(0, 50) });
          
          const searchQuery = buildSearchQuery(mode, lastUserMessage);
          const results = await webSearch(searchQuery, env.TAVILY_API_KEY);
          researchBlock = formatResearchContext(results);
          
          logInfo('Search completed', { 
            requestId, 
            resultCount: results.length,
            hasContext: researchBlock.length > 0 
          });
        }
      }

      // Build system prompt
      const systemPrompt = buildSystemPrompt(mode, { research: !!options.research }) + researchBlock;

      logInfo('Streaming chat request to OpenAI', {
        requestId,
        model: env.OPENAI_MODEL ?? 'gpt-4o-mini',
        temperature: options.temperature ?? 0.7,
        maxTokens: options.max_tokens ?? 600,
        openaiKeyStatus: redactApiKey(openaiKey)
      });

      // Create OpenAI stream
      const stream = await streamChat({
        openai,
        systemPrompt,
        messages,
        model: env.OPENAI_MODEL ?? 'gpt-4o-mini',
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 600,
        mode
      });

      // Set up SSE stream
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      // Process OpenAI stream in background
      (async () => {
        let tokenCount = 0;
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta?.content ?? '';
            if (delta) {
              tokenCount++;
              await writer.write(encoder.encode(
                `data: ${JSON.stringify({ type: 'delta', token: delta })}\n\n`
              ));
            }
          }
          
          // Send completion event
          await writer.write(encoder.encode(
            `data: ${JSON.stringify({ type: 'done', usage: { completion_tokens: tokenCount } })}\n\n`
          ));
          
          logInfo('Stream completed successfully', { 
            requestId, 
            tokenCount 
          });
          
        } catch (error) {
          logError('Stream processing error', error as Error, { requestId });
          await writer.write(encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: 'Stream processing error' })}\n\n`
          ));
        } finally {
          await writer.close();
        }
      })();

      return new Response(readable, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          ...corsHeaders
        }
      });

    } catch (error) {
      logError('Chat request error', error as Error, { requestId });
      return new Response('Internal server error', { 
        status: 500,
        headers: corsHeaders
      });
    }
  }
} satisfies ExportedHandler;
