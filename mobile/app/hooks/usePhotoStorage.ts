// mobile/app/hooks/usePhotoStorage.ts
import { useState, useEffect, useCallback } from 'react';
import { File, Directory, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ImagePickerAsset } from 'expo-image-picker';

export interface Photo {
  id: string;
  uri: string;
  originalUri: string;
  createdAt: number;
  width?: number;
  height?: number;
}

const PHOTOS_STORAGE_KEY = '@photos_metadata';
const PHOTOS_FOLDER_NAME = 'photos';

export function usePhotoStorage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get or create the photos directory
  const getPhotosDirectory = () => {
    return new Directory(Paths.document, PHOTOS_FOLDER_NAME);
  };

  // Ensure the photos directory exists
  const ensureDirectoryExists = () => {
    const photosDir = getPhotosDirectory();
    if (!photosDir.exists) {
      photosDir.create();
    }
    return photosDir;
  };

  // Load photos metadata from storage
  const loadPhotos = useCallback(async () => {
    try {
      setIsLoading(true);
      ensureDirectoryExists();

      const storedData = await AsyncStorage.getItem(PHOTOS_STORAGE_KEY);
      if (storedData) {
        const photosMeta: Photo[] = JSON.parse(storedData);

        // Verify files still exist
        const validPhotos: Photo[] = [];
        for (const photo of photosMeta) {
          try {
            const file = new File(photo.uri);
            if (file.exists) {
              validPhotos.push(photo);
            }
          } catch {
            // File doesn't exist, skip it
          }
        }

        // Update storage if some photos were removed
        if (validPhotos.length !== photosMeta.length) {
          await AsyncStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(validPhotos));
        }

        setPhotos(validPhotos.sort((a, b) => b.createdAt - a.createdAt));
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save photos to app storage
  const savePhotos = async (assets: ImagePickerAsset[]) => {
    try {
      const photosDir = ensureDirectoryExists();

      const newPhotos: Photo[] = [];

      for (const asset of assets) {
        const filename = `photo_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

        // Create source file reference and copy to photos directory
        const sourceFile = new File(asset.uri);
        const destinationFile = new File(photosDir, filename);

        sourceFile.copy(destinationFile);

        const photo: Photo = {
          id: `photo_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          uri: destinationFile.uri,
          originalUri: asset.uri,
          createdAt: Date.now(),
          width: asset.width,
          height: asset.height,
        };

        newPhotos.push(photo);
      }

      const updatedPhotos = [...newPhotos, ...photos].sort((a, b) => b.createdAt - a.createdAt);
      setPhotos(updatedPhotos);

      // Save metadata
      await AsyncStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(updatedPhotos));

      return newPhotos;
    } catch (error) {
      console.error('Error saving photos:', error);
      throw error;
    }
  };

  // Delete a photo
  const deletePhoto = async (photoId: string) => {
    try {
      const photoToDelete = photos.find(p => p.id === photoId);

      if (photoToDelete) {
        // Delete file
        try {
          const file = new File(photoToDelete.uri);
          if (file.exists) {
            file.delete();
          }
        } catch {
          // File might already be deleted
        }

        // Update state and storage
        const updatedPhotos = photos.filter(p => p.id !== photoId);
        setPhotos(updatedPhotos);
        await AsyncStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(updatedPhotos));
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  };

  // Refresh photos list
  const refreshPhotos = async () => {
    await loadPhotos();
  };

  // Clear all photos
  const clearAllPhotos = async () => {
    try {
      // Delete the photos directory
      const photosDir = getPhotosDirectory();
      if (photosDir.exists) {
        photosDir.delete();
      }

      // Recreate empty directory
      ensureDirectoryExists();

      // Clear metadata
      await AsyncStorage.removeItem(PHOTOS_STORAGE_KEY);
      setPhotos([]);
    } catch (error) {
      console.error('Error clearing photos:', error);
      throw error;
    }
  };

  // Load photos on mount
  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  return {
    photos,
    isLoading,
    savePhotos,
    deletePhoto,
    refreshPhotos,
    clearAllPhotos,
  };
}
