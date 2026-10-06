// Bounded, in-memory diagnostics for this page instance. Never stores credentials.
const startedAt = new Date().toISOString();
const instanceId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const entries: string[] = [];
const LIMIT = 1000;
let dropped = 0;
let installed = false;

export function redactLog(value: string): string {
  return value
    .replace(/\beyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[REDACTED TOKEN]')
    .replace(/\b(?:sk|sk-proj|sk-ant)-[\w-]+/g, '[REDACTED KEY]')
    .replace(/((?:api[_-]?key|authorization|credential|access[_-]?token|refresh[_-]?token|id[_-]?token|password|secret|cookie)\s*["']?\s*[:=]\s*)[^,\n}]+/gi, '$1[REDACTED]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replace(/https:\/\/[^\s"']*googleusercontent\.com[^\s"']*/gi, '[GOOGLE PHOTO URL]')
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[EMAIL]');
}

function format(value: unknown): string {
  try {
    if (value instanceof Error) return `${value.name}: ${value.message}\n${value.stack || ''}`;
    if (typeof value === 'string') return value;
    return JSON.stringify(value, (key, next) => /api.?key|token|credential|password|secret|cookie|authorization/i.test(key) ? '[REDACTED]' : next) ?? String(value);
  } catch { return '[unserializable value]'; }
}

export function recordSessionLog(level: string, ...values: unknown[]): void {
  const text = redactLog(values.map(format).join(' ')).slice(0, 3000);
  entries.push(`${new Date().toISOString()} [${level.toUpperCase()}] ${text}`);
  if (entries.length > LIMIT) { entries.shift(); dropped++; }
}

export function installSessionLogs(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  for (const level of ['log', 'info', 'warn', 'error', 'debug'] as const) {
    const original = console[level].bind(console);
    console[level] = (...values: unknown[]) => { recordSessionLog(level, ...values); original(...values); };
  }
  window.addEventListener('error', event => recordSessionLog('error', event.error || event.message));
  window.addEventListener('unhandledrejection', event => recordSessionLog('error', event.reason));
  recordSessionLog('info', 'Codec page instance started');
}

export function sessionLogText(): string {
  return `ChatLaLiLuLeLo instance diagnostics\nInstance: ${instanceId}\nStarted: ${startedAt}\nExported: ${new Date().toISOString()}\nRetained: ${entries.length}; dropped older entries: ${dropped}\nConsole logs can contain conversation text. Review before sharing.\n\n${entries.join('\n')}\n`;
}

export function downloadSessionLogs(): void {
  const url = URL.createObjectURL(new Blob([sessionLogText()], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `codec-logs-${instanceId}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

installSessionLogs();
