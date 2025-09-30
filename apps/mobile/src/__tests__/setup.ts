// Testing setup for React Native components

// Mock React Native Reanimated with basic implementation
jest.mock('react-native-reanimated', () => {
  return {
    default: {
      View: require('react-native').View,
    },
    useSharedValue: (initial: any) => ({ value: initial }),
    useAnimatedStyle: (styleFunction: () => any) => styleFunction(),
    withTiming: (value: any) => value,
    withRepeat: (value: any) => value,
    withSequence: (...values: any[]) => values[0],
    interpolate: (value: number, inputRange: number[], outputRange: number[]) => outputRange[0],
    runOnJS: (fn: () => void) => fn,
    withDelay: (value: any) => value,
    withSpring: (value: any) => value,
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

// Mock Dimensions globally
jest.mock('react-native/Libraries/Utilities/Dimensions', () => {
  const dimensions = {
    get: jest.fn(() => ({ width: 375, height: 812 })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  return dimensions;
});

// Mock PixelRatio globally
jest.mock('react-native/Libraries/Utilities/PixelRatio', () => {
  const pixelRatio = {
    get: jest.fn(() => 2),
    getFontScale: jest.fn(() => 1),
    getPixelSizeForLayoutSize: jest.fn((layoutSize: number) => layoutSize * 2),
    roundToNearestPixel: jest.fn((layoutSize: number) => Math.round(layoutSize)),
    startDetecting: jest.fn(),
  };
  return pixelRatio;
});

// Mock React Native Gesture Handler
jest.mock('react-native-gesture-handler', () => {
  const View = jest.fn(() => null);
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(component => component),
    Directions: {},
  };
});

// Silence console warnings in tests
(global as any).console = {
  ...console,
  warn: jest.fn(),
  log: jest.fn(),
};
