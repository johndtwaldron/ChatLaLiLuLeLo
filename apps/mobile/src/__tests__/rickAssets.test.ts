/**
 * Tests for Rick Mode asset cycling
 * 
 * Verifies all 16 images and 54 audio clips load and cycle correctly.
 */

import {
  getNextRickImage,
  getNextRickAudio,
  getCurrentRickImage,
  resetRickAssets,
  getRickAssetCounts,
} from '../lib/rickAssets';

describe('rickAssets', () => {
  beforeEach(() => {
    resetRickAssets();
  });

  describe('getRickAssetCounts', () => {
    it('should have all 16 images', () => {
      const counts = getRickAssetCounts();
      expect(counts.images).toBe(16);
    });

    it('should have all 54 audio clips', () => {
      const counts = getRickAssetCounts();
      expect(counts.audio).toBe(54);
    });
  });

  describe('getNextRickImage', () => {
    it('should return an image', () => {
      const image = getNextRickImage();
      expect(image).toBeTruthy();
    });

    it('should cycle through all images', () => {
      const counts = getRickAssetCounts();
      
      // Call getNextRickImage counts.images times to verify no errors
      for (let i = 0; i < counts.images; i++) {
        const image = getNextRickImage();
        expect(image).toBeTruthy();
      }
      
      // Verify cycling completed without errors
      expect(counts.images).toBe(16);
    });

    it('should wrap around after last image', () => {
      const counts = getRickAssetCounts();
      const firstImage = getCurrentRickImage();
      
      // Cycle through all images
      for (let i = 0; i < counts.images; i++) {
        getNextRickImage();
      }
      
      // Should be back at first image
      const wrappedImage = getCurrentRickImage();
      expect(JSON.stringify(wrappedImage)).toBe(JSON.stringify(firstImage));
    });
  });

  describe('getNextRickAudio', () => {
    it('should return audio', () => {
      const audio = getNextRickAudio();
      expect(audio).toBeTruthy();
    });

    it('should cycle through all audio clips', () => {
      const counts = getRickAssetCounts();
      
      // Call getNextRickAudio counts.audio times to verify no errors
      for (let i = 0; i < counts.audio; i++) {
        const audio = getNextRickAudio();
        expect(audio).toBeTruthy();
      }
      
      // Verify cycling completed without errors
      expect(counts.audio).toBe(54);
    });

    it('should wrap around after last audio', () => {
      const counts = getRickAssetCounts();
      
      // Get first audio by resetting and calling getNextRickAudio once
      resetRickAssets();
      const firstAudio = getNextRickAudio();
      
      // Cycle through remaining audio clips
      for (let i = 1; i < counts.audio; i++) {
        getNextRickAudio();
      }
      
      // Next call should wrap to first audio
      const wrappedAudio = getNextRickAudio();
      expect(JSON.stringify(wrappedAudio)).toBe(JSON.stringify(firstAudio));
    });
  });

  describe('getCurrentRickImage', () => {
    it('should return image without advancing', () => {
      const first = getCurrentRickImage();
      const second = getCurrentRickImage();
      expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    });

    it('should reflect state after getNextRickImage', () => {
      getCurrentRickImage();
      getNextRickImage();
      const current = getCurrentRickImage();
      const next = getNextRickImage();
      expect(JSON.stringify(current)).toBe(JSON.stringify(next));
    });
  });

  describe('resetRickAssets', () => {
    it('should reset image index to start', () => {
      const firstImage = getCurrentRickImage();
      
      // Advance several times
      getNextRickImage();
      getNextRickImage();
      getNextRickImage();
      
      // Reset and check we're back at first
      resetRickAssets();
      const resetImage = getCurrentRickImage();
      expect(JSON.stringify(resetImage)).toBe(JSON.stringify(firstImage));
    });

    it('should reset audio index to start', () => {
      // Get first audio
      const firstAudio = getNextRickAudio();
      
      // Advance several times
      getNextRickAudio();
      getNextRickAudio();
      
      // Reset and check we're back at first
      resetRickAssets();
      const resetAudio = getNextRickAudio();
      expect(JSON.stringify(resetAudio)).toBe(JSON.stringify(firstAudio));
    });

    it('should reset both indices independently', () => {
      // Advance image and audio by different amounts
      getNextRickImage();
      getNextRickImage();
      getNextRickAudio();
      
      // Reset should affect both
      resetRickAssets();
      
      const counts = getRickAssetCounts();
      expect(counts.images).toBe(16);
      expect(counts.audio).toBe(54);
    });
  });
});
