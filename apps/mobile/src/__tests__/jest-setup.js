// Jest setup file that runs before tests
// Working with React Native preset's built-in mocks

// Override Dimensions mock after React Native preset loads
jest.doMock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn(() => ({ width: 375, height: 812 })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Simple Reanimated mock that works with React Native preset
jest.doMock('react-native-reanimated', () => {
  return {
    default: {
      View: 'Animated.View',
    },
    View: 'Animated.View',
    Text: 'Animated.Text', 
    ScrollView: 'Animated.ScrollView',
    Image: 'Animated.Image',
    interpolate: jest.fn(),
    useSharedValue: jest.fn((initial) => ({ value: initial })),
    useAnimatedStyle: jest.fn((fn) => fn()),
    withTiming: jest.fn((value) => value),
    withSpring: jest.fn((value) => value),
    withRepeat: jest.fn((value) => value),
    withSequence: jest.fn((...values) => values[0]),
    withDelay: jest.fn((delay, value) => value),
    runOnJS: jest.fn((fn) => fn),
    runOnUI: jest.fn((fn) => fn),
    Easing: {
      linear: jest.fn(),
      ease: jest.fn(),
      quad: jest.fn(),
      cubic: jest.fn(),
    },
  };
});

// Global console setup
global.console = {
  ...console,
  warn: jest.fn(),
  log: jest.fn(),
  error: jest.fn(),
};
