import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/stores/authStore';
import { colors, typography, spacing } from '../../../src/theme';
import { getLanguageName } from '../../../src/utils/languages';
import { Avatar } from '../../../src/components/shared/Avatar';

type SettingsItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
};

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: 'ログアウト', style: 'destructive', onPress: signOut },
    ]);
  };

  const menuItems: SettingsItem[] = [
    {
      icon: 'person-outline',
      label: 'プロフィール編集',
      onPress: () => router.push('/(tabs)/settings/profile'),
    },
    {
      icon: 'language-outline',
      label: '言語設定',
      value: profile ? getLanguageName(profile.primary_language) : '',
      onPress: () => router.push('/(tabs)/settings/language'),
    },
    {
      icon: 'people-outline',
      label: '友達管理',
      onPress: () => router.push('/(tabs)/settings/friends'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <Avatar
            uri={profile?.avatar_url}
            name={profile?.display_name ?? '?'}
            size={56}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile?.display_name ?? '未設定'}
            </Text>
            <Text style={styles.profileSub}>
              {profile?.status_message ?? 'ステータスメッセージを設定'}
            </Text>
          </View>
        </View>

        {/* Friend Code */}
        <Pressable
          style={styles.friendCodeCard}
          onPress={async () => {
            if (profile?.friend_code) {
              await Clipboard.setStringAsync(profile.friend_code);
              Alert.alert('コピーしました', `フレンドコード: ${profile.friend_code}`);
            }
          }}
        >
          <View style={styles.friendCodeLeft}>
            <Ionicons name="qr-code-outline" size={20} color={colors.primary} />
            <View>
              <Text style={styles.friendCodeLabel}>マイフレンドコード</Text>
              <Text style={styles.friendCodeValue}>
                {profile?.friend_code ?? '---'}
              </Text>
            </View>
          </View>
          <View style={styles.copyButton}>
            <Ionicons name="copy-outline" size={18} color={colors.primary} />
            <Text style={styles.copyText}>コピー</Text>
          </View>
        </Pressable>

        {/* Menu items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <Pressable
              key={item.label}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && styles.menuItemBorder,
              ]}
              onPress={item.onPress}
            >
              <Ionicons name={item.icon} size={22} color={colors.text} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <View style={styles.menuRight}>
                {item.value && (
                  <Text style={styles.menuValue}>{item.value}</Text>
                )}
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.subText}
                />
              </View>
            </Pressable>
          ))}
        </View>

        {/* Sign out */}
        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={styles.signOutText}>ログアウト</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.heading,
    fontSize: 28,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  profileInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  profileSub: {
    ...typography.sub,
    color: colors.subText,
    marginTop: 2,
  },
  menuSection: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: spacing.md,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  menuValue: {
    ...typography.sub,
    color: colors.subText,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  signOutText: {
    fontSize: 16,
    color: colors.error,
  },
  friendCodeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  friendCodeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  friendCodeLabel: {
    fontSize: 12,
    color: colors.subText,
  },
  friendCodeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
});
