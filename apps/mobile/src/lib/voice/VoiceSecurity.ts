/**
 * Voice Security Module
 * 
 * Provides security validation and sanitization for TTS input text.
 * Prevents injection attacks, filters malicious content, and sanitizes SSML.
 */

import { validateUserInput, SecurityValidationResult } from '../security';

export interface VoiceSecurityResult {
  isValid: boolean;
  sanitizedText: string;
  warnings: string[];
  errorMessage?: string;
  originalLength: number;
  sanitizedLength: number;
}

// TTS-specific security constants
const MAX_TTS_LENGTH = 4000; // Most TTS APIs have character limits
const MAX_TTS_LINES = 50; // Prevent abuse through excessive lines
const MIN_TTS_LENGTH = 1; // Must have at least some content

// SSML security patterns
const DANGEROUS_SSML_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, // Iframe tags
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, // Object tags
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, // Embed tags
  /javascript:/gi, // JavaScript URLs
  /data:(?!audio|image)/gi, // Data URLs (except safe media types)
  /vbscript:/gi, // VBScript URLs
  /file:/gi, // File URLs
  /about:/gi, // About URLs
];

// Allowed SSML tags (basic subset for safety)
const ALLOWED_SSML_TAGS = [
  'speak', 'p', 'break', 'emphasis', 'prosody', 
  'say-as', 'phoneme', 'sub', 's'
];

// Allowed SSML attributes with validation
const ALLOWED_SSML_ATTRIBUTES: Record<string, string[]> = {
  'break': ['time', 'strength'],
  'emphasis': ['level'],
  'prosody': ['rate', 'pitch', 'volume'],
  'say-as': ['interpret-as', 'format'],
  'phoneme': ['alphabet', 'ph'],
  'sub': ['alias'],
  'speak': ['version', 'xml:lang']
};

/**
 * Comprehensive TTS text validation and sanitization
 */
export function validateTTSInput(
  text: string, 
  options?: {
    allowSSML?: boolean;
    maxLength?: number;
    engineSpecific?: string; // 'openai' | 'elevenlabs' | 'coqui'
  }
): VoiceSecurityResult {
  const originalLength = text.length;
  const warnings: string[] = [];
  
  // Basic validation using existing security module
  const basicValidation = validateUserInput(text);
  let sanitized = basicValidation.sanitized;
  
  // Start with basic validation warnings
  warnings.push(...basicValidation.warnings);
  
  if (!basicValidation.isValid) {
    return {
      isValid: false,
      sanitizedText: sanitized,
      warnings: warnings,
      errorMessage: basicValidation.errorMessage,
      originalLength,
      sanitizedLength: sanitized.length
    };
  }
  
  // TTS-specific length validation
  const maxLength = options?.maxLength || MAX_TTS_LENGTH;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
    warnings.push(`Text truncated to ${maxLength} characters for TTS`);
  }
  
  if (sanitized.length < MIN_TTS_LENGTH) {
    return {
      isValid: false,
      sanitizedText: sanitized,
      warnings: warnings,
      errorMessage: 'Text too short for TTS synthesis',
      originalLength,
      sanitizedLength: sanitized.length
    };
  }
  
  // Check line count
  const lines = sanitized.split('\n');
  if (lines.length > MAX_TTS_LINES) {
    sanitized = lines.slice(0, MAX_TTS_LINES).join('\n');
    warnings.push(`Text limited to ${MAX_TTS_LINES} lines for TTS`);
  }
  
  // SSML processing
  if (options?.allowSSML && containsSSML(sanitized)) {
    const ssmlResult = sanitizeSSML(sanitized);
    sanitized = ssmlResult.sanitized;
    warnings.push(...ssmlResult.warnings);
    
    if (!ssmlResult.isValid) {
      return {
        isValid: false,
        sanitizedText: sanitized,
        warnings: warnings,
        errorMessage: 'SSML content rejected for security reasons',
        originalLength,
        sanitizedLength: sanitized.length
      };
    }
  } else if (containsSSML(sanitized)) {
    // Strip SSML if not allowed
    sanitized = stripSSML(sanitized);
    warnings.push('SSML tags removed (SSML not enabled)');
  }
  
  // Engine-specific sanitization
  sanitized = applyEngineSpecificSanitization(sanitized, options?.engineSpecific);
  
  // Final cleanup
  sanitized = finalCleanup(sanitized);
  
  return {
    isValid: true,
    sanitizedText: sanitized,
    warnings: warnings,
    originalLength,
    sanitizedLength: sanitized.length
  };
}

/**
 * Check if text contains SSML markup
 */
function containsSSML(text: string): boolean {
  return /<[^>]+>/g.test(text);
}

/**
 * Sanitize SSML content for security
 */
function sanitizeSSML(text: string): { isValid: boolean; sanitized: string; warnings: string[] } {
  const warnings: string[] = [];
  let sanitized = text;
  
  // Check for dangerous patterns first
  for (const pattern of DANGEROUS_SSML_PATTERNS) {
    if (pattern.test(sanitized)) {
      return {
        isValid: false,
        sanitized: stripSSML(sanitized),
        warnings: ['Dangerous content detected in SSML']
      };
    }
  }
  
  // Parse and validate SSML tags
  const tagRegex = /<(\/?)([\w-]+)([^>]*)>/g;
  let match;
  const tagStack: string[] = [];
  
  while ((match = tagRegex.exec(sanitized)) !== null) {
    const [fullMatch, isClosing, tagName, attributes] = match;
    const isClosingTag = isClosing === '/';
    
    // Check if tag is allowed
    if (!ALLOWED_SSML_TAGS.includes(tagName.toLowerCase())) {
      sanitized = sanitized.replace(fullMatch, '');
      warnings.push(`Removed unsupported SSML tag: ${tagName}`);
      continue;
    }
    
    if (isClosingTag) {
      // Validate closing tag matches opening tag
      const lastTag = tagStack.pop();
      if (lastTag !== tagName.toLowerCase()) {
        warnings.push(`Mismatched SSML closing tag: ${tagName}`);
      }
    } else {
      // Validate opening tag and attributes
      tagStack.push(tagName.toLowerCase());
      
      const allowedAttrs = ALLOWED_SSML_ATTRIBUTES[tagName.toLowerCase()] || [];
      const sanitizedAttrs = sanitizeSSMLAttributes(attributes, allowedAttrs);
      
      if (sanitizedAttrs !== attributes) {
        const newTag = `<${tagName}${sanitizedAttrs}>`;
        sanitized = sanitized.replace(fullMatch, newTag);
        warnings.push(`Sanitized attributes for SSML tag: ${tagName}`);
      }
    }
  }
  
  // Check for unclosed tags
  if (tagStack.length > 0) {
    warnings.push(`Unclosed SSML tags detected: ${tagStack.join(', ')}`);
  }
  
  return {
    isValid: true,
    sanitized,
    warnings
  };
}

/**
 * Sanitize SSML attributes
 */
function sanitizeSSMLAttributes(attributes: string, allowedAttrs: string[]): string {
  if (!attributes.trim()) return '';
  
  const attrRegex = /(\w+)=["']([^"']*)["']/g;
  const sanitizedAttrs: string[] = [];
  let match;
  
  while ((match = attrRegex.exec(attributes)) !== null) {
    const [, attrName, attrValue] = match;
    
    if (allowedAttrs.includes(attrName.toLowerCase())) {
      // Basic attribute value sanitization
      const cleanValue = attrValue
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:|data:|file:/gi, '') // Remove dangerous URLs
        .trim();
      
      if (cleanValue) {
        sanitizedAttrs.push(`${attrName}="${cleanValue}"`);
      }
    }
  }
  
  return sanitizedAttrs.length > 0 ? ' ' + sanitizedAttrs.join(' ') : '';
}

/**
 * Strip all SSML tags from text
 */
function stripSSML(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}

/**
 * Apply engine-specific text sanitization
 */
function applyEngineSpecificSanitization(text: string, engine?: string): string {
  switch (engine?.toLowerCase()) {
    case 'openai':
      // OpenAI TTS specific cleaning
      return text
        .replace(/[^\w\s.,!?;:()\-'"]/g, '') // Conservative character set
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    
    case 'elevenlabs':
      // ElevenLabs specific cleaning
      return text
        .replace(/[^\w\s.,!?;:()\-'"…–—]/g, '') // Slightly more permissive
        .replace(/\s+/g, ' ')
        .trim();
    
    case 'coqui':
      // Coqui/local TTS specific cleaning
      return text
        .replace(/[^\w\s.,!?;:()\-'"]/g, '') // Basic cleaning
        .replace(/\s+/g, ' ')
        .trim();
    
    default:
      // Generic cleaning
      return text
        .replace(/[^\w\s.,!?;:()\-'"]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
  }
}

/**
 * Final cleanup pass
 */
function finalCleanup(text: string): string {
  return text
    .trim()
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
    .replace(/\s{2,}/g, ' ') // Remove excessive spaces
    .replace(/[.]{4,}/g, '...') // Normalize ellipsis
    .replace(/[!]{2,}/g, '!') // Normalize exclamations
    .replace(/[?]{2,}/g, '?'); // Normalize questions
}

/**
 * Validate text length for specific TTS engine
 */
export function getMaxLengthForEngine(engine: string): number {
  switch (engine.toLowerCase()) {
    case 'openai':
      return 4000; // OpenAI TTS limit
    case 'elevenlabs':
      return 5000; // ElevenLabs limit
    case 'coqui':
      return 1000; // Conservative limit for local TTS
    default:
      return MAX_TTS_LENGTH;
  }
}

/**
 * Quick security check for TTS text
 */
export function quickTTSSecurityCheck(text: string): boolean {
  // Quick checks for obviously dangerous content
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /<iframe/i,
    /data:(?!audio|image)/i,
    /file:/i
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(text));
}

/**
 * Format security warnings for user display
 */
export function formatVoiceSecurityWarnings(warnings: string[]): string {
  if (warnings.length === 0) return '';
  
  if (warnings.length === 1) {
    return `🔊 Voice Warning: ${warnings[0]}`;
  }
  
  return `🔊 Voice Warnings: ${warnings.join(', ')}`;
}
