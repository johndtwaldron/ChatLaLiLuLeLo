import React from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';

import { ChatScreen } from './src/features/chat/ChatScreen';

export default function App() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#000000" />
      <ChatScreen />
    </>
  );
}
