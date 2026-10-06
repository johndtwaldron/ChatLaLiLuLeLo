/**
 * Configuration and API Key Validation
 * 
 * Validates API key formats to catch typos and configuration errors early.
 */

export interface KeyValidationResult {
  valid: boolean;
  error?: string;
  keyType?: string;
}

/**
 * Validates OpenAI API key format
 * Expected format: sk-proj-... or sk-...
 */
export function validateOpenAIKey(key: unknown): KeyValidationResult {
  if (!key) {
    return { valid: false, error: 'OpenAI API key is missing' };
  }

  if (typeof key !== 'string') {
    return { 
      valid: false, 
      error: `OpenAI API key must be a string, got ${typeof key}` 
    };
  }

  // Check for common typos
  if (key.startsWith('ssk-') || key.startsWith('skk-')) {
    return { 
      valid: false, 
      error: 'OpenAI API key appears to have a typo (double letter at start)',
      keyType: 'openai-typo'
    };
  }

  // Valid OpenAI key formats:
  // - Legacy: sk-{20+ alphanumeric/underscore/dash}
  // - Project: sk-proj-{20+ alphanumeric/underscore/dash}
  const validPattern = /^sk(-proj)?-[a-zA-Z0-9_\-]{20,}$/;
  
  if (!validPattern.test(key)) {
    return { 
      valid: false, 
      error: 'OpenAI API key format is invalid (expected: sk-... or sk-proj-...)',
      keyType: 'openai-invalid'
    };
  }

  return { valid: true, keyType: 'openai' };
}

/**
 * Validates Tavily API key format
 * Expected format: tvly-...
 */
export function validateTavilyKey(key: unknown): KeyValidationResult {
  if (!key) {
    return { valid: false, error: 'Tavily API key is missing' };
  }

  if (typeof key !== 'string') {
    return { 
      valid: false, 
      error: `Tavily API key must be a string, got ${typeof key}` 
    };
  }

  const validPattern = /^tvly-[a-zA-Z0-9_\-]{20,}$/;
  
  if (!validPattern.test(key)) {
    return { 
      valid: false, 
      error: 'Tavily API key format is invalid (expected: tvly-...)',
      keyType: 'tavily-invalid'
    };
  }

  return { valid: true, keyType: 'tavily' };
}

/**
 * Validates ElevenLabs API key format
 * Expected format: various possible formats
 */
export function validateElevenLabsKey(key: unknown): KeyValidationResult {
  if (!key) {
    return { valid: false, error: 'ElevenLabs API key is missing' };
  }

  if (typeof key !== 'string') {
    return { 
      valid: false, 
      error: `ElevenLabs API key must be a string, got ${typeof key}` 
    };
  }

  // ElevenLabs keys can have various formats, just check it's not empty
  // and has reasonable length
  if (key.length < 20) {
    return { 
      valid: false, 
      error: 'ElevenLabs API key appears too short (minimum 20 characters)',
      keyType: 'elevenlabs-short'
    };
  }

  return { valid: true, keyType: 'elevenlabs' };
}

/**
 * Gets a safe preview of an API key for logging (first 5 chars + ...)
 */
export function getKeyPreview(key: unknown): string {
  if (typeof key !== 'string') {
    return `[${typeof key}]`;
  }
  
  if (key.length < 5) {
    return '[too-short]';
  }
  
  return `${key.slice(0, 5)}...`;
}

/**
 * Validates all required API keys for the worker
 */
export function validateEnvironment(env: any): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // OpenAI is required
  const openaiResult = validateOpenAIKey(env.OPENAI_API_KEY);
  if (!openaiResult.valid) {
    errors.push(`OPENAI_API_KEY: ${openaiResult.error}`);
  }

  // Tavily is optional but validate if present
  if (env.TAVILY_API_KEY) {
    const tavilyResult = validateTavilyKey(env.TAVILY_API_KEY);
    if (!tavilyResult.valid) {
      warnings.push(`TAVILY_API_KEY: ${tavilyResult.error}`);
    }
  }

  // ElevenLabs is optional but validate if present
  if (env.ELEVENLABS_API_KEY) {
    const elevenResult = validateElevenLabsKey(env.ELEVENLABS_API_KEY);
    if (!elevenResult.valid) {
      warnings.push(`ELEVENLABS_API_KEY: ${elevenResult.error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
