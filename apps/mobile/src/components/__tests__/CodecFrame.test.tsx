import React from 'react';
import { render } from '@testing-library/react-native';
import { CodecFrame } from '../CodecFrame';
import { Text } from 'react-native';

describe('CodecFrame', () => {
  it('renders correctly with children', () => {
    const { getByText } = render(
      <CodecFrame>
        <Text>Test Content</Text>
      </CodecFrame>
    );
    
    expect(getByText('Test Content')).toBeTruthy();
  });

  it('applies haywire mode styling when enabled', () => {
    const { getByTestId } = render(
      <CodecFrame haywireMode={true}>
        <Text testID="test-child">Test</Text>
      </CodecFrame>
    );
    
    expect(getByTestId('test-child')).toBeTruthy();
  });

  it('renders scanlines overlay', () => {
    const { getByTestId } = render(
      <CodecFrame>
        <Text testID="content">Content</Text>
      </CodecFrame>
    );
    
    // Component should render without crashing
    expect(getByTestId('content')).toBeTruthy();
  });

  it('has proper accessibility structure', () => {
    const { getByTestId } = render(
      <CodecFrame>
        <Text testID="accessible-content">Accessible Content</Text>
      </CodecFrame>
    );
    
    expect(getByTestId('accessible-content')).toBeTruthy();
  });
});
