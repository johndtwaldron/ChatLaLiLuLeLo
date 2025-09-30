// Theme definitions for different codec styles
export const themePresets = {
  // Authentic MGS2 Codec (Black/Cyan) - Default
  mgs2: {
    primary: '#00FFFF',      // Cyan blue (authentic MGS2)
    secondary: '#0099CC',    // Darker cyan
    tertiary: '#006699',     // Deep blue
    background: '#000000',   // Pure black
    surface: '#001122',      // Very dark blue
    text: '#FFFFFF',         // White text (as seen in screenshots)
    textSecondary: '#CCCCCC', // Light gray
    border: '#004466',       // Dark cyan borders
    scanline: '#002244',     // Dark blue scanlines
    glow: '#00FFFF40',       // Cyan glow (with alpha)
  },
  
  // Classic Green Terminal
  green: {
    primary: '#00FF00',      // Bright green
    secondary: '#00CC00',    // Medium green  
    tertiary: '#008800',     // Dark green
    background: '#000000',   // Pure black
    surface: '#001100',      // Very dark green
    text: '#00FF00',         // Green text
    textSecondary: '#00AA00', // Dimmer green
    border: '#004400',       // Dark green borders
    scanline: '#002200',     // Scanline overlay
    glow: '#00FF0040',       // Green glow (with alpha)
  },
  
  // Amber Terminal
  amber: {
    primary: '#FFAA00',      // Bright amber
    secondary: '#CC8800',    // Medium amber
    tertiary: '#996600',     // Dark amber
    background: '#000000',   // Pure black
    surface: '#221100',      // Very dark amber
    text: '#FFBB00',         // Amber text
    textSecondary: '#CC9900', // Dimmer amber
    border: '#664400',       // Dark amber borders
    scanline: '#332200',     // Amber scanlines
    glow: '#FFAA0040',       // Amber glow (with alpha)
  },
};

// Current active theme - starts with MGS2 authentic
let currentTheme: keyof typeof themePresets = 'mgs2';

// Dynamic theme getter
export const getCodecTheme = () => ({
  colors: themePresets[currentTheme],
  
  fonts: {
    mono: 'Courier New', // Monospace for authentic terminal feel
    sizes: {
      caption: 12,
      body: 14,
      subtitle: 16,
      title: 18,
      header: 24,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  effects: {
    scanlineHeight: 2,
    scanlineSpacing: 4,
    glowRadius: 8,
    jitterAmount: 0.5, // pixels
    crtCurvature: 0.02,
  },
  
  animation: {
    durations: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    
    easing: {
      standard: 'ease-out',
      sharp: 'ease-in-out',
    },
  },
});

// Theme switching functions
export const setTheme = (theme: keyof typeof themePresets) => {
  currentTheme = theme;
};

export const getCurrentTheme = () => currentTheme;

export const getAvailableThemes = () => Object.keys(themePresets) as Array<keyof typeof themePresets>;

// Backward compatibility - use dynamic theme
export const codecTheme = getCodecTheme();

export type CodecTheme = ReturnType<typeof getCodecTheme>;
export type ThemePreset = keyof typeof themePresets;

// Theme change subscription
let themeListeners: Array<() => void> = [];

export const subscribeToThemeChanges = (callback: () => void) => {
  themeListeners.push(callback);
  return () => {
    themeListeners = themeListeners.filter(listener => listener !== callback);
  };
};

const notifyThemeChange = () => {
  themeListeners.forEach(listener => listener());
};

// Enhanced theme setter with notifications
export const changeTheme = (theme: keyof typeof themePresets) => {
  setTheme(theme);
  notifyThemeChange();
};
