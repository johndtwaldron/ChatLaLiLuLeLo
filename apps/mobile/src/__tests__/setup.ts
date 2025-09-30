// Testing setup that runs AFTER Jest and React Native setup
// Additional test utilities and configurations

// Mock Expo modules (these don't conflict with React Native preset)
jest.mock('expo-constants', () => ({
  default: {
    statusBarHeight: 0,
    isDevice: true,
    deviceName: 'Test Device',
    systemFonts: [],
  },
  Constants: {
    statusBarHeight: 0,
    isDevice: true,
    deviceName: 'Test Device',
    systemFonts: [],
  },
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: jest.fn(() => null),
  setStatusBarStyle: jest.fn(),
  setStatusBarBackgroundColor: jest.fn(),
}));

// Additional test configuration
beforeEach(() => {
  jest.clearAllMocks();
});

// Custom render helper setup would go here in the future
// e.g., providers, theme wrappers, etc.
