import { StyleSheet, View } from 'react-native';
import { Photo } from '../../hooks/usePhotoStorage';
import { OnePhotoLayout } from './OnePhotoLayout';
import { TwoPhotoLayout, TwoPhotoVariant } from './TwoPhotoLayout';
import { ThreePhotoLayout, ThreePhotoVariant } from './ThreePhotoLayout';

export type PhotoRowVariant = TwoPhotoVariant | ThreePhotoVariant | 'full';

interface PhotoRowProps {
  photos: Photo[];
  variant?: PhotoRowVariant;
  height?: number;
  onPhotoPress: (photo: Photo) => void;
}

const DEFAULT_HEIGHT = 260;
export const PHOTO_GAP = 2;
export const PHOTO_RADIUS = 2;
export const GRID_PADDING = 0;

export function PhotoRow({
  photos,
  variant,
  height = DEFAULT_HEIGHT,
  onPhotoPress
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
          onPhotoPress={onPhotoPress}
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
          onPhotoPress={onPhotoPress}
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
          onPhotoPress={onPhotoPress}
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
