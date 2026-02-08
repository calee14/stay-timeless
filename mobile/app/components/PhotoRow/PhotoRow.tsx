// mobile/app/components/PhotoRow/PhotoRow
import { StyleSheet, View } from 'react-native';
import { Photo } from '../../hooks/usePhotoStorage';
import { OnePhotoLayout } from './OnePhotoLayout';
import { TwoPhotoLayout, TwoPhotoVariant } from './TwoPhotoLayout';
import { ThreePhotoLayout, ThreePhotoVariant } from './ThreePhotoLayout';
import { PHOTO_GAP, PHOTO_RADIUS, GRID_PADDING } from './constants';

export type PhotoRowVariant = TwoPhotoVariant | ThreePhotoVariant | 'full';

interface PhotoRowProps {
  photos: Photo[];
  variant?: PhotoRowVariant;
  height?: number;
  onPhotoPress?: (photo: Photo) => void;
  onDelete?: (photo: Photo) => void;
}

const DEFAULT_HEIGHT = 260;

export function PhotoRow({
  photos,
  variant,
  height = DEFAULT_HEIGHT,
  onDelete,
}: PhotoRowProps) {
  if (photos.length === 0) {
    return null;
  }

  if (photos.length === 1) {
    return (
      <View style={[styles.container, { marginBottom: PHOTO_GAP / 2 }]}>
        <OnePhotoLayout
          photo={photos[0]}
          height={height}
          onDelete={onDelete}
        />
      </View>
    );
  }

  if (photos.length === 2) {
    const twoPhotoVariant: TwoPhotoVariant =
      (variant === 'equal' || variant === 'leftHeavy' || variant === 'rightHeavy')
        ? variant
        : 'equal';

    return (
      <View style={[styles.container, { marginBottom: PHOTO_GAP }]}>
        <TwoPhotoLayout
          photos={photos as [Photo, Photo]}
          height={height}
          variant={twoPhotoVariant}
          onDelete={onDelete}
        />
      </View>
    );
  }

  if (photos.length >= 3) {
    const threePhotoVariant: ThreePhotoVariant =
      (variant === 'leftLarge' || variant === 'rightLarge' || variant === 'equal' ||
        variant === 'topHeavy' || variant === 'bottomHeavy')
        ? variant
        : 'leftLarge';

    return (
      <View style={[styles.container, { marginBottom: PHOTO_GAP }]}>
        <ThreePhotoLayout
          photos={photos.slice(0, 3) as [Photo, Photo, Photo]}
          height={height}
          variant={threePhotoVariant}
          onDelete={onDelete}
        />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
