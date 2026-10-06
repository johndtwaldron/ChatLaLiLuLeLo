import React from 'react';
import { Text } from 'react-native';
import { buildInfo } from '@/lib/buildInfo';

export const VersionLabel: React.FC = () => (
  <Text style={{ fontSize: 10, lineHeight: 16, textAlign: 'center', color: '#7daaaa', fontFamily: 'monospace', paddingHorizontal: 8, paddingVertical: 2 }}>
    VERSION {buildInfo.version}
  </Text>
);
