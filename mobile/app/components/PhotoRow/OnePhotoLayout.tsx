// mobile/app/components/PhotoRow/OnePhotoLayout
import { StyleSheet, View } from 'react-native';
import { Photo } from '../../hooks/usePhotoStorage';
import { PhotoItem } from './PhotoItem';

interface OnePhotoLayoutProps {
  photo: Photo;
  height: number;
  onPhotoPress?: (photo: Photo) => void;
  onDelete?: (photo: Photo) => void;
}

export function OnePhotoLayout({ photo, height, onDelete }: OnePhotoLayoutProps) {
  return (
    <View style={[styles.container, { height }]}>
      <PhotoItem
        photo={photo}
        style={styles.photoItem}
        onDelete={onDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  photoItem: {
    flex: 1,
    width: '100%',
  },
});
