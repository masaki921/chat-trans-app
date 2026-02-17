import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/stores/authStore';
import { colors, typography, spacing } from '../../../src/theme';
import { getLanguageName } from '../../../src/utils/languages';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../../../src/utils/constants';
import { Avatar } from '../../../src/components/shared/Avatar';
import { useI18n } from '../../../src/i18n';

type SettingsItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
};

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, signOut, deleteAccount } = useAuthStore();
  const { t } = useI18n();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSignOut = () => {
    Alert.alert(t.settings_logout, t.settings_logoutConfirm, [
      { text: t.cancel, style: 'cancel' },
      { text: t.settings_logout, style: 'destructive', onPress: signOut },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(t.settings_deleteAccount, t.settings_deleteAccountConfirm, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.settings_deleteAccount,
        style: 'destructive',
        onPress: () => {
          Alert.prompt(
            t.settings_deleteAccount,
            t.settings_deleteAccountInput,
            async (input) => {
              if (input !== 'DELETE') return;
              setIsDeleting(true);
              const { error } = await deleteAccount();
              setIsDeleting(false);
              if (error) {
                Alert.alert(t.error, t.settings_deleteAccountFailed);
              }
            },
            'plain-text'
          );
        },
      },
    ]);
  };

  const menuItems: SettingsItem[] = [
    {
      icon: 'person-outline',
      label: t.settings_editProfile,
      onPress: () => router.push('/(tabs)/settings/profile'),
    },
    {
      icon: 'language-outline',
      label: t.settings_language,
      value: profile ? getLanguageName(profile.primary_language) : '',
      onPress: () => router.push('/(tabs)/settings/language'),
    },
    {
      icon: 'people-outline',
      label: t.settings_friends,
      onPress: () => router.push('/(tabs)/settings/friends'),
    },
    {
      icon: 'remove-circle-outline',
      label: t.settings_blockedUsers,
      onPress: () => router.push('/(tabs)/settings/blocked'),
    },
  ];

  const legalItems: SettingsItem[] = [
    {
      icon: 'shield-outline',
      label: t.settings_privacyPolicy,
      onPress: () => Linking.openURL(PRIVACY_POLICY_URL),
    },
    {
      icon: 'document-text-outline',
      label: t.settings_terms,
      onPress: () => Linking.openURL(TERMS_OF_SERVICE_URL),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.settings_title}</Text>
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
              {profile?.display_name ?? t.settings_noName}
            </Text>
            <Text style={styles.profileSub}>
              {profile?.status_message ?? t.settings_statusPlaceholder}
            </Text>
          </View>
        </View>

        {/* Friend Code */}
        <Pressable
          style={styles.friendCodeCard}
          onPress={async () => {
            if (profile?.friend_code) {
              await Clipboard.setStringAsync(profile.friend_code);
              Alert.alert(t.settings_copied, `${t.settings_friendCodeLabel}: ${profile.friend_code}`);
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={`${t.settings_friendCode}: ${profile?.friend_code ?? ''}, ${t.settings_copy}`}
        >
          <View style={styles.friendCodeLeft}>
            <Ionicons name="qr-code-outline" size={20} color={colors.primary} />
            <View>
              <Text style={styles.friendCodeLabel}>{t.settings_friendCode}</Text>
              <Text style={styles.friendCodeValue}>
                {profile?.friend_code ?? '---'}
              </Text>
            </View>
          </View>
          <View style={styles.copyButton}>
            <Ionicons name="copy-outline" size={18} color={colors.primary} />
            <Text style={styles.copyText}>{t.settings_copy}</Text>
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

        {/* Legal */}
        <View style={styles.menuSection}>
          {legalItems.map((item, index) => (
            <Pressable
              key={item.label}
              style={[
                styles.menuItem,
                index < legalItems.length - 1 && styles.menuItemBorder,
              ]}
              onPress={item.onPress}
            >
              <Ionicons name={item.icon} size={22} color={colors.text} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="open-outline" size={16} color={colors.subText} />
            </Pressable>
          ))}
        </View>

        {/* Sign out */}
        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={styles.signOutText}>{t.settings_logout}</Text>
        </Pressable>

        {/* Delete account */}
        <Pressable
          style={styles.deleteAccountButton}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
        >
          <Ionicons name="trash-outline" size={22} color={colors.error} />
          <Text style={styles.signOutText}>
            {isDeleting ? t.settings_deleting : t.settings_deleteAccount}
          </Text>
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
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
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
