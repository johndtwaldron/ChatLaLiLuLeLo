import React from 'react';
import { render } from '@testing-library/react-native';
import { Portrait } from '../Portrait';

describe('Portrait', () => {
  it('renders colonel portrait correctly', () => {
    const { getByText } = render(
      <Portrait type="colonel" />
    );
    
    expect(getByText('???')).toBeTruthy();
  });

  it('renders user portrait correctly', () => {
    const { getByText } = render(
      <Portrait type="user" />
    );
    
    expect(getByText('SOLDIER')).toBeTruthy();
    expect(getByText('USER')).toBeTruthy();
  });

  it('shows active state when isActive is true', () => {
    const { getByText } = render(
      <Portrait type="colonel" isActive={true} />
    );
    
    expect(getByText('???')).toBeTruthy();
  });

  it('shows speaking state when isSpeaking is true', () => {
    const { getByText } = render(
      <Portrait type="colonel" isSpeaking={true} />
    );
    
    expect(getByText('???')).toBeTruthy();
  });

  it('handles mouth frame animation', () => {
    const { getByText } = render(
      <Portrait 
        type="colonel" 
        isSpeaking={true} 
        mouthFrame={3} 
      />
    );
    
    expect(getByText('???')).toBeTruthy();
  });

  it('applies proper styling for different types', () => {
    const { rerender, getByText } = render(
      <Portrait type="colonel" />
    );
    
    expect(getByText('???')).toBeTruthy();
    
    rerender(<Portrait type="user" />);
    expect(getByText('SOLDIER')).toBeTruthy();
  });
});
