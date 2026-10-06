/**
 * Secret Commands Engine
 * 
 * Intercepts special chat commands before they reach the backend.
 * MVP: Video playback commands for Casablanca clips.
 */

export type SecretCommandResult =
  | { handled: false }
  | {
      handled: true;
      action: 'play_video';
      videoPath: string;
      localAssistantText?: string;
    };

export interface SecretCommandContext {
  rawInput: string;
  uiMode: string; // 'haywire' | 'jd' | 'lore' | 'bitcoin' | 'rick'
}

/**
 * Main entry point for secret command handling
 */
export function handleSecretCommand(
  ctx: SecretCommandContext
): SecretCommandResult {
  const text = ctx.rawInput.trim();
  
  // IMPORTANT: Video commands only work in Rick mode
  if (ctx.uiMode !== 'rick') {
    return { handled: false };
  }
  
  // Pattern 1: PLAY IT AGAIN SAM (exact phrase) - Rick mode only
  if (/^play\s+it\s+again\s+sam$/i.test(text)) {
    return {
      handled: true,
      action: 'play_video',
      videoPath: '/videos/Play It Again, Sam.mp4',
      localAssistantText: getVideoQuip(ctx.uiMode, 'play_it_again_sam'),
    };
  }
  
  // Pattern 2: PLAY CASABLANCA - Rick mode only
  if (/^play\s+casablanca$/i.test(text)) {
    return {
      handled: true,
      action: 'play_video',
      videoPath: '/videos/Casablanca-001.mp4',
      localAssistantText: getVideoQuip(ctx.uiMode, 'casablanca'),
    };
  }
  
  // Not a secret command
  return { handled: false };
}

/**
 * Get mode-specific quips for video playback
 */
function getVideoQuip(uiMode: string, videoId: string): string {
  if (videoId === 'play_it_again_sam') {
    switch (uiMode) {
      case 'rick':
        return `You know she never actually says it like that. But the myth sells drinks.`;
      case 'bitcoin':
        return `Classic scene. Some things retain value across time.`;
      case 'haywire':
        return `Reality fragmentation detected. Playing archived cultural memory.`;
      default:
        return `Of all the gin joints in all the towns...`;
    }
  }
  
  if (videoId === 'casablanca') {
    switch (uiMode) {
      case 'rick':
        return `Here's looking at you, kid.`;
      case 'bitcoin':
        return `A timeless masterpiece. Like sound money.`;
      case 'haywire':
        return `Loading cultural artifact from consensus reality layer...`;
      default:
        return `Round up the usual suspects.`;
    }
  }
  
  return `Secret command acknowledged.`;
}
