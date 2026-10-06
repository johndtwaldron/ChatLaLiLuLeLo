import { useGoogleProfile } from '@/lib/googleProfile';
import { buildInfo } from '@/lib/buildInfo';
import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { downloadSessionLogs, sessionLogSource } from '@/lib/sessionLogs';
import { getCodecTheme } from '@/lib/theme';

export function SessionLogDownload() {
  const profile = useGoogleProfile();
  const dimensions = (value?: { width: number; height: number }) => value ? `${value.width} × ${value.height}` : 'unavailable';
  const [error, setError] = useState(false);
  if (Platform.OS !== 'web') return null;
  const theme = getCodecTheme();
  return <View style={{ marginVertical: 8, gap: 6 }}>
    <Text style={{ color: theme.colors.textSecondary, fontSize: 11, fontFamily: 'monospace' }}>BUILD (UTC): {buildInfo.timestamp}{'\n'}COMMIT: {buildInfo.commit.slice(0, 12)} · {buildInfo.kind}</Text>
    {profile?.picture && <Text style={{ color: theme.colors.textSecondary, fontSize: 11, fontFamily: 'monospace' }}>PHOTO thumbnail: {dimensions(profile.photoDimensions?.thumbnail)}{'\n'}PHOTO larger: {dimensions(profile.photoDimensions?.large)}{'\n'}AI photo: {profile.largePicture ? 'larger version' : 'thumbnail'}</Text>}
    <Pressable accessibilityRole="button" onPress={() => { try { downloadSessionLogs(); setError(false); } catch { setError(true); } }} style={{ borderWidth: 1, borderColor: theme.colors.primary, padding: 10 }}>
      <Text style={{ color: theme.colors.primary, fontFamily: 'monospace' }}>DOWNLOAD {sessionLogSource().environment.toUpperCase()} LOGS (.TXT)</Text>
    </Pressable>
    <Text style={{ color: theme.colors.textSecondary, fontSize: 11 }}>Current page only; resets on refresh. Logs may include conversation text. Review before sharing.</Text>
    {error && <Text accessibilityRole="alert" style={{ color: theme.colors.primary }}>Download failed. Please try again.</Text>}
  </View>;
}
