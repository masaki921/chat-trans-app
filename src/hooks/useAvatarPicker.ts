import { useState, useCallback } from 'react';
import { ActionSheetIOS, Platform, Alert } from 'react-native';
import { pickImage, uploadImage } from '../utils/imageUpload';
import { useAuthStore } from '../stores/authStore';

type UseAvatarPickerOptions = {
  /** 登録フロー用: まだプロフィール保存前のため、URIだけ返す */
  localOnly?: boolean;
};

export function useAvatarPicker(options: UseAvatarPickerOptions = {}) {
  const { localOnly = false } = options;
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { user, updateProfile } = useAuthStore();

  const showPicker = useCallback(() => {
    const pickerOptions = ['カメラで撮影', 'ライブラリから選択', 'キャンセル'];
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: pickerOptions,
          cancelButtonIndex,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) await handlePick('camera');
          if (buttonIndex === 1) await handlePick('gallery');
        }
      );
    } else {
      // Android fallback
      Alert.alert('写真を選択', '', [
        { text: 'カメラで撮影', onPress: () => handlePick('camera') },
        { text: 'ライブラリから選択', onPress: () => handlePick('gallery') },
        { text: 'キャンセル', style: 'cancel' },
      ]);
    }
  }, [localOnly, user]);

  const handlePick = async (source: 'camera' | 'gallery') => {
    const uri = await pickImage(source, {
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!uri) return;

    if (localOnly) {
      setAvatarUri(uri);
      return;
    }

    // アップロード + プロフィール更新
    if (!user) return;

    setIsUploading(true);
    try {
      const publicUrl = await uploadImage(
        'avatars',
        `${user.id}/avatar`,
        uri
      );

      if (publicUrl) {
        await updateProfile({ avatar_url: publicUrl });
        setAvatarUri(publicUrl);
      } else {
        Alert.alert('エラー', '画像のアップロードに失敗しました');
      }
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * 登録フロー用: ローカルURIをSupabaseにアップロードしてURLを返す
   */
  const uploadLocalAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarUri) return null;

    setIsUploading(true);
    try {
      const publicUrl = await uploadImage(
        'avatars',
        `${userId}/avatar`,
        avatarUri
      );
      return publicUrl;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    avatarUri,
    isUploading,
    showPicker,
    uploadLocalAvatar,
  };
}
