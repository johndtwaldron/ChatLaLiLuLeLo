// Rate limiting and usage tracking for ChatLaLiLuLeLo backend
// Implements v4-004 spend controls to protect $5/month budget

export interface RateLimitConfig {
  requestsPerWindow: number; // requests per time window
  windowMs: number; // time window in milliseconds  
  maxTokensPerSession: number; // max tokens per session
  maxMessageLength: number; // max characters per message
  monthlyBudgetUSD: number; // monthly spend limit
}

export interface UsageStats {
  requestCount: number;
  tokenCount: number;
  estimatedSpendUSD: number;
  windowStart: number;
  sessionStart: number;
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: 'rate_limit' | 'session_tokens' | 'message_length' | 'monthly_budget';
  resetTime?: number;
  stats: UsageStats;
}

// Default configuration for production deployment
export const DEFAULT_CONFIG: RateLimitConfig = {
  requestsPerWindow: 30, // 30 requests per 15 minutes (per V4 plan)
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxTokensPerSession: 50000, // 50k tokens per session (per V4 plan)
  maxMessageLength: 8000, // 8k chars max (per V4 plan)
  monthlyBudgetUSD: 5.00 // Hard $5/month cap (per V4 plan)
};

// Token cost estimates (approximate, based on OpenAI pricing)
const TOKEN_COSTS = {
  'gpt-4o-mini': 0.00000015, // $0.15/M tokens
  'gpt-4o': 0.000005, // $5.00/M tokens  
  'gpt-3.5-turbo': 0.0000005, // $0.50/M tokens
  'mock': 0 // free
};

export class RateLimiter {
  private storage: Map<string, UsageStats> = new Map();
  
  constructor(private config: RateLimitConfig = DEFAULT_CONFIG) {}
  
  // Get client identifier (IP + session for granular tracking)
  private getClientKey(request: Request, sessionId?: string): string {
    const ip = request.headers.get('CF-Connecting-IP') || 
               request.headers.get('X-Forwarded-For') || 
               'unknown';
    return sessionId ? `${ip}:${sessionId}` : ip;
  }
  
  // Check if request should be allowed
  checkRateLimit(
    request: Request, 
    messageContent: string,
    sessionId?: string,
    model: string = 'gpt-4o-mini'
  ): RateLimitResult {
    const clientKey = this.getClientKey(request, sessionId);
    const now = Date.now();
    
    // Get or create usage stats for this client
    let stats = this.storage.get(clientKey);
    if (!stats) {
      stats = {
        requestCount: 0,
        tokenCount: 0,
        estimatedSpendUSD: 0,
        windowStart: now,
        sessionStart: now
      };
      this.storage.set(clientKey, stats);
    }
    
    // Reset window if expired
    if (now - stats.windowStart > this.config.windowMs) {
      stats.requestCount = 0;
      stats.windowStart = now;
    }
    
    // Check message length limit
    if (messageContent.length > this.config.maxMessageLength) {
      return {
        allowed: false,
        reason: 'message_length',
        stats
      };
    }
    
    // Check requests per window limit
    if (stats.requestCount >= this.config.requestsPerWindow) {
      return {
        allowed: false,
        reason: 'rate_limit',
        resetTime: stats.windowStart + this.config.windowMs,
        stats
      };
    }
    
    // Estimate tokens for this request (rough approximation)
    const estimatedTokens = Math.ceil(messageContent.length / 4); // ~4 chars per token
    
    // Check session token limit
    if (stats.tokenCount + estimatedTokens > this.config.maxTokensPerSession) {
      return {
        allowed: false,
        reason: 'session_tokens',
        stats
      };
    }
    
    // Check monthly budget (rough estimation)
    const tokenCost = TOKEN_COSTS[model as keyof typeof TOKEN_COSTS] || TOKEN_COSTS['gpt-4o-mini'];
    const estimatedCostUSD = (stats.tokenCount + estimatedTokens) * tokenCost;
    
    if (estimatedCostUSD > this.config.monthlyBudgetUSD) {
      return {
        allowed: false,
        reason: 'monthly_budget',
        stats
      };
    }
    
    // Request allowed - update stats
    stats.requestCount++;
    stats.tokenCount += estimatedTokens;
    stats.estimatedSpendUSD = estimatedCostUSD;
    
    return {
      allowed: true,
      stats
    };
  }
  
  // Track actual token usage from OpenAI response
  trackTokenUsage(
    request: Request,
    actualTokens: number,
    sessionId?: string,
    model: string = 'gpt-4o-mini'
  ) {
    const clientKey = this.getClientKey(request, sessionId);
    const stats = this.storage.get(clientKey);
    
    if (stats) {
      // Update with actual token count
      stats.tokenCount = Math.max(stats.tokenCount, actualTokens);
      
      // Recalculate actual cost
      const tokenCost = TOKEN_COSTS[model as keyof typeof TOKEN_COSTS] || TOKEN_COSTS['gpt-4o-mini'];
      stats.estimatedSpendUSD = stats.tokenCount * tokenCost;
    }
  }
  
  // Get usage stats for frontend display
  getUsageStats(request: Request, sessionId?: string): UsageStats | null {
    const clientKey = this.getClientKey(request, sessionId);
    return this.storage.get(clientKey) || null;
  }
  
  // Cleanup expired entries (call periodically)
  cleanup() {
    const now = Date.now();
    for (const [key, stats] of this.storage.entries()) {
      // Remove entries older than 24 hours
      if (now - stats.sessionStart > 24 * 60 * 60 * 1000) {
        this.storage.delete(key);
      }
    }
  }
}

// Create rate limiter with warning thresholds
export function createBudgetWarning(stats: UsageStats, config: RateLimitConfig) {
  const budgetUsedPercent = (stats.estimatedSpendUSD / config.monthlyBudgetUSD) * 100;
  const tokenUsedPercent = (stats.tokenCount / config.maxTokensPerSession) * 100;
  
  if (budgetUsedPercent >= 90) {
    return {
      level: 'critical' as const,
      message: `Budget 90% used ($${stats.estimatedSpendUSD.toFixed(3)}/$${config.monthlyBudgetUSD}). Switch to Mock mode to continue.`,
      budgetUsedPercent,
      tokenUsedPercent
    };
  } else if (budgetUsedPercent >= 75) {
    return {
      level: 'warning' as const, 
      message: `Budget 75% used ($${stats.estimatedSpendUSD.toFixed(3)}/$${config.monthlyBudgetUSD}). Consider using Mock mode.`,
      budgetUsedPercent,
      tokenUsedPercent
    };
  } else if (tokenUsedPercent >= 80) {
    return {
      level: 'info' as const,
      message: `Session tokens 80% used (${stats.tokenCount.toLocaleString()}/${config.maxTokensPerSession.toLocaleString()}).`,
      budgetUsedPercent,
      tokenUsedPercent
    };
  }
  
  return null;
}
