# Rick Mode Implementation Specification

**Status**: Ready for Implementation  
**Target**: Warp AI Agent  
**Priority**: Feature Complete

---

## Overview

Rick mode adds a 1940s film noir aesthetic conversation mode featuring Bogart-style personality. This spec covers asset management, portrait cycling, audio playback, and theme locking.

---

## 1. Asset Locations

### Logical Root (for bundling/aliases)
```
/assets/notes/rick/
```

Use this path in your code for imports and asset references.

### Actual Development Pools

**Images**:
```
/Users/jdw/workspace/jdwGH/ChatLaLiLuLeLo/material/images/Rick.images
```

**Audio**:
```
/Users/jdw/workspace/jdwGH/ChatLaLiLuLeLo/material/audio/rick.audio
```

### Valid Formats

**Images**: `.png`, `.jpg`, `.jpeg`, `.gif`, `.avif`  
**Audio**: `.mp3`

**Implementation Note**: Treat the `material/` paths as canonical for what to load/cycle through in Rick mode. Alias these under `/assets/notes/rick/` as needed for the bundler.

---

## 2. Portrait Click Behavior

### When `mode === "rick"`

#### 2.1 Label
**Top-left portrait label** must display:
```
BOGART
```
(Instead of "Colonel")

#### 2.2 Image Cycle
- Each click on the portrait advances to the **next Rick image** from the Rick image pool
- Only keep images that actually load; **skip anything that fails**
- Cycle sequentially through all valid images

#### 2.3 Audio Cycle
- Each click also plays the **next Rick audio clip** from the audio pool
- **Image index and audio index advance together** so each click is a paired image+sound

#### 2.4 No Stacking / Guard
```typescript
// Pseudo-code logic:
if (audioIsCurrentlyPlaying) {
  return; // Ignore click
}

// Otherwise:
nextImageIndex();
nextAudioIndex();
playAudio(currentAudioClip);
```

**Rule**: If an audio clip is currently playing, ignore further clicks until it finishes. After playback ends, the next click triggers the next image+audio pair.

#### 2.5 Wrap-Around
When at the end of the list(s), wrap back to the start:
```typescript
currentIndex = (currentIndex + 1) % assets.length;
```

---

## 3. Rick Theme Lock & Restore

### 3.1 Theme Forcing

When `mode === "rick"`:
- **Active theme** is always the Rick theme (monochrome 1940s / B&W aesthetic)
- **Theme chooser/button** is disabled or hidden
- User cannot change theme while in Rick mode

### 3.2 Entering Rick Mode

```typescript
// On mode change to "rick":
if (previousMode !== 'rick' && newMode === 'rick') {
  // Capture current theme
  previousThemeKey = getCurrentTheme();
  
  // Force Rick theme
  setTheme('rick');
  
  // Disable theme controls
  setThemeControlsEnabled(false);
}
```

### 3.3 Leaving Rick Mode

```typescript
// On mode change from "rick":
if (previousMode === 'rick' && newMode !== 'rick') {
  // Restore previous theme
  if (previousThemeKey) {
    setTheme(previousThemeKey);
  } else {
    setTheme(DEFAULT_THEME); // Fallback
  }
  
  // Re-enable theme controls
  setThemeControlsEnabled(true);
  
  // Clear saved theme
  previousThemeKey = null;
}
```

### 3.4 Rick Theme Exclusivity

- Rick theme **cannot be selected** from normal theme UI
- It's **strictly tied** to Rick chat mode
- Only accessible when `mode === "rick"`

---

## 4. Frontend Chrome Updates

### 4.1 Chat Header
- Show **Rick avatar** in Rick mode
- Avatar should match the 1940s noir aesthetic

### 4.2 Top-Left Portrait Box
- **Label**: "BOGART" (not "Colonel")
- **Image**: Current Rick portrait from cycle
- **Clickable**: Advances image+audio

### 4.3 Optional Mode Indicator
- Subtle **"RICK MODE"** label somewhere in UI
- Suggested location: Near mode selector or in status bar
- Style: Minimal, fits noir aesthetic

---

## 5. Implementation Checklist

### Phase 1: Asset Loading
- [ ] Set up alias: `/assets/notes/rick/` → `material/images/Rick.images` and `material/audio/rick.audio`
- [ ] Scan Rick.images directory for valid image formats
- [ ] Scan rick.audio directory for .mp3 files
- [ ] Filter out any assets that fail to load
- [ ] Log asset count for debugging

### Phase 2: Portrait Cycling
- [ ] Implement `currentRickImageIndex` state
- [ ] Implement `currentRickAudioIndex` state
- [ ] Create `handleRickPortraitClick()` function
- [ ] Add audio playback guard (check `isAudioPlaying`)
- [ ] Implement wrap-around logic for both indices
- [ ] Update portrait label to "BOGART" when `mode === "rick"`

### Phase 3: Audio Playback
- [ ] Create audio player for Rick clips
- [ ] Track `isRickAudioPlaying` state
- [ ] Play audio on portrait click (if not already playing)
- [ ] Set `isRickAudioPlaying = false` on audio end
- [ ] Handle audio errors gracefully

### Phase 4: Theme Lock
- [ ] Create `previousThemeKey` state
- [ ] Detect mode change to "rick" → save current theme
- [ ] Force Rick theme when entering Rick mode
- [ ] Disable/hide theme controls in Rick mode
- [ ] Detect mode change from "rick" → restore previous theme
- [ ] Re-enable theme controls when leaving Rick mode

### Phase 5: UI Polish
- [ ] Update chat header with Rick avatar
- [ ] Add "RICK MODE" indicator (optional)
- [ ] Test theme transitions are smooth
- [ ] Verify Rick theme is not in normal theme picker

---

## 6. Acceptance Tests

### Test 1: Portrait Click Cycling
```
GIVEN Rick mode is active
WHEN user clicks portrait
THEN image advances to next in cycle
AND audio plays next clip
AND label shows "BOGART"
```

### Test 2: Audio Guard
```
GIVEN Rick mode is active
AND audio is currently playing
WHEN user clicks portrait
THEN image does NOT change
AND new audio does NOT play
WHEN audio finishes
AND user clicks portrait
THEN image advances
AND new audio plays
```

### Test 3: Wrap-Around
```
GIVEN Rick mode is active
AND user is on last image/audio in cycle
WHEN user clicks portrait
THEN cycles back to first image/audio
```

### Test 4: Theme Lock
```
GIVEN user has cyan theme active
WHEN user switches to Rick mode
THEN theme changes to Rick (B&W)
AND theme controls are disabled
```

### Test 5: Theme Restore
```
GIVEN user entered Rick mode from cyan theme
WHEN user switches from Rick mode to JD mode
THEN theme restores to cyan
AND theme controls are re-enabled
```

### Test 6: Theme Exclusivity
```
GIVEN user is in JD mode
WHEN user opens theme picker
THEN Rick theme is NOT in the list
```

### Test 7: Asset Loading
```
GIVEN Rick mode assets are in material/ directories
WHEN app loads
THEN all valid images are detected
AND all valid audio files are detected
AND failed assets are skipped with warning
```

---

## 7. Technical Implementation Notes

### 7.1 State Management

```typescript
// Add to theme state
interface ThemeState {
  currentTheme: string;
  previousThemeKey: string | null;
  themeControlsEnabled: boolean;
}

// Add to Rick mode state
interface RickModeState {
  currentImageIndex: number;
  currentAudioIndex: number;
  isAudioPlaying: boolean;
  images: string[];  // Validated image paths
  audio: string[];   // Validated audio paths
}
```

### 7.2 Asset Discovery

```typescript
// Pseudo-code for asset loading
async function loadRickAssets(): Promise<RickAssets> {
  const imagePath = 'material/images/Rick.images';
  const audioPath = 'material/audio/rick.audio';
  
  // Scan directories
  const imageFiles = await scanDirectory(imagePath, ['.png', '.jpg', '.jpeg', '.gif', '.avif']);
  const audioFiles = await scanDirectory(audioPath, ['.mp3']);
  
  // Validate each asset loads
  const validImages = await validateAssets(imageFiles);
  const validAudio = await validateAssets(audioFiles);
  
  console.log(`[RICK] Loaded ${validImages.length} images, ${validAudio.length} audio clips`);
  
  return { images: validImages, audio: validAudio };
}
```

### 7.3 Portrait Click Handler

```typescript
function handleRickPortraitClick() {
  // Guard: Don't proceed if audio is playing
  if (isRickAudioPlaying) {
    console.log('[RICK] Audio already playing, ignoring click');
    return;
  }
  
  // Advance indices with wrap-around
  currentImageIndex = (currentImageIndex + 1) % rickImages.length;
  currentAudioIndex = (currentAudioIndex + 1) % rickAudio.length;
  
  // Update portrait image
  setCurrentPortrait(rickImages[currentImageIndex]);
  
  // Play audio
  playRickAudio(rickAudio[currentAudioIndex]);
}

async function playRickAudio(audioPath: string) {
  isRickAudioPlaying = true;
  
  try {
    await audioPlayer.play(audioPath);
  } catch (error) {
    console.error('[RICK] Audio playback failed:', error);
  } finally {
    isRickAudioPlaying = false;
  }
}
```

### 7.4 Mode Change Hook

```typescript
useEffect(() => {
  // Entering Rick mode
  if (mode === 'rick' && previousMode !== 'rick') {
    // Save current theme
    setPreviousThemeKey(currentTheme);
    
    // Force Rick theme
    setTheme('rick');
    setThemeControlsEnabled(false);
    
    // Initialize Rick assets if needed
    if (rickImages.length === 0) {
      loadRickAssets().then(assets => {
        setRickImages(assets.images);
        setRickAudio(assets.audio);
      });
    }
  }
  
  // Leaving Rick mode
  if (previousMode === 'rick' && mode !== 'rick') {
    // Restore previous theme
    if (previousThemeKey) {
      setTheme(previousThemeKey);
    } else {
      setTheme(DEFAULT_THEME);
    }
    
    setThemeControlsEnabled(true);
    setPreviousThemeKey(null);
    
    // Stop any playing Rick audio
    if (isRickAudioPlaying) {
      stopRickAudio();
    }
  }
}, [mode]);
```

---

## 8. File Locations Reference

### Assets to Create/Populate

```
material/
├── images/
│   └── Rick.images/
│       ├── rick_001.png
│       ├── rick_002.jpg
│       ├── rick_003.avif
│       └── ...
└── audio/
    └── rick.audio/
        ├── rick_001.mp3
        ├── rick_002.mp3
        ├── rick_003.mp3
        └── ...
```

### Code Files to Modify

```
apps/mobile/src/
├── lib/
│   ├── theme.ts              # Add Rick theme, previousThemeKey state
│   └── audio.ts              # Add Rick audio playback functions
├── components/
│   ├── Portrait.tsx          # Add Rick portrait cycling
│   └── ThemePicker.tsx       # Hide Rick theme, disable in Rick mode
└── features/
    └── chat/
        └── ChatScreen.tsx    # Add Rick mode detection, theme lock
```

### Tests to Add

```
apps/mobile/src/__tests__/
├── rick-portrait-cycle.test.ts
├── rick-theme-lock.test.ts
└── rick-audio-guard.test.ts
```

---

## 9. Edge Cases to Handle

### 9.1 No Assets Found
```typescript
if (rickImages.length === 0) {
  console.warn('[RICK] No valid Rick images found, using fallback');
  rickImages = [DEFAULT_RICK_IMAGE];
}

if (rickAudio.length === 0) {
  console.warn('[RICK] No valid Rick audio found, disabling audio cycle');
  audioEnabled = false;
}
```

### 9.2 Asset Load Failures
```typescript
// Skip individual failed assets, don't crash
try {
  const img = await loadImage(path);
  validImages.push(img);
} catch (error) {
  console.warn(`[RICK] Failed to load image: ${path}`, error);
  // Continue with other assets
}
```

### 9.3 Audio Playback Errors
```typescript
try {
  await playAudio(clip);
} catch (error) {
  console.error('[RICK] Audio playback error:', error);
  isRickAudioPlaying = false; // Allow next click
}
```

### 9.4 Rapid Clicking
```typescript
// Guard already handles this:
if (isRickAudioPlaying) return;

// But also consider debouncing:
const debouncedPortraitClick = debounce(handleRickPortraitClick, 100);
```

### 9.5 Mode Switching During Audio
```typescript
// On leaving Rick mode:
if (isRickAudioPlaying) {
  stopRickAudio();
  isRickAudioPlaying = false;
}
```

---

## 10. Success Criteria

### Functional Requirements
- ✅ Portrait cycles through Rick images on click
- ✅ Audio plays on portrait click (one clip per click)
- ✅ Clicking during audio playback is ignored
- ✅ Images and audio wrap around at end of cycle
- ✅ Label shows "BOGART" in Rick mode
- ✅ Rick theme auto-activates in Rick mode
- ✅ Theme controls disabled in Rick mode
- ✅ Previous theme restores when leaving Rick mode
- ✅ Rick theme not selectable from normal UI

### Non-Functional Requirements
- ✅ All assets load correctly or gracefully skip
- ✅ No memory leaks from audio playback
- ✅ Smooth transitions between modes
- ✅ Clear console logging for debugging
- ✅ Error handling for all asset operations

---

## 11. Notes for More Assets

**From user**: "Note I have more assets to add to those folders too"

**Handling**:
- Asset discovery should be **dynamic** - no hardcoded asset lists
- New files added to `Rick.images/` or `rick.audio/` should be **automatically detected** on next app load
- Consider adding **hot reload** for development (optional)
- Asset validation should be **resilient** - new broken assets shouldn't break existing functionality

**Recommendations**:
- Use file system scanning (e.g., `require.context()` in Webpack, or dynamic imports)
- Sort assets alphabetically for consistent cycling order
- Log asset count on load for easy verification

---

## 12. Quick Start for Warp

```bash
# 1. Check current assets
ls -la /Users/jdw/workspace/jdwGH/ChatLaLiLuLeLo/material/images/Rick.images/
ls -la /Users/jdw/workspace/jdwGH/ChatLaLiLuLeLo/material/audio/rick.audio/

# 2. Implement asset loading first
# Start with: apps/mobile/src/lib/rickAssets.ts

# 3. Test asset discovery
npm run dev
# Check console for: "[RICK] Loaded X images, Y audio clips"

# 4. Implement portrait cycling
# Modify: apps/mobile/src/components/Portrait.tsx

# 5. Test clicking behavior manually
# Open http://localhost:14085
# Switch to Rick mode
# Click portrait repeatedly

# 6. Implement theme lock
# Modify: apps/mobile/src/lib/theme.ts

# 7. Test theme switching
# Switch between JD → Rick → BTC modes
# Verify theme changes and restores correctly

# 8. Add tests
# Create test files for coverage

# 9. Document any issues or questions
```

---

## Summary

This spec provides Warp with:
- ✅ Exact asset locations (development and logical paths)
- ✅ Complete portrait click behavior (image+audio cycling, guard, wrap)
- ✅ Theme lock and restore logic
- ✅ UI chrome requirements
- ✅ Comprehensive acceptance tests
- ✅ Technical implementation guidance
- ✅ Edge case handling
- ✅ Success criteria

**Status**: Ready for implementation. All requirements are clearly defined and testable.

