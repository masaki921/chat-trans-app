import { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { ImageViewerModal } from '../chat/ImageViewerModal';
import { colors, spacing } from '../../theme';
import { useI18n } from '../../i18n';
import type { Profile } from '../../types/database';

const LANGUAGE_NAMES: Record<string, string> = {
  ja: '日本語',
  en: 'English',
  zh: '中文',
  ko: '한국어',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  ar: 'العربية',
  hi: 'हिन्दी',
  it: 'Italiano',
  ru: 'Русский',
};

type Props = {
  profile: Profile | null;
  visible: boolean;
  onClose: () => void;
  onMessage?: () => void;
};

export function UserProfileModal({ profile, visible, onClose, onMessage }: Props) {
  const { t } = useI18n();
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

  if (!profile) return null;

  const langName = LANGUAGE_NAMES[profile.primary_language] ?? profile.primary_language;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* onStartShouldSetResponder でカード内タップがバックドロップに伝播するのを防ぐ */}
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          {/* 閉じるボタン */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={20} color={colors.subText} />
          </Pressable>

          {/* アバター（写真があればタップで拡大） */}
          {profile.avatar_url ? (
            <Pressable onPress={() => setImageViewerVisible(true)}>
              <Avatar
                uri={profile.avatar_url}
                name={profile.display_name}
                size={80}
              />
            </Pressable>
          ) : (
            <Avatar
              uri={null}
              name={profile.display_name}
              size={80}
            />
          )}

          {/* 名前 */}
          <Text style={styles.name}>{profile.display_name}</Text>

          {/* ステータスメッセージ */}
          {profile.status_message ? (
            <Text style={styles.status}>{profile.status_message}</Text>
          ) : null}

          {/* 言語 */}
          <View style={styles.langRow}>
            <Ionicons name="globe-outline" size={14} color={colors.subText} />
            <Text style={styles.langText}>{langName}</Text>
          </View>

          {/* メッセージボタン */}
          {onMessage ? (
            <Pressable
              style={styles.messageButton}
              onPress={() => {
                onClose();
                onMessage();
              }}
            >
              <Ionicons name="chatbubble-outline" size={16} color={colors.white} />
              <Text style={styles.messageButtonText}>{t.profile_sendMessage}</Text>
            </Pressable>
          ) : null}
        </View>
      </Pressable>

      {/* 親Modalの内側にネストすることでiOSで正しく表示される */}
      <ImageViewerModal
        uri={profile.avatar_url}
        visible={imageViewerVisible}
        onClose={() => setImageViewerVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    width: 280,
    gap: spacing.sm,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  status: {
    fontSize: 14,
    color: colors.subText,
    textAlign: 'center',
    lineHeight: 20,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  langText: {
    fontSize: 13,
    color: colors.subText,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: spacing.md,
  },
  messageButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
