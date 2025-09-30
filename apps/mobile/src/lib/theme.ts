// Theme definitions for different codec styles
export const themePresets = {
  // Cyan - Default (MGS2 authentic)
  cyan: {
    primary: '#00FFFF',      // Cyan blue
    secondary: '#0099CC',    // Darker cyan
    tertiary: '#006699',     // Deep blue
    background: '#000000',   // Pure black
    surface: '#001122',      // Very dark blue
    text: '#FFFFFF',         // White text
    textSecondary: '#CCCCCC', // Light gray
    border: '#004466',       // Dark cyan borders
    scanline: '#002244',     // Dark blue scanlines
    glow: '#00FFFF40',       // Cyan glow (with alpha)
  },
  
  // Hot Purple
  purple: {
    primary: '#FF00FF',      // Hot magenta/purple
    secondary: '#CC00CC',    // Darker purple
    tertiary: '#990099',     // Deep purple
    background: '#000000',   // Pure black
    surface: '#220022',      // Very dark purple
    text: '#FFFFFF',         // White text
    textSecondary: '#CCCCCC', // Light gray
    border: '#664466',       // Dark purple borders
    scanline: '#220022',     // Purple scanlines
    glow: '#FF00FF40',       // Purple glow (with alpha)
  },
  
  // Gold
  gold: {
    primary: '#FFD700',      // Gold
    secondary: '#DAA520',    // Goldenrod
    tertiary: '#B8860B',     // Dark goldenrod
    background: '#000000',   // Pure black
    surface: '#222200',      // Very dark gold
    text: '#FFFFFF',         // White text
    textSecondary: '#CCCCCC', // Light gray
    border: '#666600',       // Dark gold borders
    scanline: '#333300',     // Gold scanlines
    glow: '#FFD70040',       // Gold glow (with alpha)
  },
  
  // Green Terminal
  green: {
    primary: '#00FF00',      // Bright green
    secondary: '#00CC00',    // Medium green  
    tertiary: '#008800',     // Dark green
    background: '#000000',   // Pure black
    surface: '#001100',      // Very dark green
    text: '#FFFFFF',         // White text
    textSecondary: '#CCCCCC', // Light gray
    border: '#004400',       // Dark green borders
    scanline: '#002200',     // Scanline overlay
    glow: '#00FF0040',       // Green glow (with alpha)
  },
  
  // Yellow
  yellow: {
    primary: '#FFFF00',      // Bright yellow
    secondary: '#CCCC00',    // Medium yellow
    tertiary: '#999900',     // Dark yellow
    background: '#000000',   // Pure black
    surface: '#222200',      // Very dark yellow
    text: '#FFFFFF',         // White text
    textSecondary: '#CCCCCC', // Light gray
    border: '#666600',       // Dark yellow borders
    scanline: '#333300',     // Yellow scanlines
    glow: '#FFFF0040',       // Yellow glow (with alpha)
  },
  
  // Crimson
  crimson: {
    primary: '#DC143C',      // Crimson
    secondary: '#B22222',    // Fire brick
    tertiary: '#8B0000',     // Dark red
    background: '#000000',   // Pure black
    surface: '#220011',      // Very dark red
    text: '#FFFFFF',         // White text
    textSecondary: '#CCCCCC', // Light gray
    border: '#664433',       // Dark red borders
    scanline: '#330011',     // Red scanlines
    glow: '#DC143C40',       // Crimson glow (with alpha)
  },
};

// Current active theme - starts with cyan (default)
let currentTheme: keyof typeof themePresets = 'cyan';

// Theme cycle order
const themeOrder: Array<keyof typeof themePresets> = ['cyan', 'purple', 'gold', 'green', 'yellow', 'crimson'];

// CRT effects toggle state
let crtEnabled = true;

// Dynamic theme getter
export const getCodecTheme = () => ({
  colors: themePresets[currentTheme],
  
  // CRT effects toggle
  crt: crtEnabled,
  
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

// Theme cycling function
export const cycleTheme = () => {
  const currentIndex = themeOrder.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % themeOrder.length;
  const nextTheme = themeOrder[nextIndex];
  changeTheme(nextTheme);
};

export const getThemeDisplayName = (theme: keyof typeof themePresets): string => {
  const displayNames: Record<keyof typeof themePresets, string> = {
    cyan: 'CYAN',
    purple: 'PURPLE',
    gold: 'GOLD', 
    green: 'GREEN',
    yellow: 'YELLOW',
    crimson: 'CRIMSON'
  };
  return displayNames[theme];
};

// CRT toggle functions
export const toggleCRT = () => {
  crtEnabled = !crtEnabled;
  notifyThemeChange();
};

export const setCRT = (enabled: boolean) => {
  crtEnabled = enabled;
  notifyThemeChange();
};

export const getCRTState = () => crtEnabled;
