import React, { forwardRef } from 'react';
import { View, Text, ViewProps } from 'react-native';

const SafeView = forwardRef<any, ViewProps>(({ children, ...rest }, ref) => {
  if (!__DEV__) return <View ref={ref} {...rest}>{children}</View>;
  const wrapped = React.Children.map(children, (c) =>
    (typeof c === 'string' || typeof c === 'number') ? <Text>{c}</Text> : c
  );
  return <View ref={ref} {...rest}>{wrapped}</View>;
});
SafeView.displayName = 'SafeView';
export default SafeView;
