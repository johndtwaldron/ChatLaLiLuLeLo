import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { getCodecTheme, subscribeToThemeChanges } from '@/lib/theme';
import { 
  validateLightningAddress, 
  getLightningQRData, 
  getQRCodeSize, 
  LIGHTNING_CONFIG,
  DEFAULT_LIGHTNING_ADDRESS 
} from '@/lib/lightning';
import { LIGHTNING_DONATION_CONFIG } from '@/config/lightning.config';
import { playRationsSound } from '@/lib/audio';

interface LightningQRProps {
  lightningAddress?: string;
  size?: 'small' | 'medium' | 'large';
  showAddress?: boolean;
  showCopyButton?: boolean;
  onCopy?: (success: boolean) => void;
}

export const LightningQR: React.FC<LightningQRProps> = ({
  lightningAddress = DEFAULT_LIGHTNING_ADDRESS,
  size = 'small',
  showAddress = true,
  showCopyButton = true,
  onCopy
}) => {
  const [currentTheme, setCurrentTheme] = useState(getCodecTheme());
  const [qrData, setQrData] = useState<string>('');
  const [isValidAddress, setIsValidAddress] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');

  // Subscribe to theme changes
  useEffect(() => {
    const unsubscribe = subscribeToThemeChanges(() => {
      setCurrentTheme(getCodecTheme());
    });
    return unsubscribe;
  }, []);

  // Validate and prepare QR data when address changes
  useEffect(() => {
    try {
      const validation = validateLightningAddress(lightningAddress);
      if (validation.isValid && validation.address) {
        const data = getLightningQRData(lightningAddress);
        setQrData(data);
        setIsValidAddress(true);
      } else {
        setIsValidAddress(false);
        setQrData('');
      }
    } catch (error) {
      console.warn('[LIGHTNING QR] Invalid address:', error);
      setIsValidAddress(false);
      setQrData('');
    }
  }, [lightningAddress]);

  // Copy lightning address to clipboard
  const handleCopy = useCallback(async () => {
    if (!isValidAddress || !lightningAddress) {
      return;
    }

    setCopyStatus('copying');

    try {
      if (Platform.OS === 'web') {
        // Web platform
        await navigator.clipboard.writeText(lightningAddress);
      } else {
        // Native platforms
        await Clipboard.setStringAsync(lightningAddress);
      }
      
      setCopyStatus('success');
      onCopy?.(true);
      
      // Play the specific rations sound for Lightning donation copy
      try {
        await playRationsSound();
        console.log('[LIGHTNING QR] Rations sound played for successful copy');
      } catch (audioError) {
        console.warn('[LIGHTNING QR] Failed to play rations sound:', audioError);
      }
      
      // Reset status after 2 seconds
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('[LIGHTNING QR] Copy failed:', error);
      setCopyStatus('error');
      onCopy?.(false);
      
      // Reset status after 2 seconds
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  }, [isValidAddress, lightningAddress, onCopy]);

  // Get QR code size based on prop
  const qrSize = getQRCodeSize(
    size === 'small' ? 'portrait' : 
    size === 'medium' ? 'modal' : 'fullscreen'
  );

  // QR code colors based on theme (but ensure good contrast)
  const qrFgColor = currentTheme.colors.text || '#000000';
  const qrBgColor = currentTheme.colors.surface || '#ffffff';

  // Copy button styling
  const getCopyButtonStyle = () => ({
    backgroundColor: copyStatus === 'success' ? '#28a745' : 
                     copyStatus === 'error' ? '#dc3545' : 
                     'rgba(0, 0, 0, 0.7)',
    borderColor: copyStatus === 'success' ? '#28a745' : 
                 copyStatus === 'error' ? '#dc3545' : 
                 currentTheme.colors.primary,
  });

  const getCopyButtonText = () => {
    switch (copyStatus) {
      case 'copying': return '⚡ COPYING...';
      case 'success': return '✅ COPIED!';
      case 'error': return '❌ FAILED';
      default: return '⚡ COPY';
    }
  };

  if (!isValidAddress || !qrData) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.colors.surface }]}>
        <Text style={[styles.errorText, { color: currentTheme.colors.primary }]}>
          INVALID
        </Text>
        <Text style={[styles.errorText, { color: currentTheme.colors.primary }]}>
          LIGHTNING
        </Text>
        <Text style={[styles.errorText, { color: currentTheme.colors.primary }]}>
          ADDRESS
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.colors.surface }]}>
      {/* QR Code */}
      <View style={[styles.qrContainer, { backgroundColor: qrBgColor }]}>
        <QRCode
          value={qrData}
          size={qrSize}
          backgroundColor={qrBgColor}
          color={qrFgColor}
          logo={undefined}
          logoSize={0}
          logoBackgroundColor="transparent"
          logoMargin={2}
          logoBorderRadius={0}
          quietZone={2}
        />
      </View>

      {/* Lightning Address Display */}
      {showAddress && (
        <Text style={[styles.address, { color: currentTheme.colors.text }]} numberOfLines={2}>
          {lightningAddress}
        </Text>
      )}

      {/* Copy Button */}
      {showCopyButton && (
        <Pressable
          onPress={handleCopy}
          style={[styles.copyButton, getCopyButtonStyle()]}
          disabled={copyStatus === 'copying'}
        >
          <Text style={[styles.copyButtonText, { 
            color: copyStatus === 'success' ? '#ffffff' :
                   copyStatus === 'error' ? '#ffffff' :
                   currentTheme.colors.primary 
          }]}>
            {getCopyButtonText()}
          </Text>
        </Pressable>
      )}

      {/* Donation Message */}
      <View style={styles.donationMessage}>
        <Text style={[styles.donationText, { color: '#FF8C00' }]}>
          {LIGHTNING_DONATION_CONFIG.messages.donationMessage}
        </Text>
      </View>

      {/* Bitcoin Mode Indicator */}
      <View style={styles.modeIndicator}>
        <Text style={[styles.modeText, { color: currentTheme.colors.primary }]}>
          BTC MODE
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 120,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  qrContainer: {
    padding: 2,
    borderRadius: 2,
    marginBottom: 4,
  },
  
  address: {
    fontSize: 8,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 10,
  },
  
  copyButton: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderRadius: 2,
    marginBottom: 2,
  },
  
  copyButtonText: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  donationMessage: {
    position: 'absolute',
    bottom: -60, // Position below the QR container
    left: -40,   // Extend beyond container width
    right: -40,  // Extend beyond container width
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FF8C00', // Bitcoin orange border
  },
  
  donationText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 11,
    // Orange color will be set inline as #FF8C00
  },

  modeIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  
  modeText: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    opacity: 0.7,
  },
  
  errorText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 12,
  },
});
