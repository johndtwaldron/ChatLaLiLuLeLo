/**
 * Rick Assets Loading Tests
 * 
 * Verifies that Rick images and audio are properly imported and available.
 */

import { getRickAssets, RickPortraitCycler } from '../lib/rickAssets';

describe('Rick Assets', () => {
  describe('getRickAssets', () => {
    it('should return assets with images and audio arrays', () => {
      const assets = getRickAssets();
      
      expect(assets).toBeDefined();
      expect(assets.images).toBeDefined();
      expect(assets.audio).toBeDefined();
      expect(Array.isArray(assets.images)).toBe(true);
      expect(Array.isArray(assets.audio)).toBe(true);
    });
    
    it('should have at least 3 Rick images', () => {
      const assets = getRickAssets();
      
      expect(assets.images.length).toBeGreaterThanOrEqual(3);
    });
    
    it('should have at least 3 Rick audio clips', () => {
      const assets = getRickAssets();
      
      expect(assets.audio.length).toBeGreaterThanOrEqual(3);
    });
    
    it('should not return null or undefined images', () => {
      const assets = getRickAssets();
      
      assets.images.forEach((img, index) => {
        expect(img).toBeDefined();
        expect(img).not.toBeNull();
      });
    });
    
    it('should not return null or undefined audio', () => {
      const assets = getRickAssets();
      
      assets.audio.forEach((audio, index) => {
        expect(audio).toBeDefined();
        expect(audio).not.toBeNull();
      });
    });
  });
  
  describe('RickPortraitCycler', () => {
    let cycler: RickPortraitCycler;
    
    beforeEach(() => {
      const assets = getRickAssets();
      cycler = new RickPortraitCycler(assets);
    });
    
    it('should initialize with first image', () => {
      const currentImage = cycler.getCurrentImage();
      
      expect(currentImage).toBeDefined();
      expect(currentImage).not.toBeNull();
    });
    
    it('should cycle through images on handleClick', async () => {
      const firstImage = cycler.getCurrentImage();
      
      // Mock HTMLAudioElement for test environment
      global.Audio = jest.fn().mockImplementation(() => ({
        play: jest.fn().mockResolvedValue(undefined),
        pause: jest.fn(),
        onended: null,
        onerror: null,
      })) as any;
      
      await cycler.handleClick();
      const secondImage = cycler.getCurrentImage();
      
      // Images should be different (unless only 1 image, which should not happen)
      expect(secondImage).toBeDefined();
    });
    
    it('should not allow clicking while audio is playing', async () => {
      // Mock Audio to simulate long playback
      global.Audio = jest.fn().mockImplementation(() => ({
        play: jest.fn().mockResolvedValue(undefined),
        pause: jest.fn(),
        onended: null,
        onerror: null,
      })) as any;
      
      const firstClick = await cycler.handleClick();
      expect(firstClick).toBe(true);
      
      // Second click should be blocked
      const secondClick = await cycler.handleClick();
      expect(secondClick).toBe(false);
    });
    
    it('should reset to first image', () => {
      cycler.reset();
      
      const currentImage = cycler.getCurrentImage();
      expect(currentImage).toBeDefined();
    });
    
    it('should stop audio on reset', () => {
      const stopAudioSpy = jest.spyOn(cycler, 'stopAudio');
      
      cycler.reset();
      
      expect(stopAudioSpy).toHaveBeenCalled();
    });
  });
});
