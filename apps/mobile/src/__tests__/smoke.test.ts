describe('Smoke Test', () => {
  it('should run basic Jest test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have codecTheme defined', () => {
    const { codecTheme } = require('../lib/theme');
    expect(codecTheme).toBeDefined();
    expect(codecTheme.colors.primary).toBe('#00FF00');
  });
});
