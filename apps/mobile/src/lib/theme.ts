export const codecTheme = {
  colors: {
    // Codec green palette
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
} as const;

export type CodecTheme = typeof codecTheme;
