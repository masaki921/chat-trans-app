import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../theme';

type Props = {
  uri?: string | null;
  name?: string;
  size?: number;
  showOnline?: boolean;
  isOnline?: boolean;
};

export function Avatar({ uri, name, size = 44, showOnline = false, isOnline = false }: Props) {
  const borderRadius = size / 2;
  const initial = name?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { width: size, height: size, borderRadius }]}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: size, height: size, borderRadius },
          ]}
        >
          <Text style={[styles.initial, { fontSize: size * 0.4 }]}>
            {initial}
          </Text>
        </View>
      )}
      {showOnline && isOnline && (
        <View style={[styles.onlineDot, { right: 0, bottom: 0 }]} />
      )}
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
  onlineDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
  },
});
