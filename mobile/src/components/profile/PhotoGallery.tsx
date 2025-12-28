import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker'; // Temporarily disabled - restart Expo with: npx expo start -c
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_SIZE = (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md * 2) / 3;

interface Photo {
  id: string;
  photo: string;
  order: number;
}

interface PhotoGalleryProps {
  photos: Photo[];
  onPhotosReorder: (photos: Photo[]) => void;
  onPhotoAdd: (uri: string) => void;
  onPhotoDelete: (photoId: string) => void;
  maxPhotos?: number;
}

export default function PhotoGallery({
  photos,
  onPhotosReorder,
  onPhotoAdd,
  onPhotoDelete,
  maxPhotos = 6,
}: PhotoGalleryProps) {
  const [isReordering, setIsReordering] = useState(false);

  const handlePickImage = async () => {
    // Temporarily disabled - restart Expo with: npx expo start -c
    Alert.alert(
      'Restart Required',
      'Please restart the Expo server with "npx expo start -c" to enable photo upload.',
      [{ text: 'OK' }]
    );
    
    // Uncomment after restarting:
    // if (photos.length >= maxPhotos) {
    //   Alert.alert('Maximum Photos', `You can only upload up to ${maxPhotos} photos.`);
    //   return;
    // }
    // const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    // if (status !== 'granted') {
    //   Alert.alert('Permission Required', 'Please grant permission to access your photos.');
    //   return;
    // }
    // const result = await ImagePicker.launchImageLibraryAsync({
    //   mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //   allowsEditing: true,
    //   aspect: [3, 4],
    //   quality: 0.8,
    // });
    // if (!result.canceled && result.assets[0]) {
    //   onPhotoAdd(result.assets[0].uri);
    // }
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onPhotoDelete(photoId),
        },
      ]
    );
  };

  const renderPhotoItem = ({ item, drag, isActive }: RenderItemParams<Photo>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={isReordering ? drag : undefined}
          disabled={!isReordering || isActive}
          style={[
            styles.photoContainer,
            isActive && styles.photoContainerActive,
          ]}
        >
          <Image source={{ uri: item.photo }} style={styles.photo} />
          
          {/* Order Badge */}
          <View style={styles.orderBadge}>
            <Text style={styles.orderText}>{item.order + 1}</Text>
          </View>

          {/* Delete Button */}
          {!isReordering && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeletePhoto(item.id)}
            >
              <Ionicons name="close-circle" size={28} color={COLORS.error} />
            </TouchableOpacity>
          )}

          {/* Drag Indicator */}
          {isReordering && (
            <View style={styles.dragIndicator}>
              <Ionicons name="menu" size={24} color={COLORS.background} />
            </View>
          )}
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  const renderAddPhotoButton = () => {
    if (photos.length >= maxPhotos) return null;

    return (
      <TouchableOpacity
        style={styles.addPhotoButton}
        onPress={handlePickImage}
      >
        <Ionicons name="add-circle" size={40} color={COLORS.primary} />
        <Text style={styles.addPhotoText}>Add Photo</Text>
      </TouchableOpacity>
    );
  };

  // Create grid data with photos and add button
  const gridData = [...photos];
  if (photos.length < maxPhotos) {
    gridData.push({
      id: 'add-button',
      photo: '',
      order: photos.length,
    } as Photo);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Photos</Text>
          <Text style={styles.subtitle}>
            {photos.length}/{maxPhotos} photos
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.reorderButton,
            isReordering && styles.reorderButtonActive,
          ]}
          onPress={() => setIsReordering(!isReordering)}
          disabled={photos.length < 2}
        >
          <Ionicons
            name={isReordering ? 'checkmark' : 'swap-vertical'}
            size={20}
            color={isReordering ? COLORS.background : COLORS.primary}
          />
          <Text
            style={[
              styles.reorderButtonText,
              isReordering && styles.reorderButtonTextActive,
            ]}
          >
            {isReordering ? 'Done' : 'Reorder'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Photo Grid */}
      <DraggableFlatList
        data={photos}
        renderItem={renderPhotoItem}
        keyExtractor={(item) => item.id}
        onDragEnd={({ data }) => onPhotosReorder(data)}
        numColumns={3}
        scrollEnabled={false}
        ListFooterComponent={renderAddPhotoButton}
        contentContainerStyle={styles.gridContainer}
      />

      {/* Instructions */}
      {isReordering && (
        <View style={styles.instructionsContainer}>
          <Ionicons name="information-circle" size={16} color={COLORS.primary} />
          <Text style={styles.instructionsText}>
            Long press and drag to reorder photos
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  reorderButtonActive: {
    backgroundColor: COLORS.primary,
  },
  reorderButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  reorderButtonTextActive: {
    color: COLORS.background,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  photoContainer: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.33,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundDark,
    ...SHADOWS.md,
  },
  photoContainerActive: {
    opacity: 0.7,
    transform: [{ scale: 1.05 }],
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  orderBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: COLORS.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  deleteButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 14,
  },
  dragIndicator: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: BORDER_RADIUS.sm,
    padding: 4,
  },
  addPhotoButton: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.33,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
  },
  addPhotoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: BORDER_RADIUS.md,
  },
  instructionsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    flex: 1,
  },
});
