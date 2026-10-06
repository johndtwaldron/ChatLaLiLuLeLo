import { recordSessionLog, redactLog, sessionLogText, downloadSessionLogs, sessionLogSource } from '../sessionLogs';

describe('instance log export', () => {
  it('labels local and Pages origins without leaking URL parameters', () => {
    expect(sessionLogSource().environment).toBe('local');
    expect(sessionLogText()).toContain('Environment: local');
    expect(sessionLogText()).toContain('Origin: http://localhost');
  });
  it('redacts credentials, emails and Google photo URLs', () => {
    const text = redactLog('Bearer abc123 api_key=secret-value\neyJheader.eyJclaims.signature sk-proj-12345 john@example.com https://lh3.googleusercontent.com/private-photo');
    for (const secret of ['abc123', 'secret-value', 'eyJheader', 'sk-proj-12345', 'john@example.com', 'private-photo']) expect(text).not.toContain(secret);
  });
  it('redacts structured keys and handles circular objects', () => {
    const circular: any = {}; circular.self = circular;
    recordSessionLog('warn', { credential: 'private-token', useful: 'photo failed' }, circular);
    const output = sessionLogText();
    expect(output).toContain('photo failed');
    expect(output).not.toContain('private-token');
    expect(output).toContain('[unserializable value]');
  });
  it('bounds logs and reports discarded older entries', () => {
    recordSessionLog('info', 'old-marker');
    for (let i = 0; i < 1002; i++) recordSessionLog('info', `entry-${i}`);
    const output = sessionLogText();
    expect(output).not.toContain('old-marker');
    expect(output).toContain('Retained: 1000');
    expect(output).toContain('entry-1001');
  });
  it('downloads a text file using a temporary object URL', () => {
    const create = jest.fn(() => 'blob:test');
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: create });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: jest.fn() });
    jest.useFakeTimers();
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      expect(this.download).toMatch(/^codec-logs-local-.+\.txt$/);
      expect(this.href).toBe('blob:test');
    });
    downloadSessionLogs();
    expect(create.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect(document.querySelector('a[download]')).toBeNull();
    jest.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
    click.mockRestore(); jest.useRealTimers();
  });
});
