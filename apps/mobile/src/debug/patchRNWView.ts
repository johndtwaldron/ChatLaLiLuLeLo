// apps/mobile/src/debug/patchRNWView.ts
if (__DEV__) {
  const React = require('react');
  const { Text } = require('react-native');
  const ViewMod = require('react-native-web/dist/exports/View');
  const RealView = ViewMod.default;

  const PatchedView = React.forwardRef((props: any, ref: any) => {
    const { children, ...rest } = props;

    const safeChildren = React.Children.map(children, (c: any) => {
      if (typeof c === 'string' || typeof c === 'number') {
        return React.createElement(Text, null, c);
      }
      return c;
    });

    // hand ref to the original RNW View
    return React.createElement(RealView, { ...rest, ref }, safeChildren);
  });

  PatchedView.displayName = 'View';
  // replace export so EVERY consumer (Animated.View, libraries, etc.) gets the safe version
  ViewMod.default = PatchedView;
}

