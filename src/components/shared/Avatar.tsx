import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../theme';

type Props = {
  uri?: string | null;
  name?: string;
  size?: number;
};

export function Avatar({ uri, name, size = 44 }: Props) {
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
