// mobile/app/components/PhotoRow/TwoPhotoLayout
import { StyleSheet, View } from 'react-native';
import { Photo } from '../../hooks/usePhotoStorage';
import { PhotoItem } from './PhotoItem';
import { PHOTO_RADIUS } from './PhotoRow';

export type TwoPhotoVariant = 'equal' | 'leftHeavy' | 'rightHeavy';

interface TwoPhotoLayoutProps {
  photos: [Photo, Photo];
  height: number;
  variant: TwoPhotoVariant;
  onDelete?: (photo: Photo) => void;
}

const GAP = 2;

export function TwoPhotoLayout({
  photos,
  height,
  variant,
  onDelete
}: TwoPhotoLayoutProps) {
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
      <PhotoItem
        photo={photos[0]}
        style={[styles.photoContainer, { flex: leftFlex }]}
        onDelete={onDelete}
      />
      <View style={{ width: GAP }} />
      <PhotoItem
        photo={photos[1]}
        style={[styles.photoContainer, { flex: rightFlex }]}
        onDelete={onDelete}
      />
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
    borderRadius: PHOTO_RADIUS,
  },
});
