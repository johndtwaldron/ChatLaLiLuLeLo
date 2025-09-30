import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { codecTheme } from '../../lib/theme';

/**
 * Test utilities for ChatLaLiLuLeLo components
 * These utilities will evolve as we add more features like state management, routing, etc.
 */

// Mock message factory for consistent test data
export const createMockMessage = (overrides: Partial<{
  id: string;
  text: string;
  speaker: 'colonel' | 'user';
  timestamp: number;
}> = {}) => ({
  id: Math.random().toString(),
  text: 'Test message',
  speaker: 'colonel' as const,
  timestamp: Date.now(),
  ...overrides,
});

// Create multiple mock messages for testing lists
export const createMockMessages = (count: number) => 
  Array.from({ length: count }, (_, i) => createMockMessage({
    id: i.toString(),
    text: `Test message ${i + 1}`,
    speaker: i % 2 === 0 ? 'colonel' : 'user',
    timestamp: Date.now() - (count - i) * 1000,
  }));

// Theme-aware test helpers
export const getCodecColor = (colorKey: keyof typeof codecTheme.colors) => 
  codecTheme.colors[colorKey];

// Animation test helpers
export const waitForAnimation = () => 
  new Promise(resolve => setTimeout(resolve, 100));

// Custom render function that can be extended with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Future: add state providers, navigation providers, etc.
  initialState?: any;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options?: CustomRenderOptions
) => {
  // Currently just wraps standard render, but can be extended with:
  // - Redux/Zustand providers
  // - Navigation providers  
  // - Theme providers
  // - Mock API providers
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  };

  return render(ui, { wrapper: Wrapper, ...options });
};

// Accessibility test helpers
export const testAccessibility = {
  hasAccessibilityLabel: (element: any) => 
    expect(element).toHaveProp('accessibilityLabel'),
  
  hasAccessibilityRole: (element: any, role: string) =>
    expect(element).toHaveProp('accessibilityRole', role),
  
  isAccessible: (element: any) =>
    expect(element).toHaveProp('accessible', true),
};

// Performance test helpers (for future use)
export const performanceTests = {
  // Placeholder for performance testing utilities
  measureRenderTime: () => {
    // TODO: Implement when we add performance testing
  },
  
  checkMemoryLeaks: () => {
    // TODO: Implement memory leak detection
  },
};

// Integration test helpers
export const integrationHelpers = {
  // Simulate user interactions for codec interface
  simulateCodecInteraction: async () => {
    // TODO: Add interaction simulation helpers
    // - Simulate portrait animations
    // - Simulate text streaming
    // - Simulate mode switching
  },
  
  // Test conversation flow
  simulateConversation: async (_messages: any[]) => {
    // TODO: Test complete conversation flows
  },
};

export default {
  createMockMessage,
  createMockMessages,
  getCodecColor,
  waitForAnimation,
  renderWithProviders,
  testAccessibility,
  performanceTests,
  integrationHelpers,
};
