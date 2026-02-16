import { TextStyle } from 'react-native';

export const typography = {
  heading: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.4,
  } as TextStyle,
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22.4, // 16 * 1.4
  } as TextStyle,
  sub: {
    fontSize: 13,
    fontWeight: '400',
  } as TextStyle,
  caption: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  } as TextStyle,
  bubbleText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 21.6, // 16 * 1.35
  } as TextStyle,
  bubbleSub: {
    fontSize: 13,
    fontWeight: '400',
    fontStyle: 'italic',
  } as TextStyle,
} as const;
