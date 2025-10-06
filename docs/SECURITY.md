# ChatLaLiLuLeLo Security System

## Overview

This document describes the comprehensive security hardening implemented in ChatLaLiLuLeLo (v4-005) to protect against various security threats including prompt injection, XSS attacks, CSRF, and other common vulnerabilities.

## Security Architecture

### Multi-Layer Defense

The security system implements defense-in-depth with multiple layers:

1. **Client-Side Validation** (Frontend)
2. **Server-Side Sanitization** (Backend API)
3. **Content Security Policy** (Web Deployment)
4. **Rate Limiting & Budget Controls**
5. **Security Headers** (HTTP Layer)

## Frontend Security (Mobile App)

### Location: `apps/mobile/src/lib/security.ts`

#### Input Validation

- **Length Limits**: 2,000 characters max, 20 lines max
- **Control Characters**: Detection and removal of dangerous Unicode
- **Suspicious Patterns**: Warning system for potential prompt injection
- **Character Repetition**: Cleanup of excessive repeated characters
- **Real-time Feedback**: User-friendly warnings and error messages

#### Safe Error Handling

```typescript
// Safe error messages that don't reveal security details
export const SAFE_ERROR_MESSAGES = {
  INVALID_INPUT: 'Please check your message and try again',
  MESSAGE_TOO_LONG: 'Message is too long, please shorten it',
  RATE_LIMITED: 'Please wait a moment before sending another message',
  // ...
} as const;
```

#### Implementation

The TextInput component uses `validateMessageForSubmission()` to:
- Pre-validate user input before sending
- Provide immediate feedback to users
- Sanitize messages client-side
- Display security warnings when appropriate

## Backend Security (Edge API)

### Location: `apps/edge/lib/security.ts`

#### Prompt Injection Detection

Advanced pattern matching for common prompt injection attempts:

```typescript
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?previous\s+instructions?/i,
  /disregard\s+(?:the\s+)?above/i,
  /forget\s+everything/i,
  /system\s*:\s*you\s+are/i,
  // ... more patterns
];
```

#### Input Sanitization

- **HTML Tag Removal**: Strips all HTML/XML tags
- **Control Character Filtering**: Removes dangerous Unicode characters
- **Length Validation**: Enforces 5,000 character limit
- **Unicode Normalization**: Handles suspicious Unicode patterns
- **Whitespace Cleanup**: Normalizes spacing and line breaks

#### Security Logging

```typescript
export function logSecurityEvent(
  event: 'blocked' | 'warning' | 'suspicious',
  details: SecurityEventDetails,
  clientIP?: string
): void {
  // Structured logging for security monitoring
  console.warn('[SECURITY]', {
    timestamp: new Date().toISOString(),
    event,
    clientIP: clientIP || 'unknown',
    ...details
  });
}
```

## Content Security Policy (CSP)

### GitHub Pages Deployment

The GitHub Actions workflow (`.github/workflows/pages.yml`) automatically injects security headers:

```bash
# Security headers injected during build
SECURITY_HEADERS_META='
<meta http-equiv="Content-Security-Policy" content="default-src '\''self'\'' https: data:; script-src '\''self'\'' '\''unsafe-inline'\'' '\''unsafe-eval'\'' https: data:; style-src '\''self'\'' '\''unsafe-inline'\'' https: data:; img-src '\''self'\'' https: data: blob:; font-src '\''self'\'' https: data:; connect-src '\''self'\'' https: wss: ws:; media-src '\''self'\'' https: data: blob:; object-src '\''none'\'' frame-src '\''none'\''">
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="X-Frame-Options" content="DENY">
<meta http-equiv="X-XSS-Protection" content="1; mode=block">
<meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
<meta http-equiv="Permissions-Policy" content="geolocation=(), camera=(), microphone=(), payment=(), usb=(), vr=(), accelerometer=(), gyroscope=(), magnetometer=(), fullscreen=(self)">
'
```

### Security Headers

- **Content-Security-Policy**: Prevents XSS and code injection
- **X-Content-Type-Options**: Prevents MIME sniffing attacks
- **X-Frame-Options**: Prevents clickjacking
- **X-XSS-Protection**: Browser XSS filter activation
- **Referrer-Policy**: Controls referrer information leakage
- **Permissions-Policy**: Restricts browser API access

## API Integration

### Chat Endpoint Security

The `/chat` endpoint implements comprehensive security:

```typescript
// Security validation in apps/edge/api/chat.ts
for (const message of messages) {
  if (message.role === 'user') {
    const securityResult = validateAndSanitizeInput(message.content, clientIP);
    
    if (securityResult.blocked) {
      logWarning('Security validation blocked message', {
        requestId,
        reason: securityResult.reason,
        warnings: securityResult.warnings,
        clientIP,
        sessionId: client.sessionId
      });
      
      return new Response(JSON.stringify({
        error: SAFE_ERROR_MESSAGES[errorKey],
        reason: 'security_violation'
      }), { status: 400 });
    }
  }
}
```

## Rate Limiting & Budget Protection

### Existing Rate Limiter Integration

The security system works alongside the existing rate limiting:

- **Request Rate Limits**: Prevents API abuse
- **Token Budget Limits**: Controls OpenAI usage costs  
- **Session Limits**: Per-session usage tracking
- **Message Length Limits**: Prevents oversized requests

### Combined Protection

Security validation occurs **before** rate limiting to:
1. Block malicious requests early
2. Prevent resource waste on bad requests
3. Log security events for monitoring
4. Provide appropriate user feedback

## Testing Suite

### Comprehensive Test Coverage

#### Backend Tests: `apps/edge/lib/__tests__/security.test.ts`
- Prompt injection detection (15+ test cases)
- Input sanitization and validation
- Control character handling
- HTML/XSS prevention
- Performance and edge cases

#### Frontend Tests: `apps/mobile/src/lib/__tests__/security.test.ts`
- Client-side validation logic
- Error message handling
- User feedback formatting
- Performance optimization
- Cross-platform compatibility

#### Integration Tests: `tests/security-integration.test.ts`
- End-to-end security flow
- Frontend ↔ Backend consistency
- API endpoint security
- Error handling coordination
- Load testing under security constraints

### Running Security Tests

```bash
# Run all security tests
npm run test:security

# Run with coverage
npm run test:security -- --coverage

# Run specific test suite
npx vitest run apps/edge/lib/__tests__/security.test.ts
```

## Security Configuration

### Environment Variables

```bash
# Production environment
NODE_ENV=production
SECURITY_LEVEL=strict

# Development environment (more permissive CSP)
NODE_ENV=development
SECURITY_LEVEL=development
```

### Feature Flags

The security system includes configurable threat detection:

```typescript
// Configurable security levels
export const SECURITY_CONFIG = {
  strictMode: process.env.NODE_ENV === 'production',
  promptInjectionThreshold: 0.8,
  maxWarningsBeforeBlock: 3,
  enableAdvancedDetection: true,
};
```

## Monitoring & Alerting

### Security Event Logging

All security events are logged with structured data:

```typescript
// Example log entry
{
  timestamp: "2024-01-15T10:30:45.123Z",
  level: "WARN",
  event: "blocked",
  reason: "prompt_injection",
  clientIP: "192.168.1.100",
  sessionId: "chatlali-1704362445123",
  requestId: "req_abc123",
  pattern: "ignore previous instructions",
  sanitized: "hello world"
}
```

### Metrics Tracking

- Blocked request rates
- Security warning frequencies
- Pattern detection accuracy
- Performance impact measurements

## Development Guidelines

### Adding New Security Rules

1. **Define the Pattern**: Add to appropriate pattern arrays
2. **Implement Detection**: Update validation functions
3. **Add Tests**: Include comprehensive test cases
4. **Update Documentation**: Document the new rule
5. **Performance Test**: Ensure no significant impact

### Safe Error Messages

Always use the provided `SAFE_ERROR_MESSAGES` constants:

```typescript
// ✅ Good - Safe error message
return { error: SAFE_ERROR_MESSAGES.INVALID_INPUT };

// ❌ Bad - Reveals security details
return { error: 'Blocked due to prompt injection pattern match' };
```

### Testing Security Changes

1. Run the full security test suite
2. Test with real prompt injection attempts
3. Verify performance impact is minimal
4. Check that legitimate use cases still work
5. Validate error messages are user-friendly

## Deployment Checklist

### Before Deployment

- [ ] All security tests passing
- [ ] Performance benchmarks met
- [ ] Security headers properly configured
- [ ] CSP policy tested and working
- [ ] Rate limiting integration verified
- [ ] Error messages reviewed for safety
- [ ] Logging configuration validated

### Production Monitoring

- [ ] Security event logs are being captured
- [ ] Alert thresholds configured
- [ ] Performance metrics baseline established
- [ ] User experience impact assessed
- [ ] False positive rates monitored

## Known Limitations

### Current Scope

- **Client-side validation is advisory**: Final security decisions are made server-side
- **Pattern-based detection**: May have false positives with legitimate content
- **Performance vs Security trade-off**: Some checks impact response times
- **English-focused patterns**: May need adjustment for other languages

### Future Improvements

- Machine learning-based threat detection
- Dynamic pattern updates
- Enhanced Unicode handling
- Real-time threat intelligence integration
- Advanced behavioral analysis

## Security Contact

For security-related issues:
- Create a GitHub issue with the `security` label
- Include steps to reproduce (if safe to disclose)
- Do not include actual exploit payloads in public issues

## Compliance

This implementation follows:
- **OWASP Top 10** security guidelines
- **CWE (Common Weakness Enumeration)** recommendations  
- **NIST Cybersecurity Framework** principles
- **React/React Native** security best practices
- **API Security** standards

---

*Last Updated: January 2024*
*Security System Version: v4-005*
