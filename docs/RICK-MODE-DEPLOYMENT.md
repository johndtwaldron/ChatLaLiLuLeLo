# Rick Mode Deployment Checklist

## Status: ✅ READY FOR DEPLOYMENT

Rick mode is fully implemented and ready to deploy to GitHub Pages.

## Pre-Deployment Checklist

### ✅ Code Complete
- [x] Theme system (B&W noir) implemented
- [x] Portrait component updated with Rick mode
- [x] Asset loading fixed (16 images, 54 audio files copied)
- [x] RickPortraitCycler with click-to-cycle + audio
- [x] Backend Bogart persona prompt updated
- [x] TypeScript compiles without errors
- [x] ESLint passes with no warnings

### ✅ Assets In Place
```bash
# Verify assets exist
ls apps/mobile/assets/Rick.images/    # Should show 16 files
ls apps/mobile/assets/rick.audio/     # Should show 54 files
```

**Image Count**: 16 (jpg, png, gif, avif)
**Audio Count**: 54 (mp3 Rick Blaine quotes from Casablanca)

### ✅ Git Tracking
Both source and copies are tracked:
- `material/images/Rick.images/` ✅ (source)
- `material/audio/rick.audio/` ✅ (source)
- `apps/mobile/assets/Rick.images/` ✅ (Expo copy)
- `apps/mobile/assets/rick.audio/` ✅ (Expo copy)

## Local Testing (Before Deploy)

### 1. Start Dev Server
```bash
cd /Users/jdw/workspace/jdwGH/ChatLaLiLuLeLo
npm run dev
```

### 2. Test Rick Mode Features

**Visual Tests**:
- [ ] Mode cycles to Rick (after haywire, jd, lore, bitcoin)
- [ ] B&W noir theme activates automatically
- [ ] Portrait shows "BOGART" label
- [ ] Portrait displays Rick image (not null)

**Interaction Tests**:
- [ ] Click portrait → image changes
- [ ] Click portrait → audio plays (Rick quote)
- [ ] Rapid clicking → guarded (no audio overlap)
- [ ] Audio finishes → can click again
- [ ] Images cycle through all 3 loaded
- [ ] Audio cycles through all 3 loaded

**Theme Tests**:
- [ ] Rick mode locks to B&W noir theme
- [ ] Leaving Rick mode restores previous theme
- [ ] Theme controls work in other modes

### 3. Test Backend Persona

Send in Rick mode:
```
What's your take on heartbreak?
```

**Expected Response** (Bogart style):
```
Took a hit, huh? Happens in this town.
You don't chase someone who's already halfway out the door.
Give it space, clean up your side of the street, and keep walking.
You've still got a life to build, kid.
```

**Should NOT see**:
- ❌ Burps ("*burp*")
- ❌ "Morty" references
- ❌ "Wubba lubba dub dub"
- ❌ Portal gun / multiverse rants

## Deployment Steps

### 1. Backend Deployment (Cloudflare Worker)

The backend already has the correct Bogart prompt in `apps/edge/lib/composer.ts`.

```bash
cd apps/edge

# Deploy to development
npm run deploy

# OR deploy to production
npm run deploy:production
```

**Verify deployment**:
- Check Cloudflare dashboard for successful deployment
- Test `/chat` endpoint with `mode: 'RICK'`

### 2. Frontend Deployment (GitHub Pages)

From `dev-plus` branch:

```bash
# Ensure all changes committed
git status

# Push to dev-plus
git push origin dev-plus

# GitHub Actions will auto-deploy to Pages
```

**CI/CD Pipeline** will:
1. Build mobile app for web
2. Copy Rick assets into build
3. Deploy to GitHub Pages

### 3. Post-Deployment Verification

Visit deployed site: `https://johndtwaldron.github.io/ChatLaLiLuLeLo/`

**Test Checklist**:
- [ ] App loads without errors
- [ ] Can cycle to Rick mode
- [ ] B&W noir theme displays
- [ ] Portrait shows Rick image
- [ ] Click portrait → image cycles
- [ ] Click portrait → audio plays
- [ ] Send message → Bogart persona responds

## Asset Expansion (Future)

Currently loading **3 of 16 images** and **3 of 54 audio clips**.

### To Add More Assets

Edit `apps/mobile/src/lib/rickAssets.ts`:

```typescript
// Add more images
const RICK_IMAGES = [
  asImg(require('../../assets/Rick.images/7vai8uwrs1v11.jpg')),
  asImg(require('../../assets/Rick.images/Rick.Cigarette.jpg')),
  asImg(require('../../assets/Rick.images/RickBlaine.jpg')),
  // Add more:
  asImg(require('../../assets/Rick.images/bogart-humphrey-bogart.gif')),
  asImg(require('../../assets/Rick.images/for-a-price-rick-blaine.png')),
  // ... etc
];

// Add more audio
const RICK_AUDIO = [
  require('../../assets/rick.audio/band-playing.mp3'),
  require('../../assets/rick.audio/all-right-i-will.mp3'),
  require('../../assets/rick.audio/all-right-at-a-quarter-to-5.mp3'),
  // Add more:
  require('../../assets/rick.audio/here-s-looking-at-you-kid.mp3'),
  require('../../assets/rick.audio/i-stick-my-neck-out-for-nobody.mp3'),
  // ... etc
];
```

**Process**:
1. Update `rickAssets.ts` with new imports
2. Test locally (`npm run dev`)
3. Commit and push
4. Redeploy

## Troubleshooting

### Issue: Assets not loading after deploy

**Check**:
```bash
# Verify assets committed to git
git ls-files apps/mobile/assets/Rick.images/
git ls-files apps/mobile/assets/rick.audio/
```

**Fix**: If not tracked, add them:
```bash
git add apps/mobile/assets/Rick.images/
git add apps/mobile/assets/rick.audio/
git commit -m "Add Rick mode assets"
git push
```

### Issue: Metro bundling fails

**Symptoms**: "Unable to resolve" errors

**Fix**:
```bash
# Clear Metro cache
cd apps/mobile
npx expo start -c

# Or full reset
rm -rf node_modules
npm ci
npx expo start -c
```

### Issue: Audio not playing on deployed site

**Check**:
1. Browser console for errors
2. Network tab for failed audio requests
3. Browser audio policy (user interaction required)

**Common causes**:
- Audio files not deployed
- Wrong MIME types
- Browser autoplay policy

### Issue: Wrong Rick persona (Rick Sanchez instead of Bogart)

**Cause**: Backend not redeployed with new prompt

**Fix**:
```bash
cd apps/edge
npm run deploy:production
```

## Files Modified in This Feature

### Frontend
- `apps/mobile/src/lib/rickAssets.ts` (NEW)
- `apps/mobile/src/lib/theme.ts` (Rick theme + mode)
- `apps/mobile/src/components/Portrait.tsx` (Rick mode support)
- `apps/mobile/src/lib/api.ts` (RICK mode type)
- `apps/mobile/src/features/chat/ChatScreen.tsx` (RICK in modeMap)
- `apps/mobile/metro.config.js` (Asset extensions)
- `apps/mobile/assets/Rick.images/` (16 files added)
- `apps/mobile/assets/rick.audio/` (54 files added)

### Backend
- `apps/edge/lib/composer.ts` (Bogart prompt)

### Documentation
- `docs/RICK-MODE-SPEC.md`
- `docs/RICK-MODE-PROGRESS.md`
- `docs/RICK-PERSONA-FIX.md`
- `docs/RICK-ASSETS-GUIDE.md`
- `docs/RICK-MODE-DEPLOYMENT.md` (this file)
- `apps/mobile/assets/RICK-ASSETS-README.md`

## Success Criteria

Rick mode is considered fully deployed when:

✅ **Visual**:
- Rick mode accessible via mode cycling
- B&W noir theme displays correctly
- "BOGART" label shows on portrait
- Rick images display (not broken/null)

✅ **Interactive**:
- Portrait click cycles through images
- Portrait click plays Rick audio quotes
- Audio guard prevents overlapping playback
- Wrap-around works for both images and audio

✅ **AI Persona**:
- Backend responds with Bogart/Casablanca style
- No Rick Sanchez references (burps, Morty, etc.)
- Dry, noir, world-weary tone
- Self-respect and sovereignty advice

✅ **Technical**:
- No console errors
- No 404s for assets
- TypeScript clean
- ESLint clean
- CI/CD passes

## Contact

If issues arise during deployment, check:
1. GitHub Actions logs for build failures
2. Cloudflare Workers logs for backend errors
3. Browser console for frontend errors
4. This deployment guide for troubleshooting steps

---

**Last Updated**: 2023-11-23
**Feature**: Rick Mode (Bogart/Casablanca persona)
**Status**: ✅ Ready for production deployment
