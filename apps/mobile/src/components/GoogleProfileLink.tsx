import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { getCodecTheme, subscribeToThemeChanges } from '@/lib/theme';
import { disconnectGoogleProfile, loadGoogleIdentity, requestGoogleProfilePhoto, useGoogleProfile } from '@/lib/googleProfile';

interface Props { activation?: boolean; onComplete?: () => void }

export function GoogleProfileLink({ activation = false, onComplete }: Props) {
  const profile = useGoogleProfile();
  const [theme, setTheme] = useState(getCodecTheme());
  const [open, setOpen] = useState(activation);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  useEffect(() => subscribeToThemeChanges(() => setTheme(getCodecTheme())), []);
  useEffect(() => {
    if (!open || profile || !clientId || Platform.OS !== 'web') return;
    let active = true;
    setError(null);
    setReady(false);
    loadGoogleIdentity().then(() => { if (active) setReady(true); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [open, clientId, profile, attempt]);

  if (Platform.OS !== 'web') return null;
  const finish = () => { setOpen(false); onComplete?.(); };
  const dismiss = () => { if (busy) disconnectGoogleProfile(); finish(); };
  const sync = () => {
    if (!clientId || busy) return;
    setError(null);
    setBusy(true);
    requestGoogleProfilePhoto(clientId).then(finish).catch(e => setError(e.message)).finally(() => setBusy(false));
  };
  const textStyle = { color: theme.colors.primary, fontFamily: 'monospace' };
  const buttonStyle = [styles.button, { borderColor: theme.colors.primary, backgroundColor: theme.colors.background }];
  return <>
    {!activation && <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={buttonStyle}>
      <Text style={[textStyle, styles.label]}>NANOMACHINE SYNC</Text>
    </Pressable>}
    <Modal visible={open} transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.overlay}>
        <View style={[styles.panel, { backgroundColor: theme.colors.background, borderColor: theme.colors.primary }]}>
          <Text style={[textStyle, styles.title]}>NANOMACHINE SYNC</Text>
          <Text style={[textStyle, styles.description]}>{profile ? `Synced as ${profile.firstName}.` : 'Sync your Google name and profile photo before opening the Codec, or continue without syncing.'}</Text>
          <Text style={[textStyle, styles.description]}>Your name and photo stay only in this page instance and clear on disconnect or page exit. Google may remember your consent.</Text>
          {profile ? <Pressable accessibilityRole="button" style={buttonStyle} onPress={() => { disconnectGoogleProfile(); setError(null); }}>
            <Text style={textStyle}>DISCONNECT GOOGLE</Text>
          </Pressable> : <>
            {!clientId && <Text style={[textStyle, styles.description]}>Google syncing needs an app client ID before it can connect.</Text>}
            {clientId && <Pressable accessibilityRole="button" disabled={!ready || busy} style={[buttonStyle, { opacity: ready && !busy ? 1 : 0.5 }]} onPress={sync}>
              <Text style={textStyle}>{busy ? 'SYNCING…' : ready ? 'SYNC WITH GOOGLE' : 'CONNECTING…'}</Text>
            </Pressable>}
          </>}
          {error && <><Text accessibilityRole="alert" style={[textStyle, styles.description]}>{error}</Text>
            {!ready && <Pressable accessibilityRole="button" style={buttonStyle} onPress={() => setAttempt(n => n + 1)}><Text style={textStyle}>TRY AGAIN</Text></Pressable>}
          </>}
          <Pressable accessibilityRole="button" style={buttonStyle} onPress={dismiss}>
            <Text style={textStyle}>{activation ? 'ACTIVATE CODEC WITHOUT SYNC' : 'CLOSE'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  button: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 8, alignSelf: 'flex-end' },
  label: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  description: { fontSize: 13, lineHeight: 20, marginBottom: 16 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)', padding: 20 },
  panel: { width: '100%', maxWidth: 400, padding: 24, borderWidth: 1, gap: 12 },
});
