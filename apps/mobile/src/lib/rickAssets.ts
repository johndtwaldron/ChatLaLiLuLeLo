/**
 * Rick Mode Assets Loader
 * 
 * Complete collection of Rick/Bogart/Casablanca assets.
 * All 16 images (jpg/jpeg/png/gif/avif) and all 54 audio clips.
 * Simple module-level cycling with getNextRickImage() and getNextRickAudio().
 */

import { asImg, asAudio } from './asset';

// ALL 16 Rick images - jpg, png, gif, avif formats
const RICK_IMAGES = [
  asImg(require('../../assets/Rick.images/7vai8uwrs1v11.jpg')),
  asImg(require('../../assets/Rick.images/bogart-humphrey-bogart.gif')),
  asImg(require('../../assets/Rick.images/casablanca-fighting.gif')),
  asImg(require('../../assets/Rick.images/casablanca-heres-looking-at-you-kid.gif')),
  asImg(require('../../assets/Rick.images/casablanca-rick.gif')),
  asImg(require('../../assets/Rick.images/for-a-price-rick-blaine.png')),
  asImg(require('../../assets/Rick.images/frustrated-angry.gif')),
  asImg(require('../../assets/Rick.images/humphrey-bogart-smoking-a-cigarette-in-casablanca.avif')),
  asImg(require('../../assets/Rick.images/humphrey-bogart.avif')),
  asImg(require('../../assets/Rick.images/i\'m-not-fighting-for-anything-anymore-except-myself-rick-blaine.gif')),
  asImg(require('../../assets/Rick.images/nobody-ever-loved-me-that-much-rick-blaine.gif')),
  asImg(require('../../assets/Rick.images/of-all-the-gin-joints-in-all-the-world-she-walks-into-mine-rick-blaine.gif')),
  asImg(require('../../assets/Rick.images/Rick.Cigarette.jpg')),
  asImg(require('../../assets/Rick.images/RickBlaine.jpg')),
  asImg(require('../../assets/Rick.images/we-will-always-have-paris-classic.gif')),
  asImg(require('../../assets/Rick.images/you\'d-be-doing-me-a-favor-rick-blaine.gif')),
];

// ALL 54 Rick audio clips - wrapped with asAudio for web compatibility
const RICK_AUDIO = [
  asAudio(require('../../assets/rick.audio/all-right-at-a-quarter-to-5.mp3')),
  asAudio(require('../../assets/rick.audio/all-right-i-will.mp3')),
  asAudio(require('../../assets/rick.audio/and-every-time-you-send-my-shipment-over-it\'s-always-just-a-little-bit-short.mp3')),
  asAudio(require('../../assets/rick.audio/and-got-well-paid-for-it-on-both-occasions.mp3')),
  asAudio(require('../../assets/rick.audio/and-that-ll-give-you-grounds-to-make-the-arrest.mp3')),
  asAudio(require('../../assets/rick.audio/and-the-names-are-mr-and-mrs-victor-laszlo.mp3')),
  asAudio(require('../../assets/rick.audio/band-playing.mp3')),
  asAudio(require('../../assets/rick.audio/but-i-will-if-you-take-one-more-step.mp3')),
  asAudio(require('../../assets/rick.audio/go-ahead-and-shoot-you\'ll-be-doing-me-a-favor.mp3')),
  asAudio(require('../../assets/rick.audio/have-a-drink.mp3')),
  asAudio(require('../../assets/rick.audio/he-s-succeeded-in-impressing-half-the-world.mp3')),
  asAudio(require('../../assets/rick.audio/here-here-drink-up-we\'ll-never-finish-the-other-three.mp3')),
  asAudio(require('../../assets/rick.audio/here-s-looking-at-you-kid (1).mp3')),
  asAudio(require('../../assets/rick.audio/here-s-looking-at-you-kid.mp3')),
  asAudio(require('../../assets/rick.audio/i-am-a-little-more-impressed-with-you.mp3')),
  asAudio(require('../../assets/rick.audio/i-bet-they\'re-asleep-in-new-york-i-bet-they\'re-asleep-all-over-america.mp3')),
  asAudio(require('../../assets/rick.audio/i-m-a-saloonkeeper.mp3')),
  asAudio(require('../../assets/rick.audio/i-stick-my-neck-out-for-nobody.mp3')),
  asAudio(require('../../assets/rick.audio/i-wouldn\'t-believe-you-no-matter-what-you-told-me-you\'d-say-anything-now-to-get-what-you-want.mp3')),
  asAudio(require('../../assets/rick.audio/i\'m-no-good-at-being-noble-but-it-doesn\'t-take-much-to-see-that-the-problems-of-three-little-people-don\'t-amount-to-a-hill-of-beans-in-this-crazy-world.mp3')),
  asAudio(require('../../assets/rick.audio/i\'m-not-fighting-for-anything-anymore-except-myself-i\'m-the-only-cause-i\'m-interested-in.mp3')),
  asAudio(require('../../assets/rick.audio/i\'m-not-interested-in-politics-the-problems-of-the-world-are-not-in-my-department.mp3')),
  asAudio(require('../../assets/rick.audio/i\'m-sorry-for-asking-i-forgot-we-said-no-questions.mp3')),
  asAudio(require('../../assets/rick.audio/i\'m-sorry-there-was-a-disturbance-folks-but-it\'s-all-over-now-everything\'s-all-right.mp3')),
  asAudio(require('../../assets/rick.audio/if-i-gave-you-any-thought-i-probably-would-humphrey-bogart-insult-not-worth-thinking-about.mp3')),
  asAudio(require('../../assets/rick.audio/if-she-can-stand-it-i-can-play-it.mp3')),
  asAudio(require('../../assets/rick.audio/if-that-plane-leaves-and-you\'re-not-with-him-you\'ll-regret-it-maybe-not-today-maybe-not-tomorrow-but-soon-and-for-the-rest-of-your-life.mp3')),
  asAudio(require('../../assets/rick.audio/it-s-the-new-german-77th-and-judging-by-the-sound-only-about-35-miles-away.mp3')),
  asAudio(require('../../assets/rick.audio/it\'s-funny-about-your-voice-how-it-hasn\'t-changed-i-can-still-hear-it.mp3')),
  asAudio(require('../../assets/rick.audio/just-a-moment.mp3')),
  asAudio(require('../../assets/rick.audio/just-like-any-other-man-only-more-so.mp3')),
  asAudio(require('../../assets/rick.audio/louis-i-think-this-is-the-beginning-of-a-beautiful-friendship.mp3')),
  asAudio(require('../../assets/rick.audio/nobody-ever-loved-me-that-much.mp3')),
  asAudio(require('../../assets/rick.audio/of-all-the-gin-joints-in-all-the-towns-in-all-the-world-she-walks-into-mine.mp3')),
  asAudio(require('../../assets/rick.audio/sam-i-thought-i-told-you-never-to-play.mp3')),
  asAudio(require('../../assets/rick.audio/then-release-him.mp3')),
  asAudio(require('../../assets/rick.audio/voice_preview_rick.11.v1.mp3')),
  asAudio(require('../../assets/rick.audio/we-ll-get-on-a-train-and-never-stop-don-t-rick.mp3')),
  asAudio(require('../../assets/rick.audio/well-you-can-tell-me-now-i-m-reasonably-sober.mp3')),
  asAudio(require('../../assets/rick.audio/what-i-ve-got-to-do-you-can-t-be-any-part-of.mp3')),
  asAudio(require('../../assets/rick.audio/what-makes-you-think-i-d-stick-my-neck-out-for-laszlo.mp3')),
  asAudio(require('../../assets/rick.audio/what-of-it (1).mp3')),
  asAudio(require('../../assets/rick.audio/what-of-it-i\'m-going-to-die-in-casablanca-it\'s-a-good-spot-for-it.mp3')),
  asAudio(require('../../assets/rick.audio/what-of-it-then-it-ll-be-out-of-its-misery.mp3')),
  asAudio(require('../../assets/rick.audio/what-of-it.mp3')),
  asAudio(require('../../assets/rick.audio/where-i\'m-going-you-can\'t-follow-what-i\'ve-got-to-do-you-can\'t-be-any-part-of.mp3')),
  asAudio(require('../../assets/rick.audio/where-were-you-last-night-that\'s-so-long-ago-i-don\'t-remember.mp3')),
  asAudio(require('../../assets/rick.audio/yes-i-found-that-a-very-expensive-hobby-too-but-then-i-never-was-much-of-a-businessman.mp3')),
  asAudio(require('../../assets/rick.audio/yes-i-guess-it-is-too-far-ahead.mp3')),
  asAudio(require('../../assets/rick.audio/you-seem-to-know-all-about-my-destiny.mp3')),
  asAudio(require('../../assets/rick.audio/you-want-my-advice-oh-yes-please-go-back-to-bulgaria.mp3')),
  asAudio(require('../../assets/rick.audio/you\'re-not-very-subtle-but-you-are-effective-i-get-the-point.mp3')),
  asAudio(require('../../assets/rick.audio/your-cash-is-good-at-the-bar.mp3')),
  asAudio(require('../../assets/rick.audio/your-story-had-me-a-little-confused-or-maybe-it-was-the-bourbon.mp3')),
];

// Module-level cycling indices
let currentImageIndex = 0;
let currentAudioIndex = 0;

/**
 * Get next Rick image (cycles through all 16)
 */
export function getNextRickImage(): any {
  if (RICK_IMAGES.length === 0) {
    console.warn('[RICK] No images available');
    return null;
  }
  const image = RICK_IMAGES[currentImageIndex];
  currentImageIndex = (currentImageIndex + 1) % RICK_IMAGES.length;
  console.log(`[RICK] Image ${currentImageIndex}/${RICK_IMAGES.length}`);
  return image;
}

/**
 * Get next Rick audio URL (cycles through all 54)
 * Returns string URL compatible with Audio API
 */
export function getNextRickAudio(): string | null {
  if (RICK_AUDIO.length === 0) {
    console.warn('[RICK] No audio available');
    return null;
  }
  const audio = RICK_AUDIO[currentAudioIndex];
  currentAudioIndex = (currentAudioIndex + 1) % RICK_AUDIO.length;
  console.log(`[RICK] Audio ${currentAudioIndex}/${RICK_AUDIO.length}`);
  
  // Extract URL string from asset (asAudio returns string on web)
  if (typeof audio === 'string') {
    console.log('[RICK] Returning audio URL string:', audio);
    return audio;
  }
  
  // Handle asset object format (native/dev)
  if ((audio as any)?.uri) {
    console.log('[RICK] Returning audio from uri property:', (audio as any).uri);
    return (audio as any).uri;
  }
  
  if ((audio as any)?.default) {
    console.log('[RICK] Returning audio from default property:', (audio as any).default);
    return (audio as any).default;
  }
  
  console.warn('[RICK] Unknown audio asset format', audio);
  return null;
}

/**
 * Get current Rick image without advancing
 */
export function getCurrentRickImage(): any {
  if (RICK_IMAGES.length === 0) return null;
  return RICK_IMAGES[currentImageIndex];
}

/**
 * Reset cycling indices
 */
export function resetRickAssets(): void {
  currentImageIndex = 0;
  currentAudioIndex = 0;
  console.log('[RICK] Assets reset');
}

/**
 * Get total asset counts
 */
export function getRickAssetCounts(): { images: number; audio: number } {
  return {
    images: RICK_IMAGES.length,
    audio: RICK_AUDIO.length,
  };
}
