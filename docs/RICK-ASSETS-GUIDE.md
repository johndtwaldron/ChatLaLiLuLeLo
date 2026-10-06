# Rick Assets Expansion Guide

## Current Status

**Images**: 3 jpg files loaded
**Audio**: 3 mp3 files loaded

## Available Assets (Not Yet Imported)

### Images in `material/images/Rick.images/`:
- `7vai8uwrs1v11.jpg` ✅ **LOADED**
- `Rick.Cigarette.jpg` ✅ **LOADED**
- `RickBlaine.jpg` ✅ **LOADED**
- `bogart-humphrey-bogart.gif` (138KB)
- `casablanca-fighting.gif` (1.0MB)
- `casablanca-heres-looking-at-you-kid.gif` (1.2MB)
- `casablanca-rick.gif` (1.7MB)
- `for-a-price-rick-blaine.png` (99KB)
- `frustrated-angry.gif` (214KB)
- `humphrey-bogart-smoking-a-cigarette-in-casablanca.avif` (13KB)
- `humphrey-bogart.avif` (35KB)
- `i'm-not-fighting-for-anything-anymore-except-myself-rick-blaine.gif` (2.4MB)
- `nobody-ever-loved-me-that-much-rick-blaine.gif` (1.5MB)
- `of-all-the-gin-joints-in-all-the-world-she-walks-into-mine-rick-blaine.gif` (3.1MB)
- `we-will-always-have-paris-classic.gif` (95KB)
- `you'd-be-doing-me-a-favor-rick-blaine.gif` (173KB)

### Audio in `material/audio/rick.audio/`:
49 mp3 files total (currently loading first 3)

## How to Add More Images

### Option 1: Add JPG/PNG Images (Recommended First)

Edit `apps/mobile/src/lib/rickAssets.ts`:

```typescript
const RICK_IMAGES = [
  asImg(require('../../../material/images/Rick.images/7vai8uwrs1v11.jpg')),
  asImg(require('../../../material/images/Rick.images/Rick.Cigarette.jpg')),
  asImg(require('../../../material/images/Rick.images/RickBlaine.jpg')),
  // Add more JPG/PNG images:
  asImg(require('../../../material/images/Rick.images/for-a-price-rick-blaine.png')),
];
```

### Option 2: Add GIF Images (Test First)

GIFs should work but need testing:

```typescript
const RICK_IMAGES = [
  // ... existing images ...
  asImg(require('../../../material/images/Rick.images/bogart-humphrey-bogart.gif')),
  asImg(require('../../../material/images/Rick.images/frustrated-angry.gif')),
];
```

**Note**: Be cautious with large GIFs (>1MB) as they may impact performance.

### Option 3: Add AVIF Images (Advanced)

AVIF has excellent compression but limited browser support:

```typescript
const RICK_IMAGES = [
  // ... existing images ...
  asImg(require('../../../material/images/Rick.images/humphrey-bogart.avif')),
];
```

**Browser Support**: Check if AVIF works in your target browsers.

## How to Add More Audio

Edit `apps/mobile/src/lib/rickAssets.ts`:

```typescript
const RICK_AUDIO = [
  require('../../../material/audio/rick.audio/01.mgs2.codec.beep.1.mp3'),
  require('../../../material/audio/rick.audio/02.mgs2.codec.beep.2.mp3'),
  require('../../../material/audio/rick.audio/03.mgs2.codec.beep.3.mp3'),
  // Add more audio:
  require('../../../material/audio/rick.audio/04.mgs2.codec.beep.4.mp3'),
  require('../../../material/audio/rick.audio/05.mgs2.codec.beep.5.mp3'),
];
```

## Testing Process

1. **Add Assets**: Update `rickAssets.ts` with new imports
2. **TypeScript Check**: `npm run typecheck`
3. **Run Dev Server**: `npm run dev`
4. **Switch to Rick Mode**: Cycle through modes to reach Rick
5. **Click Portrait**: Verify new images cycle through
6. **Listen for Audio**: Verify new audio clips play

## Recommended Expansion Order

### Phase 1 (Low Risk):
1. Add remaining JPG images
2. Add small PNG images (<100KB)

### Phase 2 (Medium Risk):
1. Add small GIFs (<200KB)
2. Test performance and rendering

### Phase 3 (Test Carefully):
1. Add medium GIFs (200KB-1MB)
2. Monitor bundle size and performance

### Phase 4 (Optional):
1. Add large GIFs (>1MB) if performance allows
2. Consider lazy loading strategies

## Performance Considerations

- **Bundle Size**: Each asset increases initial load
- **Memory**: Large GIFs can consume significant memory
- **Network**: Larger bundle = longer initial download
- **Rendering**: Animated GIFs use CPU/GPU resources

### Recommended Approach:
Start with a subset of assets and expand based on performance testing.

## Validation

After adding assets, run:

```bash
# TypeScript validation
npm run typecheck

# Asset loading tests
npm test -- rickAssets.test.ts

# Manual testing
npm run dev
```

Console should show:
```
[RICK] Total assets: N images, M audio clips
[RICK] No images available for cycling  ← Should NOT appear
```

## Troubleshooting

### "Cannot find module" Error
- Verify file path is correct
- Check file exists in `material/` directory
- Ensure file extension matches exactly

### "Asset not displaying"
- Check `asImg()` helper is used for images
- Verify file format is supported
- Check browser console for errors

### "Portrait shows null"
- Verify `RICK_IMAGES` array is not empty
- Check console for `[RICK]` error messages
- Ensure `getRickAssets()` returns valid data

## Current Import Example

```typescript
// apps/mobile/src/lib/rickAssets.ts
import { asImg } from './asset';

// Static Rick image imports (jpg/jpeg only for now)
const RICK_IMAGES = [
  asImg(require('../../../material/images/Rick.images/7vai8uwrs1v11.jpg')),
  asImg(require('../../../material/images/Rick.images/Rick.Cigarette.jpg')),
  asImg(require('../../../material/images/Rick.images/RickBlaine.jpg')),
];

// Static Rick audio imports
const RICK_AUDIO = [
  require('../../../material/audio/rick.audio/01.mgs2.codec.beep.1.mp3'),
  require('../../../material/audio/rick.audio/02.mgs2.codec.beep.2.mp3'),
  require('../../../material/audio/rick.audio/03.mgs2.codec.beep.3.mp3'),
];
```

## Next Steps

1. Test current 3 images + 3 audio in browser
2. Verify clicking cycles and audio plays
3. Expand with more JPG/PNG images
4. Test GIF support
5. Optimize based on performance
