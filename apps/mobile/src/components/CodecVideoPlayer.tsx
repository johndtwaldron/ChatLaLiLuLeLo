import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Text,
  Platform,
} from 'react-native';
import { getCodecTheme } from '@/lib/theme';

interface CodecVideoPlayerProps {
  visible: boolean;
  videoPath: string;
  onClose: () => void;
}

/**
 * Codec-themed video player for secret command playback.
 * Displays videos with MGS2 codec aesthetic overlay.
 */
export const CodecVideoPlayer: React.FC<CodecVideoPlayerProps> = ({
  visible,
  videoPath,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = getCodecTheme();

  useEffect(() => {
    if (visible && videoRef.current) {
      setIsLoading(true);
      setError(null);
      
      const video = videoRef.current;
      
      // Event handlers
      const handleCanPlay = () => {
        setIsLoading(false);
        video.play().catch(err => {
          console.error('Video autoplay failed:', err);
          setError('Click to play video');
        });
      };
      
      const handleError = () => {
        setIsLoading(false);
        setError('Video file not found. Ensure the file is in /material directory.');
      };
      
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);
      
      // Load video
      video.load();
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
        video.pause();
      };
    }
  }, [visible, videoPath]);

  if (!visible) return null;

  // Web-only implementation (React Native video requires expo-av)
  if (Platform.OS !== 'web') {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.container, { borderColor: theme.colors.primary }]}>
            <Text style={[styles.errorText, { color: theme.colors.primary }]}>
              Video playback only available on web platform
            </Text>
            <Pressable
              style={[styles.closeButton, { borderColor: theme.colors.primary }]}
              onPress={onClose}
            >
              <Text style={[styles.closeButtonText, { color: theme.colors.primary }]}>
                CLOSE
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View
          style={[
            styles.container,
            {
              borderColor: theme.colors.primary,
              backgroundColor: theme.colors.background,
            },
          ]}
          // Prevent modal close when clicking video
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <Pressable
            style={[
              styles.closeButton,
              {
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.surface,
              },
            ]}
            onPress={onClose}
          >
            <Text style={[styles.closeButtonText, { color: theme.colors.primary }]}>
              CLOSE [ESC]
            </Text>
          </Pressable>

          {/* Video container */}
          <View style={styles.videoContainer}>
            {isLoading && (
              <View style={styles.statusOverlay}>
                <Text style={[styles.statusText, { color: theme.colors.primary }]}>
                  LOADING VIDEO...
                </Text>
              </View>
            )}
            
            {error && (
              <View style={styles.statusOverlay}>
                <Text style={[styles.errorText, { color: theme.colors.tertiary }]}>
                  {error}
                </Text>
              </View>
            )}

            {/* HTML5 Video Element */}
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
              controls
              playsInline
            >
              <source src={videoPath} type="video/mp4" />
            </video>
          </View>

          {/* Codec-style overlay border */}
          <View
            style={[
              styles.overlayBorder,
              {
                borderColor: theme.colors.primary,
              },
            ]}
            pointerEvents="none"
          />
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  container: {
    width: '90%',
    maxWidth: 1200,
    aspectRatio: 16 / 9,
    borderWidth: 3,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderRadius: 4,
    zIndex: 100,
  },
  
  closeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  
  statusOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 50,
  },
  
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  
  errorText: {
    fontSize: 16,
    fontFamily: 'monospace',
    letterSpacing: 1,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  
  overlayBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderRadius: 8,
    pointerEvents: 'none',
  },
});
