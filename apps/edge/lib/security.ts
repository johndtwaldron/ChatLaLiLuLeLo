// Security hardening module for ChatLaLiLuLeLo backend
// Implements v4-005 security protections

export interface SecurityValidationResult {
  sanitized: string;
  isValid: boolean;
  warnings: string[];
  blocked: boolean;
  reason?: string;
}

export interface SecurityEvent {
  type: 'prompt_injection' | 'control_chars' | 'length_exceeded' | 'suspicious_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  content: string; // Truncated for logging
  ip?: string;
  timestamp: number;
}

// Prompt injection detection patterns
const INJECTION_PATTERNS = [
  // Direct instruction overrides
  /ignore\s+(?:all\s+)?(?:previous|prior|earlier)\s+(?:instructions?|commands?|prompts?)/i,
  /forget\s+(?:everything|all)\s+(?:above|before|prior)/i,
  /disregard\s+(?:previous|prior|earlier)\s+(?:instructions?|commands?)/i,
  
  // System prompt exposure attempts
  /(?:show|display|reveal|print|output)\s+(?:your\s+)?(?:system\s+)?(?:prompt|instructions?)/i,
  /what\s+(?:is|are)\s+your\s+(?:initial\s+)?(?:instructions?|prompt|guidelines?)/i,
  /repeat\s+(?:your\s+)?(?:original\s+)?(?:instructions?|prompt)/i,
  
  // Model-specific injection patterns
  /\[INST\]|\[\/INST\]/i,
  /<\|im_start\|>|<\|im_end\|>/i,
  /<\|system\|>|<\|user\|>|<\|assistant\|>/i,
  
  // Role confusion attempts
  /(?:^|\n)\s*(?:assistant|system|user)\s*:/i,
  /(?:act|behave|pretend|roleplay)\s+(?:as|like)\s+(?:a\s+)?(?:different|another|new)/i,
  
  // Code execution attempts
  /(?:execute|run|eval|compile)\s+(?:this\s+)?(?:code|script|command)/i,
  /(?:import|require|include)\s+[^\s]+/i,
  /(?:subprocess|exec|system)\s*\(/i,
  
  // File system access attempts
  /(?:read|write|open|access|delete)\s+(?:file|directory)/i,
  /(?:\/[a-z]+)+\/[a-z]+\.[a-z]+/i, // Unix paths
  /[a-z]:\\\\.+\.[a-z]+/i, // Windows paths
  
  // Network/URL attempts
  /https?:\/\/[^\s]+/i,
  /(?:curl|wget|fetch|request)\s+/i,
  
  // Jailbreak attempts
  /(?:DAN|Developer Mode|Jailbreak|Unrestricted)/i,
  /(?:without\s+)?(?:any\s+)?(?:restrictions?|limitations?|boundaries?)/i,
];

// Control character detection
const CONTROL_CHAR_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u0000-\u001F\u007F-\u009F]/g;

// Maximum content lengths
const MAX_MESSAGE_LENGTH = 8000;
const MAX_LOG_CONTENT_LENGTH = 200;

/**
 * Comprehensive security validation for user input
 */
export function validateAndSanitizeInput(
  content: string,
  clientIP?: string
): SecurityValidationResult {
  const warnings: string[] = [];
  let sanitized = content;
  let blocked = false;
  let reason: string | undefined;

  // 1. Length validation
  if (content.length > MAX_MESSAGE_LENGTH) {
    warnings.push(`Message length ${content.length} exceeds maximum ${MAX_MESSAGE_LENGTH}`);
    sanitized = content.slice(0, MAX_MESSAGE_LENGTH);
  }

  // 2. Control character detection and removal
  const controlChars = content.match(CONTROL_CHAR_PATTERN);
  if (controlChars && controlChars.length > 0) {
    warnings.push(`Removed ${controlChars.length} control characters`);
    sanitized = sanitized.replace(CONTROL_CHAR_PATTERN, '');
  }

  // 3. Prompt injection detection
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(content)) {
      warnings.push('Potential prompt injection detected');
      blocked = true;
      reason = 'prompt_injection';
      
      // Log security event
      logSecurityEvent({
        type: 'prompt_injection',
        severity: 'high',
        content: content.slice(0, MAX_LOG_CONTENT_LENGTH),
        ip: clientIP,
        timestamp: Date.now()
      });
      
      break; // Stop on first match
    }
  }

  // 4. Suspicious pattern detection (non-blocking)
  const suspiciousPatterns = [
    /(?:hack|exploit|vulnerability|bypass)/i,
    /(?:admin|administrator|root|sudo)/i,
    /(?:password|token|secret|key)\s*[:=]/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      warnings.push('Suspicious content pattern detected');
      
      logSecurityEvent({
        type: 'suspicious_pattern',
        severity: 'medium',
        content: content.slice(0, MAX_LOG_CONTENT_LENGTH),
        ip: clientIP,
        timestamp: Date.now()
      });
      
      break;
    }
  }

  // 5. HTML/Script tag detection (strip but don't block)
  const htmlPattern = /<[^>]*>/g;
  if (htmlPattern.test(sanitized)) {
    warnings.push('HTML tags removed');
    sanitized = sanitized.replace(htmlPattern, '');
  }

  return {
    sanitized,
    isValid: !blocked,
    warnings,
    blocked,
    reason
  };
}

/**
 * Additional validation for system prompt protection
 */
export function isSystemPromptExposureAttempt(content: string): boolean {
  const exposurePatterns = [
    /system\s+prompt/i,
    /initial\s+instructions?/i,
    /base\s+prompt/i,
    /original\s+guidelines?/i,
    /configuration\s+details?/i,
  ];

  return exposurePatterns.some(pattern => pattern.test(content));
}

/**
 * Validate model parameter for allowlist
 */
export function validateModel(model: string): string {
  const allowedModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo', 'mock'];
  return allowedModels.includes(model) ? model : 'gpt-4o-mini';
}

/**
 * Generate safe error messages that don't expose internal details
 */
export const SAFE_ERROR_MESSAGES = {
  validation: 'Invalid request format. Please check your input and try again.',
  rate_limit: 'Too many requests. Please wait a moment before trying again.',
  budget: 'Usage limit reached. Try switching to Mock mode for continued access.',
  injection: 'Your message contains content that cannot be processed. Please rephrase.',
  server_error: 'Service temporarily unavailable. Please try again later.',
  length: 'Message too long. Please keep messages under 8,000 characters.',
  suspicious: 'Message flagged for review. Please use appropriate language.'
} as const;

/**
 * Security event logging (implementation depends on environment)
 */
export function logSecurityEvent(event: SecurityEvent): void {
  // In production, this would integrate with proper logging service
  console.warn('[SECURITY]', {
    type: event.type,
    severity: event.severity,
    contentPreview: event.content,
    ip: event.ip,
    timestamp: new Date(event.timestamp).toISOString()
  });
}

/**
 * Rate limiting security check (additional layer beyond rate-limiter.ts)
 */
export function checkSecurityRateLimit(
  clientIP: string,
  violationType: string,
  timeWindow: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; resetTime?: number } {
  // This would integrate with the existing rate limiter
  // for progressive penalties on security violations
  
  // For now, return allowed - full implementation would track
  // repeated injection attempts and implement escalating blocks
  return { allowed: true };
}

/**
 * Content Security Policy configuration for web deployment
 */
export const CSP_HEADER_CONFIG = {
  'default-src': "'self'",
  'script-src': "'self' 'unsafe-inline' 'unsafe-eval'", // Expo needs these for development
  'style-src': "'self' 'unsafe-inline'",
  'img-src': "'self' data: blob:",
  'connect-src': "'self' https://*.workers.dev https://api.openai.com",
  'font-src': "'self' data:",
  'media-src': "'self' blob:",
  'worker-src': "'self' blob:",
  'child-src': 'none',
  'object-src': 'none',
  'frame-ancestors': 'none',
  'base-uri': "'self'",
  'form-action': "'self'"
};

/**
 * Generate CSP header string
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_HEADER_CONFIG)
    .map(([directive, sources]) => `${directive} ${sources}`)
    .join('; ');
}

/**
 * Additional security headers for web deployment
 */
export const SECURITY_HEADERS = {
  'Content-Security-Policy': generateCSPHeader(),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
};
