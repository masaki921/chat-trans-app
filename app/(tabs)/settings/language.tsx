import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/stores/authStore';
import { colors, typography, spacing } from '../../../src/theme';
import { SUPPORTED_LANGUAGES } from '../../../src/utils/languages';

export default function LanguageSettingsScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAuthStore();

  const languages = Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
    code,
    name,
  }));

  const handleSelect = async (code: string) => {
    await updateProfile({ primary_language: code });
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>言語設定</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={languages}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => (
          <Pressable
            style={styles.item}
            onPress={() => handleSelect(item.code)}
          >
            <Text style={styles.itemText}>{item.name}</Text>
            {profile?.primary_language === item.code && (
              <Ionicons name="checkmark" size={22} color={colors.primary} />
            )}
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  itemText: {
    fontSize: 16,
    color: colors.text,
  },
  separator: {
    height: 0.5,
    backgroundColor: colors.divider,
    marginLeft: spacing.lg,
  },
});
