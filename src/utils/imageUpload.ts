import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { supabase } from '../services/supabase';

type ImageSource = 'camera' | 'gallery';

type PickImageOptions = {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
};

/**
 * カメラまたはギャラリーから画像を選択する
 */
export async function pickImage(
  source: ImageSource,
  options: PickImageOptions = {}
): Promise<string | null> {
  const { allowsEditing = true, aspect = [1, 1], quality = 0.8 } = options;

  // 権限リクエスト
  if (source === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限エラー', 'カメラへのアクセスを許可してください');
      return null;
    }
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限エラー', '写真ライブラリへのアクセスを許可してください');
      return null;
    }
  }

  const launcher =
    source === 'camera'
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

  const result = await launcher({
    mediaTypes: ['images'],
    allowsEditing,
    aspect,
    quality,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  return result.assets[0].uri;
}

/**
 * 画像URIをSupabase Storageにアップロードする
 */
export async function uploadImage(
  bucket: string,
  path: string,
  uri: string
): Promise<string | null> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    // ファイル拡張子を取得
    const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const fullPath = `${path}.${ext}`;
    const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fullPath, blob, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // 公開URLを取得
    const { data } = supabase.storage.from(bucket).getPublicUrl(fullPath);
    // キャッシュバスト用にタイムスタンプを付与
    return `${data.publicUrl}?t=${Date.now()}`;
  } catch (err) {
    console.error('Upload failed:', err);
    return null;
  }
}
