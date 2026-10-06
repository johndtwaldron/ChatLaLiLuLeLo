# Rick Mode Assets

This directory contains **copied** Rick mode assets from the workspace root `material/` directory.

## Why Copy?

Metro bundler (Expo's bundler) cannot resolve assets outside the `apps/mobile/` directory.
We copy files here so Metro can find them. (Symlinks were attempted but can be unreliable with Metro.)

## Directory Structure

```
apps/mobile/assets/
├── Rick.images/     → 16 image files (jpg, png, gif, avif)
└── rick.audio/      → 54 audio files (mp3)
```

## Source Locations

- **Images**: `/material/images/Rick.images/`
- **Audio**: `/material/audio/rick.audio/`

## Copying Assets

If these directories are empty or you're setting up a new environment:

```bash
cd /path/to/ChatLaLiLuLeLo

# Create directories
mkdir -p apps/mobile/assets/Rick.images
mkdir -p apps/mobile/assets/rick.audio

# Copy all Rick images
cp material/images/Rick.images/* apps/mobile/assets/Rick.images/

# Copy all Rick audio
cp material/audio/rick.audio/* apps/mobile/assets/rick.audio/
```

## Git Tracking

These directories **are tracked in git**.

Assets are duplicated:
- **Source**: `material/images/Rick.images/` and `material/audio/rick.audio/` (tracked)
- **Expo copy**: `apps/mobile/assets/Rick.images/` and `rick.audio/` (tracked)

Both locations are committed to git.

## Usage in Code

From `apps/mobile/src/lib/rickAssets.ts`:

```typescript
// Images
const RICK_IMAGES = [
  asImg(require('../../assets/Rick.images/7vai8uwrs1v11.jpg')),
  // ...
];

// Audio
const RICK_AUDIO = [
  require('../../assets/rick.audio/band-playing.mp3'),
  // ...
];
```

## Adding New Assets

1. Add files to `material/images/Rick.images/` or `material/audio/rick.audio/`
2. Copy files to `apps/mobile/assets/` directories (run commands above)
3. Update imports in `rickAssets.ts`
4. Commit both locations to git

## Troubleshooting

### "Cannot find module" errors

If Metro can't find Rick assets:

1. Verify files exist: `ls -la apps/mobile/assets/Rick.images/`
2. Recopy files using commands above
3. Clear Metro cache: `npx expo start -c`

### Assets not updating

After modifying files in `material/` directory:
- Recopy files to `apps/mobile/assets/`
- Restart Metro bundler
- Clear cache: `npx expo start -c`
- Changes require manual copy (not automatic like symlinks would be)

## Metro Configuration

The `metro.config.js` is configured to handle these assets:

```javascript
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'jpg', 'jpeg', 'png', 'gif', 'mp3',
];
```

This ensures Metro processes Rick's images and audio correctly.
