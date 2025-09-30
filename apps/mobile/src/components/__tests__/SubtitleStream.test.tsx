import React from 'react';
import { render } from '@testing-library/react-native';
import { SubtitleStream } from '../SubtitleStream';

const mockMessages = [
  {
    id: '1',
    text: 'Test message 1',
    speaker: 'colonel' as const,
    timestamp: Date.now() - 1000,
  },
  {
    id: '2', 
    text: 'Test message 2',
    speaker: 'user' as const,
    timestamp: Date.now(),
  },
];

describe('SubtitleStream', () => {
  it('renders frequency indicator', () => {
    const { getByText } = render(
      <SubtitleStream messages={[]} />
    );
    
    expect(getByText('140.85')).toBeTruthy();
  });

  it('renders messages correctly', () => {
    const { getByText } = render(
      <SubtitleStream messages={mockMessages} />
    );
    
    expect(getByText('Test message 1')).toBeTruthy();
    expect(getByText('Test message 2')).toBeTruthy();
  });

  it('shows correct speaker labels', () => {
    const { getByText } = render(
      <SubtitleStream messages={mockMessages} />
    );
    
    // Look for speaker indicators
    expect(getByText('>>>')).toBeTruthy(); // Colonel
    expect(getByText('<<<')).toBeTruthy(); // User
  });

  it('displays message count', () => {
    const { getByText } = render(
      <SubtitleStream messages={mockMessages} />
    );
    
    expect(getByText('2 MSGS')).toBeTruthy();
  });

  it('shows streaming status when active', () => {
    const { getByText } = render(
      <SubtitleStream 
        messages={[]} 
        isStreaming={true}
        currentStreamText="Streaming..."
      />
    );
    
    expect(getByText('[RECEIVING...]')).toBeTruthy();
  });

  it('shows standby status when not streaming', () => {
    const { getByText } = render(
      <SubtitleStream messages={[]} isStreaming={false} />
    );
    
    expect(getByText('[STANDBY]')).toBeTruthy();
  });

  it('renders signal indicator', () => {
    const { getByText } = render(
      <SubtitleStream messages={[]} />
    );
    
    expect(getByText('140.85')).toBeTruthy();
  });

  it('handles empty messages array', () => {
    const { getByText } = render(
      <SubtitleStream messages={[]} />
    );
    
    expect(getByText('0 MSGS')).toBeTruthy();
    expect(getByText('[STANDBY]')).toBeTruthy();
  });
});
