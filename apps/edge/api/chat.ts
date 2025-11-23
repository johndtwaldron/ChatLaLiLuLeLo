import { createOpenAIClient, streamChat, validateModel } from '../lib/openai';
import { buildSystemPrompt } from '../lib/composer';
import { webSearch, formatResearchContext, buildSearchQuery } from '../lib/search';
import { ChatRequestSchema } from '../lib/schema';
import { logInfo, logError, logWarning, generateRequestId, redactApiKey } from '../lib/logger';
import { RateLimiter, createBudgetWarning, DEFAULT_CONFIG } from '../lib/rate-limiter';
import { validateAndSanitizeInput, SAFE_ERROR_MESSAGES, logSecurityEvent } from '../lib/security';
import { validateOpenAIKey, getKeyPreview } from '../lib/config';

// Global rate limiter instance
const rateLimiter = new RateLimiter(DEFAULT_CONFIG);

export default {
  async fetch(req: Request, env: any): Promise<Response> {
    const url = new URL(req.url);
    const requestId = generateRequestId();
    
    // CORS headers with origin-specific allowlist
    const getCorsHeaders = (origin: string | null = null) => {
      // Development and GitHub Pages allowed origins
      const allowedOrigins = [
        'http://localhost:14085',
        'http://localhost:8082',
        'http://127.0.0.1:14085',
        'https://johndtwaldron.github.io',
        ...(env.CORS_ORIGINS ? env.CORS_ORIGINS.split(',').map((o: string) => o.trim()) : [])
      ];
      
      // Check if origin is allowed
      const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : '*';
      
      const headers: Record<string, string> = {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };
      
      // Add Vary header when using specific origins
      if (allowedOrigin !== '*') {
        headers['Vary'] = 'Origin';
      }
      
      return headers;
    };
    
    const origin = req.headers.get('Origin');
    const corsHeaders = getCorsHeaders(origin);

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
    
    // Budget status endpoint for frontend display
    if (url.pathname === '/budget') {
      try {
        const sessionId = url.searchParams.get('sessionId') || undefined;
        const stats = rateLimiter.getUsageStats(req, sessionId);
        
        const budgetStatus = {
          status: 'ok',
          timestamp: Date.now(),
          usage: stats || {
            requestCount: 0,
            tokenCount: 0,
            estimatedSpendUSD: 0,
            windowStart: Date.now(),
            sessionStart: Date.now()
          },
          config: {
            requestsPerWindow: DEFAULT_CONFIG.requestsPerWindow,
            windowMs: DEFAULT_CONFIG.windowMs,
            maxTokensPerSession: DEFAULT_CONFIG.maxTokensPerSession,
            monthlyBudgetUSD: DEFAULT_CONFIG.monthlyBudgetUSD
          },
          warning: stats ? createBudgetWarning(stats, DEFAULT_CONFIG) : null
        };
        
        return new Response(JSON.stringify(budgetStatus, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      } catch (error) {
        logError('Budget status error', error as Error, { requestId });
        return new Response('Budget status error', { 
          status: 500,
          headers: corsHeaders
        });
      }
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
      console.log('[CHAT] Received request at', new Date().toISOString());
      console.log('[CHAT] Request method:', req.method);
      console.log('[CHAT] Request URL:', req.url);
      
      const body = await req.json();
      console.log('[CHAT] Parsed body:', JSON.stringify(body, null, 2));
      const parseResult = ChatRequestSchema.safeParse(body);
      
      if (!parseResult.success) {
        logWarning('Invalid request format', { 
          requestId, 
          errors: parseResult.error.errors,
          body: JSON.stringify(body)
        });
        
        // Return structured JSON error with validation details
        return new Response(JSON.stringify({
          error: 'Invalid request format',
          details: parseResult.error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          })),
          requestId
        }), { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      const { mode, messages = [], options = {}, client = {} } = parseResult.data;
      
      // Get client IP for security logging
      const clientIP = req.headers.get('CF-Connecting-IP') || 
                      req.headers.get('X-Forwarded-For') || 
                      'unknown';
      
      // Security validation for all user messages
      const sanitizedMessages = [];
      let securityBlocked = false;
      let securityReason = '';
      
      for (const message of messages) {
        if (message.role === 'user') {
          const securityResult = validateAndSanitizeInput(message.content, clientIP);
          
          if (securityResult.blocked) {
            securityBlocked = true;
            securityReason = securityResult.reason || 'security_violation';
            
            logWarning('Security validation blocked message', {
              requestId,
              reason: securityResult.reason,
              warnings: securityResult.warnings,
              clientIP,
              sessionId: client.sessionId
            });
            
            break;
          }
          
          // Log security warnings (non-blocking)
          if (securityResult.warnings.length > 0) {
            logInfo('Security warnings for message', {
              requestId,
              warnings: securityResult.warnings,
              clientIP
            });
          }
          
          sanitizedMessages.push({
            ...message,
            content: securityResult.sanitized
          });
        } else {
          sanitizedMessages.push(message);
        }
      }
      
      // Return security error if any message was blocked
      if (securityBlocked) {
        const errorKey = securityReason === 'prompt_injection' ? 'injection' : 'suspicious';
        
        return new Response(JSON.stringify({
          error: SAFE_ERROR_MESSAGES[errorKey as keyof typeof SAFE_ERROR_MESSAGES],
          reason: 'security_violation'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      
      // Get last user message for rate limiting (use sanitized version)
      const lastUserMessage = [...sanitizedMessages].reverse()
        .find(m => m.role === 'user')?.content ?? '';
      
      // Validate and determine model to use
      const requestedModel = options.model || env.OPENAI_MODEL || 'gpt-4o-mini';
      const validatedModel = validateModel(requestedModel);
      
      // Check rate limits and budget before processing
      const rateLimitResult = rateLimiter.checkRateLimit(
        req,
        lastUserMessage,
        client.sessionId,
        validatedModel
      );
      
      if (!rateLimitResult.allowed) {
        const errorMessages = {
          rate_limit: 'Rate limit exceeded. Please try again later.',
          session_tokens: 'Session token limit reached. Please start a new session.',
          message_length: `Message too long. Maximum ${DEFAULT_CONFIG.maxMessageLength} characters allowed.`,
          monthly_budget: 'Monthly budget limit reached. Please try Mock mode or wait for next month.'
        };
        
        logWarning('Request blocked by rate limiter', {
          requestId,
          reason: rateLimitResult.reason,
          stats: rateLimitResult.stats,
          sessionId: client.sessionId
        });
        
        return new Response(JSON.stringify({
          error: errorMessages[rateLimitResult.reason!],
          reason: rateLimitResult.reason,
          resetTime: rateLimitResult.resetTime,
          stats: rateLimitResult.stats
        }), { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.resetTime ? 
              Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString() : '900',
            ...corsHeaders
          }
        });
      }

      logInfo('Chat request received', {
        requestId,
        mode,
        messageCount: messages.length,
        research: options.research,
        requestedModel,
        validatedModel,
        sessionId: client.sessionId,
        appVersion: client.appVersion
      });

      // Validate OpenAI API key format
      const openaiKey = env.OPENAI_API_KEY;
      const keyValidation = validateOpenAIKey(openaiKey);
      
      if (!keyValidation.valid) {
        logError('Invalid OpenAI API key', undefined, {
          requestId,
          error: keyValidation.error,
          keyPreview: getKeyPreview(openaiKey)
        });
        
        return new Response(JSON.stringify({
          error: 'Service configuration error',
          message: keyValidation.error,
          requestId,
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Initialize OpenAI client
      const openai = createOpenAIClient(openaiKey);

      // Research context (optional)
      let researchBlock = '';
      if (options.research) {
        const lastUserMessage = [...sanitizedMessages].reverse()
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

      logInfo('Streaming chat request', {
        requestId,
        model: validatedModel,
        temperature: options.temperature ?? 0.7,
        maxTokens: options.max_tokens ?? 600,
        openaiKeyStatus: validatedModel === 'mock' ? 'N/A (mock mode)' : redactApiKey(openaiKey)
      });

      // Create OpenAI stream (or mock stream for 'mock' model)
      const stream = await streamChat({
        openai,
        systemPrompt,
        messages: sanitizedMessages,
        model: validatedModel,
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
          
          // Track actual token usage for budget calculations
          rateLimiter.trackTokenUsage(
            req,
            tokenCount,
            client.sessionId,
            validatedModel
          );
          
          // Get updated stats and budget warning
          const updatedStats = rateLimiter.getUsageStats(req, client.sessionId);
          const budgetWarning = updatedStats ? createBudgetWarning(updatedStats, DEFAULT_CONFIG) : null;
          
          // Send completion event with budget info
          await writer.write(encoder.encode(
            `data: ${JSON.stringify({ 
              type: 'done', 
              usage: { completion_tokens: tokenCount },
              budgetWarning,
              stats: updatedStats
            })}\n\n`
          ));
          
          logInfo('Stream completed successfully', { 
            requestId, 
            tokenCount,
            estimatedSpendUSD: updatedStats?.estimatedSpendUSD
          });
          
        } catch (error) {
          logError('Stream processing error', error as Error, { requestId });
          await writer.write(encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: 'Stream processing error' })}\n\n`
          ));
        } finally {
          await writer.close();
          // Periodic cleanup of expired rate limit entries
          rateLimiter.cleanup();
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      // Log detailed error information
      console.error('CHAT ERROR - Full details:', {
        requestId,
        message: errorMessage,
        stack: errorStack,
        error: error,
        timestamp: new Date().toISOString()
      });
      
      logError('Chat request error', error as Error, { requestId });
      
      // Return structured JSON error for 500s too
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: errorMessage,
        requestId,
        timestamp: new Date().toISOString()
      }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
} satisfies ExportedHandler;
