// Testing setup for React Native components

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  
  // Mock specific reanimated functions we use
  Reanimated.default.call = () => {};
  
  return {
    ...Reanimated,
    useSharedValue: (initial: any) => ({ value: initial }),
    useAnimatedStyle: (styleFunction: () => any) => styleFunction(),
    withTiming: (value: any) => value,
    withRepeat: (value: any) => value,
    withSequence: (...values: any[]) => values[0],
    interpolate: (value: number, inputRange: number[], outputRange: number[]) => outputRange[0],
    runOnJS: (fn: () => void) => fn,
  };
});

// Mock Expo modules
jest.mock('expo-constants', () => ({
  Constants: {
    statusBarHeight: 0,
    isDevice: true,
  },
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Mock Dimensions
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn(() => ({ width: 375, height: 812 })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  log: jest.fn(),
};
