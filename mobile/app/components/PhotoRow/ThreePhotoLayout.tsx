// mobile/app/components/PhotoRow/ThreePhotoLayout
import { StyleSheet, View } from 'react-native';
import { Photo } from '../../hooks/usePhotoStorage';
import { PhotoItem } from './PhotoItem';
import { PHOTO_RADIUS } from './constants';

export type ThreePhotoVariant = 'leftLarge' | 'rightLarge' | 'equal' | 'topHeavy' | 'bottomHeavy';

interface ThreePhotoLayoutProps {
  photos: [Photo, Photo, Photo];
  height: number;
  variant: ThreePhotoVariant;
  onDelete?: (photo: Photo) => void;
}

const GAP = 2;

export function ThreePhotoLayout({
  photos,
  height,
  variant,
  onDelete
}: ThreePhotoLayoutProps) {

  const renderPhoto = (photo: Photo, style: any) => (
    <PhotoItem
      photo={photo}
      style={[styles.photoContainer, style]}
      onDelete={onDelete}
    />
  );

  // 1 large on left, 2 stacked on right
  if (variant === 'leftLarge') {
    return (
      <View style={[styles.container, { height }]}>
        {renderPhoto(photos[0], { flex: 0.6 })}
        <View style={{ width: GAP }} />
        <View style={styles.stackedColumn}>
          {renderPhoto(photos[1], { flex: 1 })}
          <View style={{ height: GAP }} />
          {renderPhoto(photos[2], { flex: 1 })}
        </View>
      </View>
    );
  }

  // 2 stacked on left, 1 large on right
  if (variant === 'rightLarge') {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.stackedColumn}>
          {renderPhoto(photos[0], { flex: 1 })}
          <View style={{ height: GAP }} />
          {renderPhoto(photos[1], { flex: 1 })}
        </View>
        <View style={{ width: GAP }} />
        {renderPhoto(photos[2], { flex: 0.6 })}
      </View>
    );
  }

  // 3 equal columns
  if (variant === 'equal') {
    return (
      <View style={[styles.container, { height }]}>
        {renderPhoto(photos[0], { flex: 1 })}
        <View style={{ width: GAP }} />
        {renderPhoto(photos[1], { flex: 1 })}
        <View style={{ width: GAP }} />
        {renderPhoto(photos[2], { flex: 1 })}
      </View>
    );
  }

  // 1 large on top, 2 on bottom
  if (variant === 'topHeavy') {
    return (
      <View style={[styles.verticalContainer, { height }]}>
        {renderPhoto(photos[0], { flex: 0.6 })}
        <View style={{ height: GAP }} />
        <View style={styles.horizontalRow}>
          {renderPhoto(photos[1], { flex: 1 })}
          <View style={{ width: GAP }} />
          {renderPhoto(photos[2], { flex: 1 })}
        </View>
      </View>
    );
  }

  // 2 on top, 1 large on bottom
  if (variant === 'bottomHeavy') {
    return (
      <View style={[styles.verticalContainer, { height }]}>
        <View style={styles.horizontalRow}>
          {renderPhoto(photos[0], { flex: 1 })}
          <View style={{ width: GAP }} />
          {renderPhoto(photos[1], { flex: 1 })}
        </View>
        <View style={{ height: GAP }} />
        {renderPhoto(photos[2], { flex: 0.6 })}
      </View>
    );
  }

  // Default fallback to leftLarge
  return (
    <View style={[styles.container, { height }]}>
      {renderPhoto(photos[0], { flex: 0.6 })}
      <View style={{ width: GAP }} />
      <View style={styles.stackedColumn}>
        {renderPhoto(photos[1], { flex: 1 })}
        <View style={{ height: GAP }} />
        {renderPhoto(photos[2], { flex: 1 })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
  },
  verticalContainer: {
    flexDirection: 'column',
    width: '100%',
  },
  photoContainer: {
    overflow: 'hidden',
    borderRadius: PHOTO_RADIUS,
  },
  stackedColumn: {
    flex: 0.4,
    flexDirection: 'column',
  },
  horizontalRow: {
    flex: 0.4,
    flexDirection: 'row',
  },
});
