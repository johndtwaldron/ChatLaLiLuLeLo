// apps/mobile/src/debug/quietRNW.ts
/* Dev-only: squelch RNW's View "Unexpected text node" spam while we clean it up */
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  const origError = console.error;
  console.error = function (...args: any[]) {
    const msg = args?.[0];
    if (typeof msg === 'string' && msg.startsWith('Unexpected text node: ')) {
      // comment the next line in if you want a single breadcrumb instead of silence:
      // console.warn('[RNW RAW TEXT] (silenced) ->', args[0]);
      return;
    }
    return (origError as any).apply(this, args);
  };
}
