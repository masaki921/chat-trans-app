import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';

const COLUMN_COUNT = 3;
const GAP = 1;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = (SCREEN_WIDTH - GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

const MAX_SELECT = 10;

type Props = {
  visible: boolean;
  onSend: (uris: string[]) => void;
  onClose: () => void;
};

export function ImagePickerSheet({ visible, onSend, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) {
      setSelected([]);
      return;
    }
    loadPhotos();
  }, [visible]);

  const loadPhotos = async () => {
    setLoading(true);
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      onClose();
      return;
    }
    const { assets } = await MediaLibrary.getAssetsAsync({
      mediaType: 'photo',
      first: 300,
      sortBy: [MediaLibrary.SortBy.creationTime],
    });
    setPhotos(assets);
    setLoading(false);
  };

  const toggleSelect = (assetId: string) => {
    setSelected((prev) => {
      if (prev.includes(assetId)) {
        return prev.filter((id) => id !== assetId);
      }
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, assetId];
    });
  };

  const handleSend = async () => {
    // localUri を取得（ph:// → file:// に変換）
    const selectedAssets = photos
      .filter((p) => selected.includes(p.id))
      .sort((a, b) => selected.indexOf(a.id) - selected.indexOf(b.id));

    const uris: string[] = [];
    for (const asset of selectedAssets) {
      const info = await MediaLibrary.getAssetInfoAsync(asset);
      uris.push(info.localUri ?? asset.uri);
    }

    onSend(uris);
    onClose();
  };

  const renderPhoto = ({ item }: { item: MediaLibrary.Asset }) => {
    const selectionIndex = selected.indexOf(item.id);
    const isSelected = selectionIndex >= 0;

    return (
      <Pressable onPress={() => toggleSelect(item.id)}>
        <Image
          source={{ uri: item.uri }}
          style={styles.thumbnail}
          contentFit="cover"
        />
        {isSelected && <View style={styles.overlay} />}
        <View style={[styles.circle, isSelected && styles.circleActive]}>
          {isSelected && (
            <Text style={styles.circleNumber}>{selectionIndex + 1}</Text>
          )}
        </View>
      </Pressable>
    );
  };

  const selectedCount = selected.length;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>キャンセル</Text>
          </Pressable>
          <Text style={styles.title}>写真</Text>
          <Pressable
            style={[styles.sendBtn, selectedCount === 0 && styles.sendBtnDisabled]}
            onPress={selectedCount > 0 ? handleSend : undefined}
          >
            <Text style={[styles.sendText, selectedCount === 0 && styles.sendTextDisabled]}>
              {selectedCount > 0 ? `送信(${selectedCount})` : '送信'}
            </Text>
          </Pressable>
        </View>

        {/* グリッド */}
        {loading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={photos}
            keyExtractor={(item) => item.id}
            numColumns={COLUMN_COUNT}
            columnWrapperStyle={{ gap: GAP }}
            ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
            renderItem={renderPhoto}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1c1c1e',
  },
  cancelBtn: {
    minWidth: 80,
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  sendBtn: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  sendBtnDisabled: {},
  sendText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  sendTextDisabled: {
    color: '#555',
  },
  loadingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  circle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  circleNumber: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
