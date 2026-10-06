import React, { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { getCodecTheme, subscribeToThemeChanges } from '@/lib/theme';
import { disconnectGoogleProfile, loadGoogleIdentity, profileFromCredential, requestGoogleProfilePhoto, saveGoogleProfile, useGoogleProfile } from '@/lib/googleProfile';

export function GoogleProfileLink() {
  const profile = useGoogleProfile();
  const [theme, setTheme] = useState(getCodecTheme());
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingPhoto, setFetchingPhoto] = useState(false);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const host = useRef<HTMLDivElement>(null);
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  useEffect(() => subscribeToThemeChanges(() => setTheme(getCodecTheme())), []);
  useEffect(() => {
    if (!open || profile || !clientId || Platform.OS !== 'web') return;
    let active = true;
    setError(null);
    setReady(false);
    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2, '0')).join('');
    loadGoogleIdentity().then(identity => {
      if (!active || !host.current) return;
      identity.initialize({ client_id: clientId, nonce, auto_select: false, callback: response => {
        if (!active) return;
        try {
          saveGoogleProfile(profileFromCredential(response.credential, clientId, nonce));
          setOpen(false);
        } catch (e) { setError((e as Error).message); }
      } });
      host.current.replaceChildren();
      identity.renderButton(host.current, { theme: 'outline', size: 'large', text: 'signin_with' });
      setReady(true);
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [open, clientId, profile, attempt]);

  if (Platform.OS !== 'web') return null;
  const textStyle = { color: theme.colors.primary, fontFamily: 'monospace' };
  const buttonStyle = [styles.button, { borderColor: theme.colors.primary, backgroundColor: theme.colors.background }];
  return <>
    <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={buttonStyle}>
      <Text style={[textStyle, styles.label]}>{profile ? 'GOOGLE NANOMACHINES: LINKED' : 'LINK GOOGLE NANOMACHINES'}</Text>
    </Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.overlay}>
        <View style={[styles.panel, { backgroundColor: theme.colors.background, borderColor: theme.colors.primary }]}>
          <Text style={[textStyle, styles.title]}>GOOGLE NANOMACHINES</Text>
          <Text style={[textStyle, styles.description]}>{profile ? `Linked as ${profile.firstName}.` : 'Link your Google first name and profile picture to the Codec.'}</Text>
          <Text style={[textStyle, styles.description]}>Your name and photo last only for this Codec session. They are not sent with chat messages.</Text>
          {profile && !profile.picture && <Text style={[textStyle, styles.description]}>Google sign-in did not include your photo. Fetch it directly from your Google profile using the button below.</Text>}
          {profile && clientId && <>
            <Text style={[textStyle, styles.description]}>Fetch requests basic Google profile access. Choose the same account. Google may remember your consent; the Codec keeps your photo only until disconnect or this page closes.</Text>
            <Pressable accessibilityRole="button" disabled={fetchingPhoto} style={buttonStyle} onPress={() => {
              setError(null);
              setFetchingPhoto(true);
              requestGoogleProfilePhoto(clientId).then(() => setOpen(false)).catch(e => setError(e.message)).finally(() => setFetchingPhoto(false));
            }}><Text style={textStyle}>{fetchingPhoto ? 'FETCHING GOOGLE PHOTO…' : 'FETCH GOOGLE PROFILE PHOTO'}</Text></Pressable>
            {error && <Text accessibilityRole="alert" style={[textStyle, styles.description]}>{error}</Text>}
          </>}
          {profile ? <Pressable accessibilityRole="button" style={buttonStyle} onPress={() => { disconnectGoogleProfile(); setOpen(false); }}>
            <Text style={textStyle}>DISCONNECT GOOGLE</Text>
          </Pressable> : !clientId ? <Text style={[textStyle, styles.description]}>Google linking needs an app client ID before it can connect.</Text> : <>
            {!ready && !error && <Text style={textStyle}>CONNECTING…</Text>}
            {React.createElement('div', { ref: host, style: { minHeight: 44, marginBottom: 12 } })}
            {error && <><Text accessibilityRole="alert" style={[textStyle, styles.description]}>{error}</Text>
              <Pressable accessibilityRole="button" style={buttonStyle} onPress={() => setAttempt(n => n + 1)}><Text style={textStyle}>TRY AGAIN</Text></Pressable></>}
          </>}
          <Pressable accessibilityRole="button" style={buttonStyle} onPress={() => setOpen(false)}><Text style={textStyle}>CLOSE</Text></Pressable>
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
