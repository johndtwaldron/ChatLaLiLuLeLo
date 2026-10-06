import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { downloadSessionLogs, sessionLogSource } from '@/lib/sessionLogs';
import { getCodecTheme } from '@/lib/theme';

export function SessionLogDownload() {
  const [error, setError] = useState(false);
  if (Platform.OS !== 'web') return null;
  const theme = getCodecTheme();
  return <View style={{ marginVertical: 8, gap: 6 }}>
    <Pressable accessibilityRole="button" onPress={() => { try { downloadSessionLogs(); setError(false); } catch { setError(true); } }} style={{ borderWidth: 1, borderColor: theme.colors.primary, padding: 10 }}>
      <Text style={{ color: theme.colors.primary, fontFamily: 'monospace' }}>DOWNLOAD {sessionLogSource().environment.toUpperCase()} LOGS (.TXT)</Text>
    </Pressable>
    <Text style={{ color: theme.colors.textSecondary, fontSize: 11 }}>Current page only; resets on refresh. Logs may include conversation text. Review before sharing.</Text>
    {error && <Text accessibilityRole="alert" style={{ color: theme.colors.primary }}>Download failed. Please try again.</Text>}
  </View>;
}
