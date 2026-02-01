import { StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Photo } from '../../hooks/usePhotoStorage';
import { PHOTO_RADIUS } from './PhotoRow';

interface OnePhotoLayoutProps {
  photo: Photo;
  height: number;
  onPhotoPress: (photo: Photo) => void;
}

export function OnePhotoLayout({ photo, height, onPhotoPress }: OnePhotoLayoutProps) {
  return (
    <TouchableOpacity
      style={[styles.container, { height }]}
      onPress={() => onPhotoPress(photo)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: photo.uri }} style={[styles.image, { borderRadius: PHOTO_RADIUS }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  image: {
    flex: 1,
    width: '100%',
  },
});
