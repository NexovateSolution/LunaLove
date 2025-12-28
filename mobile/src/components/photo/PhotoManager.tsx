import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker'; // Temporarily disabled - restart Expo with: npx expo start -c
import { COLORS, SPACING, FONT_SIZES } from '../../constants/config';
import ApiService from '../../services/api';

interface Photo {
  id: string;
  photo: string;
  is_primary: boolean;
}

interface PhotoManagerProps {
  photos: Photo[];
  onPhotosUpdate: (photos: Photo[]) => void;
  maxPhotos?: number;
}

export default function PhotoManager({
  photos,
  onPhotosUpdate,
  maxPhotos = 6,
}: PhotoManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const pickImage = async () => {
    Alert.alert(
      'Restart Required',
      'Please restart the Expo server with "npx expo start -c" to enable photo upload.',
      [{ text: 'OK' }]
    );
    // Uncomment after restarting:
    // if (photos.length >= maxPhotos) {
    //   Alert.alert('Limit Reached', `You can upload up to ${maxPhotos} photos`);
    //   return;
    // }
    // const result = await ImagePicker.launchImageLibraryAsync({
    //   mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //   allowsEditing: true,
    //   aspect: [3, 4],
    //   quality: 0.8,
    // });
    // if (!result.canceled) {
    //   await uploadPhoto(result.assets[0].uri);
    // }
  };

  const takePhoto = async () => {
    Alert.alert(
      'Restart Required',
      'Please restart the Expo server with "npx expo start -c" to enable camera.',
      [{ text: 'OK' }]
    );
    // Uncomment after restarting:
    // if (photos.length >= maxPhotos) {
    //   Alert.alert('Limit Reached', `You can upload up to ${maxPhotos} photos`);
    //   return;
    // }
    // const result = await ImagePicker.launchCameraAsync({
    //   allowsEditing: true,
    //   aspect: [3, 4],
    //   quality: 0.8,
    // });
    // if (!result.canceled) {
    //   await uploadPhoto(result.assets[0].uri);
    // }
  };

  const uploadPhoto = async (uri: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);

      const response = await ApiService.uploadPhoto(formData);
      onPhotosUpdate([...photos, response]);
      Alert.alert('Success', 'Photo uploaded successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoId: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(photoId);
            try {
              await ApiService.deletePhoto(photoId);
              onPhotosUpdate(photos.filter((p) => p.id !== photoId));
              Alert.alert('Success', 'Photo deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete photo');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const setPrimaryPhoto = async (photoId: string) => {
    try {
      await ApiService.setPrimaryPhoto(photoId);
      const updatedPhotos = photos.map((p) => ({
        ...p,
        is_primary: p.id === photoId,
      }));
      onPhotosUpdate(updatedPhotos);
      Alert.alert('Success', 'Primary photo updated');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to set primary photo');
    }
  };

  const showPhotoOptions = (photo: Photo) => {
    Alert.alert(
      'Photo Options',
      '',
      [
        !photo.is_primary && {
          text: 'Set as Primary',
          onPress: () => setPrimaryPhoto(photo.id),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePhoto(photo.id),
        },
        { text: 'Cancel', style: 'cancel' },
      ].filter(Boolean) as any
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Photos</Text>
        <Text style={styles.subtitle}>
          {photos.length}/{maxPhotos} photos
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.photosContainer}
      >
        {/* Existing Photos */}
        {photos.map((photo) => (
          <TouchableOpacity
            key={photo.id}
            style={styles.photoCard}
            onPress={() => showPhotoOptions(photo)}
            disabled={deletingId === photo.id}
          >
            <Image source={{ uri: photo.photo }} style={styles.photo} />
            {photo.is_primary && (
              <View style={styles.primaryBadge}>
                <Ionicons name="star" size={16} color={COLORS.warning} />
                <Text style={styles.primaryText}>Primary</Text>
              </View>
            )}
            {deletingId === photo.id && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color={COLORS.background} />
              </View>
            )}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deletePhoto(photo.id)}
            >
              <Ionicons name="close-circle" size={28} color={COLORS.error} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {/* Add Photo Buttons */}
        {photos.length < maxPhotos && (
          <>
            <TouchableOpacity
              style={styles.addPhotoCard}
              onPress={pickImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons name="images" size={40} color={COLORS.primary} />
                  <Text style={styles.addPhotoText}>Gallery</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addPhotoCard}
              onPress={takePhoto}
              disabled={uploading}
            >
              <Ionicons name="camera" size={40} color={COLORS.primary} />
              <Text style={styles.addPhotoText}>Camera</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <Text style={styles.hint}>
        Tap a photo to set as primary or delete. First photo is your profile picture.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  photosContainer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  photoCard: {
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.backgroundDark,
  },
  primaryBadge: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 12,
  },
  primaryText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.warning,
  },
  deleteButton: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoCard: {
    width: 120,
    height: 160,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  hint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
});
