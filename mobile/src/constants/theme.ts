import { Platform } from 'react-native';

export const Colors = {
  ink: '#061225',
  navy: '#0B1B32',
  navyDeep: '#071426',
  panel: '#11284A',
  panelRaised: '#16365F',
  blue: '#3385F6',
  blueBright: '#54A1FF',
  cobalt: '#1D5FA8',
  teal: '#20B8AE',
  mint: '#5EEAD4',
  text: '#F8FAFC',
  textMuted: '#A8B7CC',
  textDim: '#6F83A0',
  border: 'rgba(148, 188, 230, 0.18)',
  borderStrong: 'rgba(94, 234, 212, 0.35)',
  warning: '#F5C96A',
  danger: '#F48D91',
  white: '#FFFFFF',
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'Avenir Next',
    rounded: 'Avenir Next Demi Bold',
    mono: 'Menlo',
  },
  default: {
    sans: 'sans-serif',
    rounded: 'sans-serif-medium',
    mono: 'monospace',
  },
  web: {
    sans: 'Avenir Next, Segoe UI, sans-serif',
    rounded: 'Avenir Next, Segoe UI, sans-serif',
    mono: 'ui-monospace, monospace',
  },
});

export const Spacing = {
  half: 4,
  one: 8,
  two: 12,
  three: 16,
  four: 20,
  five: 24,
  six: 32,
  seven: 44,
  eight: 64,
} as const;

export const Radius = {
  small: 12,
  medium: 18,
  large: 26,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 84, android: 84 }) ?? 84;
export const MaxContentWidth = 760;
