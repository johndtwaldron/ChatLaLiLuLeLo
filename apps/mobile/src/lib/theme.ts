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
  
  // Orange (Bitcoin "orange pill" theme - only available in Bitcoin mode)
  orange: {
    primary: '#FF8C00',      // Bitcoin orange
    secondary: '#FF7F00',    // Slightly darker orange
    tertiary: '#CC6600',     // Dark orange
    background: '#000000',   // Pure black
    surface: '#221100',      // Very dark orange
    text: '#FFFFFF',         // White text
    textSecondary: '#CCCCCC', // Light gray
    border: '#664400',       // Dark orange borders
    scanline: '#332200',     // Orange scanlines
    glow: '#FF8C0040',       // Orange glow (with alpha)
  },
};

// Current active theme - starts with cyan (default)
let currentTheme: keyof typeof themePresets = 'cyan';

// Theme cycle order (excludes orange - Bitcoin mode only)
const themeOrder: Array<keyof typeof themePresets> = ['cyan', 'purple', 'gold', 'green', 'yellow', 'crimson'];

// CRT effects toggle state
let crtEnabled = true;

// Debug panel toggle state
let debugEnabled = false;

// Colonel portrait cycling state
let currentColonelPortrait = 0; // 0, 1, 2 for the three portraits

// Model selection system
export type ModelType = 'gpt-4o-mini' | 'gpt-4o' | 'gpt-3.5-turbo' | 'mock';
let currentModel: ModelType = 'gpt-4o-mini'; // Default to most cost-effective

export const modelConfigs = {
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    cost: '$0.15/M tokens',
    description: 'Fast & affordable',
    default: true
  },
  'gpt-4o': {
    name: 'GPT-4o',
    cost: '$5.00/M tokens', 
    description: 'Most capable'
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    cost: '$0.50/M tokens',
    description: 'Balanced option'
  },
  'mock': {
    name: 'Mock Mode',
    cost: 'Free',
    description: 'Testing & development'
  }
} as const;

// Conversation mode system
export type ConversationMode = 'haywire' | 'jd' | 'lore' | 'bitcoin';
let currentMode: ConversationMode = 'haywire';

export const conversationModes = {
  haywire: 'GW [haywire]',
  jd: 'JD [Colonel AI]',
  lore: 'MGS [LORE]',
  bitcoin: 'BTC [Orange Pill]',
} as const;

// Dynamic theme getter - handles Bitcoin mode orange override
export const getCodecTheme = () => {
  // If in Bitcoin mode, force orange theme
  const activeTheme = currentMode === 'bitcoin' ? 'orange' : currentTheme;
  
  return {
    colors: themePresets[activeTheme],
  
  // CRT effects toggle
  crt: crtEnabled,
  
  fonts: {
    mono: 'Courier New', // Monospace for authentic terminal feel
    // MGS codec font family with fallbacks
    codec: '"TeX Gyre Heros", "Helvetica Neue", Helvetica, Arial, sans-serif',
    // Enhanced typography for readability
    body: '"TeX Gyre Heros", "Helvetica Neue", Helvetica, Arial, sans-serif',
    sizes: {
      caption: 12,
      body: 14,
      subtitle: 16,
      title: 18,
      header: 24,
    },
  },
  
  // Enhanced typography configuration for Priority 6
  typography: {
    // CSS properties for improved text handling
    whiteSpace: 'pre-wrap', // Preserve \n, wrap long tokens/URLs
    wordBreak: 'break-word', // Break long words
    overflowWrap: 'anywhere', // Break anywhere if needed
    lineHeight: 1.35, // Optimal readability
    letterSpacing: 0.2, // Subtle character spacing
    // CRT text shadow when enabled
    textShadow: crtEnabled ? '0 0 3px currentColor' : 'none',
    // Word-boundary streaming configuration
    streamBuffer: {
      flushDelay: 40, // 33-50ms flush on whitespace
      wordBoundary: /\s+/, // Whitespace regex for word boundaries
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
  };
};

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

// Theme cycling function - locked during Bitcoin mode
export const cycleTheme = () => {
  // If in Bitcoin mode, theme cycling is locked to orange
  if (currentMode === 'bitcoin') {
    return; // Don't cycle when in Bitcoin mode
  }
  
  const currentIndex = themeOrder.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % themeOrder.length;
  const nextTheme = themeOrder[nextIndex];
  changeTheme(nextTheme);
};

export const getThemeDisplayName = (theme?: keyof typeof themePresets): string => {
  // Show current effective theme (Bitcoin mode shows ORANGE)
  const effectiveTheme = currentMode === 'bitcoin' ? 'orange' : (theme || currentTheme);
  
  const displayNames: Record<keyof typeof themePresets, string> = {
    cyan: 'CYAN',
    purple: 'PURPLE',
    gold: 'GOLD', 
    green: 'GREEN',
    yellow: 'YELLOW',
    crimson: 'CRIMSON',
    orange: 'ORANGE' // Bitcoin mode only
  };
  return displayNames[effectiveTheme];
};

// Get current effective theme name (for debug panel)
export const getCurrentThemeName = (): string => {
  return getThemeDisplayName();
};

// Mode management functions
export const getCurrentMode = () => currentMode;

export const cycleMode = () => {
  const modes: ConversationMode[] = ['haywire', 'jd', 'lore', 'bitcoin'];
  const currentIndex = modes.indexOf(currentMode);
  currentMode = modes[(currentIndex + 1) % modes.length];
  notifyThemeChange(); // Theme may change based on mode
};

export const getModeDisplayName = (mode: ConversationMode = currentMode) => {
  return conversationModes[mode];
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

// Debug panel toggle functions
export const toggleDebug = () => {
  debugEnabled = !debugEnabled;
  notifyThemeChange();
};

export const setDebug = (enabled: boolean) => {
  debugEnabled = enabled;
  notifyThemeChange();
};

export const getDebugState = () => debugEnabled;

// Convenience function for components
export const isDebugEnabled = () => debugEnabled;

// Colonel portrait cycling functions
export const cycleColonelPortrait = () => {
  currentColonelPortrait = (currentColonelPortrait + 1) % 3; // 0, 1, 2
  notifyThemeChange(); // Notify components of the portrait change
};

export const getCurrentColonelPortrait = () => currentColonelPortrait;

export const setColonelPortrait = (index: number) => {
  if (index >= 0 && index <= 2) {
    currentColonelPortrait = index;
    notifyThemeChange();
  }
};

// Model selection functions
export const getCurrentModel = () => currentModel;

export const setModel = (model: ModelType) => {
  currentModel = model;
  notifyThemeChange(); // Notify components of model change
};

export const cycleModel = () => {
  const models: ModelType[] = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo', 'mock'];
  const currentIndex = models.indexOf(currentModel);
  currentModel = models[(currentIndex + 1) % models.length];
  notifyThemeChange();
};

export const getModelDisplayName = (model: ModelType = currentModel) => {
  return modelConfigs[model].name;
};

export const getModelConfig = (model: ModelType = currentModel) => {
  return modelConfigs[model];
};

// Stable tag helpers (pure functions that don't read reactive/global state)
const modeMapping = { haywire: 'GW', jd: 'JD', lore: 'MGS', bitcoin: 'BTC' } as const;
export const modeToAbbr = (m: string) =>
  modeMapping[m as keyof typeof modeMapping] ?? 'JD';

const modelMapping = { 'gpt-4o': 'gpt-4o', 'gpt-4o-mini': 'gpt-4o-mini', 'gpt-3.5-turbo': 'gpt-3.5-turbo', mock: 'mock' } as const;
export const modelToAbbr = (m: string) =>
  modelMapping[m as keyof typeof modelMapping] ?? 'gpt-4o-mini';

export const makeTag = (modeKey: string, modelKey: string) =>
  `[${modeToAbbr(modeKey)}]:[${modelToAbbr(modelKey)}]:`;

// Get current mode key helper for components
export const getCurrentModeKey = () => currentMode;

// Get current model key helper for components  
export const getCurrentModelKey = () => currentModel;

// Initialize model from localStorage if available
export const initializeModel = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedModel = window.localStorage.getItem('codecModelSelection');
      if (savedModel && savedModel in modelConfigs) {
        currentModel = savedModel as ModelType;
      }
    }
  } catch (error) {
    // localStorage not available or error - use default
    console.log('Model localStorage not available, using default');
  }
};

// Save model selection to localStorage
export const saveModelSelection = (model: ModelType) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('codecModelSelection', model);
    }
  } catch (error) {
    // localStorage not available - ignore
    console.log('Model localStorage not available for saving');
  }
};
