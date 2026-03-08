import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../theme';

type Props = {
  uri?: string | null;
  name?: string;
  size?: number;
  onPress?: () => void;
};

export function Avatar({ uri, name, size = 44, onPress }: Props) {
  const borderRadius = size / 2;
  const initial = name?.charAt(0)?.toUpperCase() ?? '?';

  const inner = uri ? (
    <Image
      source={{ uri }}
      style={[styles.image, { width: size, height: size, borderRadius }]}
      contentFit="cover"
    />
  ) : (
    <View style={[styles.placeholder, { width: size, height: size, borderRadius }]}>
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={{ width: size, height: size }}
        accessibilityLabel={name ? `${name}'s profile` : 'Profile'}
        accessibilityRole="button"
      >
        {inner}
      </Pressable>
    );
  }

  return (
    <View style={{ width: size, height: size }} accessibilityLabel={name ? `${name}'s avatar` : 'Avatar'}>
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surface,
  },
  placeholder: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    color: colors.white,
    fontWeight: '600',
  },
});
