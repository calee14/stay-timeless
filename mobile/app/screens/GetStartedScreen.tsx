// mobile/app/screens/GetStartedScreen.tsx
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { usePhotoStorage } from '../hooks/usePhotoStorage';
interface GetStartedScreenProps {
  onComplete: () => void;
}

export default function GetStartedScreen({ onComplete }: GetStartedScreenProps) {
  const { savePhotos } = usePhotoStorage();

  const handleImportPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to import photos!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 1.0,
      selectionLimit: 20,
    });

    if (!result.canceled && result.assets.length > 0) {
      await savePhotos(result.assets);
      onComplete();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Timeless</Text>
        <Text style={styles.label}>Let's Get Started!</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={handleImportPhotos}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Bring Photos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f0',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    fontFamily: 'Georgia',
    fontSize: 52,
    color: '#333',
    marginBottom: 130
  },
  label: {
    fontFamily: 'Georgia',
    fontSize: 13,
    color: '#333',
    marginBottom: 13,
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 13,
    paddingHorizontal: 39,
    borderRadius: 8,
  },
  buttonText: {
    fontFamily: 'Georgia',
    color: '#f5f5f0',
    fontSize: 16,
  },
});
