import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../../App';

describe('App', () => {
  it('renders without crashing (smoke test)', () => {
    const { getByText } = render(<App />);
    
    // Should render codec interface elements
    expect(getByText('140.85')).toBeTruthy(); // Frequency indicator
  });

  it('displays codec conversation elements', () => {
    const { getByText } = render(<App />);
    
    // Check for sample conversation content
    expect(getByText('Codec connection established. Four modes available.')).toBeTruthy();
  });

  it('shows portrait labels', () => {
    const { getByText } = render(<App />);
    
    // Should have colonel and user portraits
    expect(getByText('???')).toBeTruthy(); // Colonel label
    expect(getByText('SOLDIER')).toBeTruthy(); // User label
  });

  it('renders status indicators', () => {
    const { getByText } = render(<App />);
    
    // Should show current status
    expect(getByText('[STANDBY]')).toBeTruthy();
  });
});
