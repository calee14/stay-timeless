// mobile/app/components/PhotoRow/PhotoItem
import { useState, useRef } from 'react';
import {
  StyleSheet,
  Image,
  TouchableOpacity,
  View,
  Dimensions,
  Modal,
  Text,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Photo } from '../../hooks/usePhotoStorage';
import { PHOTO_RADIUS } from './PhotoRow';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PhotoItemProps {
  photo: Photo;
  style?: object;
  onDelete?: (photo: Photo) => void;
}

// Spring config for snappy animations
const SPRING_CONFIG = {
  tension: 100,
  friction: 12,
  useNativeDriver: true,
};

export function PhotoItem({ photo, style, onDelete }: PhotoItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageLayout, setImageLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const imageRef = useRef<View>(null);

  // Animation values
  const expandAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    imageRef.current?.measureInWindow((x, y, width, height) => {
      setImageLayout({ x, y, width, height });
      setIsExpanded(true);

      // Animate expansion
      Animated.parallel([
        Animated.spring(expandAnim, {
          toValue: 1,
          ...SPRING_CONFIG,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(buttonAnim, {
          toValue: 1,
          duration: 200,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.spring(expandAnim, {
        toValue: 0,
        ...SPRING_CONFIG,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsExpanded(false);
    });
  };

  const handleDelete = () => {
    handleClose();
    setTimeout(() => {
      onDelete?.(photo);
    }, 300);
  };

  // Calculate transforms for expanded image
  const aspectRatio = imageLayout.width / imageLayout.height || 1;
  const targetWidth = SCREEN_WIDTH;
  const targetHeight = Math.min(SCREEN_HEIGHT * 0.7, targetWidth / aspectRatio);
  const scaleX = imageLayout.width > 0 ? targetWidth / imageLayout.width : 1;
  const scaleY = imageLayout.height > 0 ? targetHeight / imageLayout.height : 1;
  const targetScale = Math.min(scaleX, scaleY);
  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2;
  const currentCenterX = imageLayout.x + imageLayout.width / 2;
  const currentCenterY = imageLayout.y + imageLayout.height / 2;
  const targetTranslateX = centerX - currentCenterX;
  const targetTranslateY = centerY - currentCenterY;

  // Interpolated styles
  const imageAnimatedStyle = {
    transform: [
      {
        translateX: expandAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, targetTranslateX],
        }),
      },
      {
        translateY: expandAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, targetTranslateY],
        }),
      },
      {
        scale: expandAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, targetScale],
        }),
      },
    ],
  };

  const buttonAnimatedStyle = {
    opacity: buttonAnim,
    transform: [
      {
        translateY: buttonAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-10, 0],
        }),
      },
    ],
  };

  const infoAnimatedStyle = {
    opacity: buttonAnim,
    transform: [
      {
        translateY: buttonAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  return (
    <>
      <TouchableOpacity
        ref={imageRef}
        style={[styles.container, style]}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <Image source={{ uri: photo.uri }} style={styles.image} />
      </TouchableOpacity>

      <Modal
        visible={isExpanded}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          {/* Blurred background - fades in */}
          <Animated.View style={[styles.blurContainer, { opacity: overlayOpacity }]}>
            <BlurView intensity={40} tint="dark" style={styles.blur}>
              <TouchableOpacity
                style={styles.blurTouchable}
                activeOpacity={1}
                onPress={handleClose}
              />
            </BlurView>
          </Animated.View>

          {/* Animated expanded image */}
          <Animated.View
            style={[
              styles.expandedImageContainer,
              {
                left: imageLayout.x,
                top: imageLayout.y,
                width: imageLayout.width,
                height: imageLayout.height,
              },
              imageAnimatedStyle,
            ]}
            pointerEvents="none"
          >
            <Image source={{ uri: photo.uri }} style={styles.expandedImage} />
          </Animated.View>

          {/* Action buttons */}
          <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>✕</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>🗑️</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Photo info */}
          <Animated.View style={[styles.infoContainer, infoAnimatedStyle]}>
            <Text style={styles.dateText}>
              {new Date(photo.createdAt).toLocaleDateString()}
            </Text>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: PHOTO_RADIUS,
    overflow: 'hidden',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  modalContainer: {
    flex: 1,
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  blur: {
    flex: 1,
  },
  blurTouchable: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  expandedImageContainer: {
    position: 'absolute',
    borderRadius: PHOTO_RADIUS,
    overflow: 'hidden',
  },
  expandedImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 80, 80, 0.2)',
  },
  buttonText: {
    fontSize: 20,
    color: '#fff',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
