export interface LogContext {
  requestId?: string;
  mode?: string;
  sessionId?: string;
  appVersion?: string;
  timestamp?: number;
}

export function logInfo(message: string, context?: LogContext) {
  const logEntry = {
    level: 'INFO',
    message,
    timestamp: Date.now(),
    ...context
  };
  console.log(JSON.stringify(logEntry));
}

export function logError(message: string, error?: Error, context?: LogContext) {
  const logEntry = {
    level: 'ERROR',
    message,
    error: error?.message,
    stack: error?.stack?.split('\n').slice(0, 3), // Limit stack trace
    timestamp: Date.now(),
    ...context
  };
  console.error(JSON.stringify(logEntry));
}

export function logWarning(message: string, context?: LogContext) {
  const logEntry = {
    level: 'WARN',
    message,
    timestamp: Date.now(),
    ...context
  };
  console.warn(JSON.stringify(logEntry));
}

// Redact sensitive information
export function redactApiKey(key?: string): string {
  if (!key) return 'none';
  return key.slice(0, 8) + '***' + key.slice(-4);
}

export function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15);
}
