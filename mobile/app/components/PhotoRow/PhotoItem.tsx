// mobile/app/components/PhotoRow/PhotoItem
import { useState, useRef, useEffect } from 'react';
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
import { PHOTO_RADIUS } from './constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Padding from screen edges when expanded
const SCREEN_PADDING = 7;

interface PhotoItemProps {
  photo: Photo;
  style?: object;
  onDelete?: (photo: Photo) => void;
}

// Spring config for snappy animations
const SPRING_CONFIG = {
  tension: 100,
  friction: 12,
  useNativeDriver: false, // We need to animate width/height, so no native driver
};

export function PhotoItem({ photo, style, onDelete }: PhotoItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageLayout, setImageLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const imageRef = useRef<View>(null);

  // Animation value (0 = thumbnail, 1 = expanded)
  const expandAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  // Fetch the image's real dimensions on mount
  useEffect(() => {
    if (photo.uri) {
      Image.getSize(
        photo.uri,
        (width, height) => {
          setNaturalSize({ width, height });
        },
        () => {
          // Fallback if getSize fails
          setNaturalSize(null);
        }
      );
    }
  }, [photo.uri]);

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
          useNativeDriver: false,
        }),
        Animated.timing(buttonAnim, {
          toValue: 1,
          duration: 200,
          delay: 100,
          useNativeDriver: false,
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
        useNativeDriver: false,
      }),
      Animated.timing(buttonAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
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

  // Calculate the target (expanded) size based on the image's real aspect ratio
  const realAspectRatio = naturalSize
    ? naturalSize.width / naturalSize.height
    : imageLayout.width / imageLayout.height || 1;

  const maxWidth = SCREEN_WIDTH - SCREEN_PADDING * 2;
  const maxHeight = SCREEN_HEIGHT * 0.75;

  let targetWidth: number;
  let targetHeight: number;

  if (realAspectRatio > maxWidth / maxHeight) {
    // Image is wider than available space — constrain by width
    targetWidth = maxWidth;
    targetHeight = maxWidth / realAspectRatio;
  } else {
    // Image is taller — constrain by height
    targetHeight = maxHeight;
    targetWidth = maxHeight * realAspectRatio;
  }

  // Target position: centered on screen
  const targetX = (SCREEN_WIDTH - targetWidth) / 2;
  const targetY = (SCREEN_HEIGHT - targetHeight) / 2;

  // Interpolated styles — animate position and size from thumbnail to full
  const animatedContainerStyle = {
    position: 'absolute' as const,
    left: expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [imageLayout.x, targetX],
    }),
    top: expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [imageLayout.y, targetY],
    }),
    width: expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [imageLayout.width, targetWidth],
    }),
    height: expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [imageLayout.height, targetHeight],
    }),
    borderRadius: expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [PHOTO_RADIUS, 12],
    }),
    overflow: 'hidden' as const,
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

          {/* Animated expanded image — animates position, size, and aspect ratio */}
          <Animated.View
            style={animatedContainerStyle}
            pointerEvents="none"
          >
            <Image
              source={{ uri: photo.uri }}
              style={styles.expandedImage}
              resizeMode="cover"
            />
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
    borderRadius: PHOTO_RADIUS,
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
