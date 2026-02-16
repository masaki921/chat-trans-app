import { Modal, View, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  uri: string | null;
  visible: boolean;
  onClose: () => void;
};

export function ImageViewerModal({ uri, visible, onClose }: Props) {
  const insets = useSafeAreaInsets();

  if (!uri) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <Pressable
          style={[styles.closeButton, { top: insets.top + 8 }]}
          onPress={onClose}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <Pressable style={styles.imageArea} onPress={onClose}>
          <Image
            source={{ uri }}
            style={styles.image}
            contentFit="contain"
          />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageArea: {
    flex: 1,
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '80%',
  },
});
