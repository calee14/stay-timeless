// mobile/app/screens/HomeScreen.tsx
import { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { usePhotoStorage, Photo } from '../hooks/usePhotoStorage';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PhotoRow, chunkPhotosIntoRows, PhotoRowData, GRID_PADDING } from '../components/PhotoRow';

export default function HomeScreen() {
  const { photos, isLoading, savePhotos, deletePhoto, refreshPhotos } = usePhotoStorage();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Chunk photos into rows with layout variants
  const photoRows = useMemo(() => chunkPhotosIntoRows(photos), [photos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshPhotos();
    setRefreshing(false);
  }, [refreshPhotos]);

  const handleAddPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to import photos!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 20,
    });

    if (!result.canceled && result.assets.length > 0) {
      await savePhotos(result.assets);
    }
  };

  const handleDeletePhoto = async () => {
    if (selectedPhoto) {
      await deletePhoto(selectedPhoto.id);
      setSelectedPhoto(null);
    }
  };

  const handleResetOnboarding = () => {
    AsyncStorage.removeItem('@has_completed_onboarding');
  };

  const handlePhotoPress = (photo: Photo) => {
    setSelectedPhoto(photo);
  };

  const renderRow = ({ item }: { item: PhotoRowData }) => (
    <PhotoRow
      photos={item.photos}
      variant={item.variant}
      height={item.height}
      onPhotoPress={handlePhotoPress}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Text style={styles.emptyIcon}>+</Text>
      </View>
      <Text style={styles.emptyTitle}>No photos</Text>
      <Text style={styles.emptySubtitle}>Tap + to add photos</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={photoRows}
          renderItem={renderRow}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { padding: GRID_PADDING },
            photoRows.length === 0 && styles.emptyList,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#999"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Reset Onboarding Button - Bottom Left */}
      <TouchableOpacity
        style={styles.resetButton}
        onPress={handleResetOnboarding}
        activeOpacity={0.7}
      >
        <Text style={styles.resetButtonText}>↺</Text>
      </TouchableOpacity>

      {/* Add Button - Bottom Right */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddPhotos}
        activeOpacity={0.8}
      >
        <Text style={styles.addButtonIcon}>+</Text>
      </TouchableOpacity>

      {/* Photo Detail Modal */}
      <Modal
        visible={selectedPhoto !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setSelectedPhoto(null)}
              >
                <Text style={styles.modalButtonText}>✕</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleDeletePhoto}
              >
                <Text style={styles.modalButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>

            {selectedPhoto && (
              <Image
                source={{ uri: selectedPhoto.uri }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}

            {selectedPhoto && (
              <View style={styles.modalInfo}>
                <Text style={styles.modalDate}>
                  {new Date(selectedPhoto.createdAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f0',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    flexGrow: 1
  },
  emptyList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 24,
    color: '#444',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#444',
  },
  resetButton: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 18,
    color: '#666',
  },
  addButton: {
    position: 'absolute',
    bottom: 40,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonIcon: {
    fontSize: 24,
    color: '#000',
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  modalImage: {
    flex: 1,
    width: '100%',
  },
  modalInfo: {
    padding: 20,
    alignItems: 'center',
  },
  modalDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
