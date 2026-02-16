import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/stores/authStore';
import { colors, typography, spacing } from '../../../src/theme';
import { Avatar } from '../../../src/components/shared/Avatar';
import { useAvatarPicker } from '../../../src/hooks/useAvatarPicker';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAuthStore();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [statusMessage, setStatusMessage] = useState(
    profile?.status_message ?? ''
  );
  const { avatarUri, isUploading, showPicker } = useAvatarPicker();

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('エラー', '表示名を入力してください');
      return;
    }

    const { error } = await updateProfile({
      display_name: displayName.trim(),
      status_message: statusMessage.trim() || null,
    });

    if (error) {
      Alert.alert('エラー', error.message);
    } else {
      router.back();
    }
  };

  const currentAvatarUri = avatarUri ?? profile?.avatar_url;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>プロフィール編集</Text>
        <Pressable onPress={handleSave}>
          <Text style={styles.saveText}>保存</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.avatarArea}>
          <Pressable onPress={showPicker} style={styles.avatarPressable}>
            <Avatar
              uri={currentAvatarUri}
              name={displayName}
              size={80}
            />
            {isUploading && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color={colors.white} />
              </View>
            )}
          </Pressable>
          <Pressable onPress={showPicker}>
            <Text style={styles.changePhotoText}>写真を変更</Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>表示名</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="表示名"
            placeholderTextColor={colors.subText}
          />

          <Text style={styles.label}>ステータスメッセージ</Text>
          <TextInput
            style={styles.input}
            value={statusMessage}
            onChangeText={setStatusMessage}
            placeholder="ステータスメッセージ（任意）"
            placeholderTextColor={colors.subText}
          />
        </View>
      </View>
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
  saveText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  avatarArea: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarPressable: {
    marginBottom: spacing.sm,
    borderRadius: 40,
    overflow: 'hidden',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
  },
  changePhotoText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  label: {
    ...typography.sub,
    color: colors.subText,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
});
