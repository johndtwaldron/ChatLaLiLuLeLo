import Constants from 'expo-constants';

// Captured by Expo at bundle/start time, never substituted with page-load time.
export const buildInfo: { version: string; timestamp: string; commit: string; kind: string } =
  Constants.expoConfig?.extra?.codecBuild ?? { version: 'unavailable', timestamp: 'unavailable', commit: 'unknown', kind: 'unknown' };
export const buildInfoText = () => `Codec version (VRMF): ${buildInfo.version}\nBuild time (UTC): ${buildInfo.timestamp}\nBuild commit: ${buildInfo.commit}\nBuild kind: ${buildInfo.kind}`;
