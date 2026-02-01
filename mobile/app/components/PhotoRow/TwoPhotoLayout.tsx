import { StyleSheet, Image, TouchableOpacity, View } from 'react-native';
import { Photo } from '../../hooks/usePhotoStorage';
import { PHOTO_RADIUS } from './PhotoRow';

export type TwoPhotoVariant = 'equal' | 'leftHeavy' | 'rightHeavy';

interface TwoPhotoLayoutProps {
  photos: [Photo, Photo];
  height: number;
  variant: TwoPhotoVariant;
  onPhotoPress: (photo: Photo) => void;
}

const GAP = 2;

export function TwoPhotoLayout({ photos, height, variant, onPhotoPress }: TwoPhotoLayoutProps) {
  const getFlexRatios = (): [number, number] => {
    switch (variant) {
      case 'leftHeavy':
        return [0.65, 0.35];
      case 'rightHeavy':
        return [0.35, 0.65];
      case 'equal':
      default:
        return [0.5, 0.5];
    }
  };

  const [leftFlex, rightFlex] = getFlexRatios();

  return (
    <View style={[styles.container, { height }]}>
      <TouchableOpacity
        style={[styles.photoContainer, { flex: leftFlex }]}
        onPress={() => onPhotoPress(photos[0])}
        activeOpacity={0.9}
      >
        <Image source={{ uri: photos[0].uri }} style={[styles.image, { borderRadius: PHOTO_RADIUS }]} />
      </TouchableOpacity>

      <View style={{ width: GAP }} />

      <TouchableOpacity
        style={[styles.photoContainer, { flex: rightFlex }]}
        onPress={() => onPhotoPress(photos[1])}
        activeOpacity={0.9}
      >
        <Image source={{ uri: photos[1].uri }} style={[styles.image, { borderRadius: PHOTO_RADIUS }]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
  },
  photoContainer: {
    overflow: 'hidden',
  },
  image: {
    flex: 1,
    width: '100%',
  },
});
