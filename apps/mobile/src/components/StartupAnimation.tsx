import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { playCodecStartup } from '@/lib/audio';
import { getCodecTheme } from '@/lib/theme';

interface StartupAnimationProps {
  onComplete: () => void;
  skipAnimation?: boolean;
}

interface TerminalLineData {
  text: string;
  delay: number;
  color?: string;
}

export const StartupAnimation: React.FC<StartupAnimationProps> = ({ 
  onComplete, 
  skipAnimation = false 
}) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [showScanlines, setShowScanlines] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scanlineAnim = useRef(new Animated.Value(0)).current;
  const glitchAnim = useRef(new Animated.Value(0)).current;
  const theme = getCodecTheme();

  // MGS2-style boot sequence text
  const terminalLines: TerminalLineData[] = [
    { text: '> INITIALIZING CODEC COMMUNICATION SYSTEM...', delay: 500 },
    { text: '> FREQUENCY: 140.85', delay: 300 },
    { text: '> ESTABLISHING SECURE CHANNEL...', delay: 400 },
    { text: '> [██████████] 100%', delay: 600 },
    { text: '> HANDSHAKE PROTOCOL: ACKNOWLEDGED', delay: 300 },
    { text: '> ENCRYPTION: AES-256 ACTIVE', delay: 250 },
    { text: '> CODEC LINK ESTABLISHED', delay: 400, color: theme.colors.primary },
    { text: '', delay: 300 }, // Empty line for spacing
    { text: 'CHATLALILULELO.JDW', delay: 400, color: theme.colors.primary },
    { text: 'METAL GEAR SOLID 2 COMMUNICATION INTERFACE', delay: 500, color: theme.colors.secondary },
    { text: '', delay: 300 },
    { text: '> SYSTEM ONLINE', delay: 800, color: theme.colors.primary },
  ];

  useEffect(() => {
    if (skipAnimation) {
      onComplete();
      return;
    }

    startAnimation();
  }, [skipAnimation]);

  const startAnimation = async () => {
    try {
      // Start audio
      await playCodecStartup();
    } catch (error) {
      console.warn('[STARTUP] Audio failed to play:', error);
    }

    // Start fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Start scanline animation
    startScanlineAnimation();

    // Start glitch effect
    startGlitchEffect();

    // Begin terminal sequence
    setTimeout(() => {
      showTerminalSequence();
    }, 800);
  };

  const startScanlineAnimation = () => {
    const animate = () => {
      scanlineAnim.setValue(0);
      Animated.timing(scanlineAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        if (showScanlines) {
          setTimeout(animate, 100);
        }
      });
    };
    animate();
  };

  const startGlitchEffect = () => {
    const glitch = () => {
      Animated.sequence([
        Animated.timing(glitchAnim, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(glitchAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (showScanlines) {
          setTimeout(glitch, Math.random() * 3000 + 1000);
        }
      });
    };
    
    setTimeout(glitch, 1000);
  };

  const showTerminalSequence = () => {
    let lineIndex = 0;

    const showNextLine = () => {
      if (lineIndex >= terminalLines.length) {
        // Sequence complete - start exit animation
        setTimeout(() => {
          completeStartup();
        }, 1000);
        return;
      }

      setCurrentLineIndex(lineIndex);
      lineIndex++;

      setTimeout(showNextLine, terminalLines[lineIndex - 1]?.delay || 300);
    };

    showNextLine();
  };

  const completeStartup = () => {
    setShowScanlines(false);

    // Fade out animation
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      onComplete();
    });
  };

  const scanlineTranslateY = scanlineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, Dimensions.get('window').height + 50],
  });

  const glitchTranslateX = glitchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 5],
  });

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: fadeAnim,
          transform: [{ translateX: glitchTranslateX }]
        }
      ]}
    >
      <StatusBar hidden />
      
      {/* Background gradient */}
      <LinearGradient
        colors={[
          'rgba(0, 0, 0, 1)',
          'rgba(0, 20, 20, 0.9)',
          'rgba(0, 0, 0, 1)',
        ]}
        style={StyleSheet.absoluteFill}
      />

      {/* Scanline effect */}
      {showScanlines && (
        <Animated.View
          style={[
            styles.scanline,
            {
              transform: [{ translateY: scanlineTranslateY }],
              backgroundColor: theme.colors.primary,
            },
          ]}
        />
      )}

      {/* Terminal content */}
      <View style={styles.terminal}>
        <View style={styles.header}>
          <View style={[styles.headerBar, { backgroundColor: theme.colors.primary }]} />
          <Text style={[styles.headerText, { color: theme.colors.primary }]}>
            CODEC COMMUNICATION TERMINAL
          </Text>
          <View style={[styles.headerBar, { backgroundColor: theme.colors.primary }]} />
        </View>

        <View style={styles.content}>
          {terminalLines.slice(0, currentLineIndex + 1).map((line, index) => (
            <TerminalLine
              key={index}
              text={line.text}
              color={line.color || theme.colors.text}
              isLast={index === currentLineIndex}
            />
          ))}
        </View>

        {/* Codec frequency indicator */}
        <View style={styles.frequencyIndicator}>
          <Text style={[styles.frequencyText, { color: theme.colors.secondary }]}>
            140.85 MHz
          </Text>
          <View style={styles.signalBars}>
            {[...Array(5)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.signalBar,
                  {
                    backgroundColor: theme.colors.primary,
                    height: 4 + (i * 3),
                    opacity: currentLineIndex > 2 ? 1 : 0.3,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Grid overlay effect */}
      <View style={styles.gridOverlay}>
        {[...Array(20)].map((_, i) => (
          <View
            key={`h-${i}`}
            style={[
              styles.gridLine,
              styles.horizontalLine,
              {
                top: (i * Dimensions.get('window').height) / 20,
                backgroundColor: theme.colors.primary,
                opacity: 0.05,
              },
            ]}
          />
        ))}
        {[...Array(15)].map((_, i) => (
          <View
            key={`v-${i}`}
            style={[
              styles.gridLine,
              styles.verticalLine,
              {
                left: (i * Dimensions.get('window').width) / 15,
                backgroundColor: theme.colors.primary,
                opacity: 0.05,
              },
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
};

// Individual terminal line component with typewriter effect
const TerminalLine: React.FC<{ 
  text: string; 
  color: string; 
  isLast: boolean 
}> = ({ text, color, isLast }) => {
  const [displayText, setDisplayText] = useState('');
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (text === '') {
      setDisplayText('');
      return;
    }

    // Typewriter effect
    let currentIndex = 0;
    const typeInterval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, 30);

    return () => clearInterval(typeInterval);
  }, [text]);

  useEffect(() => {
    if (isLast && text !== '') {
      // Blinking cursor effect
      const blink = () => {
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => blink());
      };
      blink();
    }
  }, [isLast, text]);

  if (text === '') {
    return <View style={styles.emptyLine} />;
  }

  return (
    <View style={styles.terminalLineContainer}>
      <Text style={[styles.terminalLine, { color }]}>
        {displayText}
        {isLast && (
          <Animated.Text style={[{ color, opacity: blinkAnim }]}>
            █
          </Animated.Text>
        )}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  terminal: {
    width: '90%',
    maxWidth: 500,
    minHeight: 400,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 2,
    borderColor: '#00FFFF',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerBar: {
    flex: 1,
    height: 1,
  },
  headerText: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    paddingHorizontal: 15,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    minHeight: 300,
  },
  terminalLineContainer: {
    marginVertical: 2,
  },
  terminalLine: {
    fontSize: 13,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  emptyLine: {
    height: 18,
    marginVertical: 2,
  },
  frequencyIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  frequencyText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  signalBar: {
    width: 4,
    backgroundColor: '#00FFFF',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  gridLine: {
    position: 'absolute',
  },
  horizontalLine: {
    left: 0,
    right: 0,
    height: 1,
  },
  verticalLine: {
    top: 0,
    bottom: 0,
    width: 1,
  },
});
