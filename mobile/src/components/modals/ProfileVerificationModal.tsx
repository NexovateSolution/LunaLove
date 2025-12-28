import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker'; // Temporarily disabled - restart Expo with: npx expo start -c
import { COLORS, SPACING, FONT_SIZES } from '../../constants/config';
import ApiService from '../../services/api';

interface ProfileVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProfileVerificationModal({
  visible,
  onClose,
  onSuccess,
}: ProfileVerificationModalProps) {
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickIdPhoto = async () => {
    Alert.alert(
      'Restart Required',
      'Please restart the Expo server with "npx expo start -c" to enable photo upload.',
      [{ text: 'OK' }]
    );
    // Uncomment after restarting:
    // const result = await ImagePicker.launchImageLibraryAsync({
    //   mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //   allowsEditing: true,
    //   quality: 0.8,
    // });
    // if (!result.canceled) {
    //   setIdPhoto(result.assets[0].uri);
    // }
  };

  const takeSelfie = async () => {
    Alert.alert(
      'Restart Required',
      'Please restart the Expo server with "npx expo start -c" to enable camera.',
      [{ text: 'OK' }]
    );
    // Uncomment after restarting:
    // const result = await ImagePicker.launchCameraAsync({
    //   allowsEditing: true,
    //   quality: 0.8,
    // });
    // if (!result.canceled) {
    //   setSelfiePhoto(result.assets[0].uri);
    // }
  };

  const handleSubmit = async () => {
    if (!idPhoto || !selfiePhoto) {
      Alert.alert('Required', 'Please upload both ID and selfie photos');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('id_photo', {
        uri: idPhoto,
        type: 'image/jpeg',
        name: 'id.jpg',
      } as any);
      formData.append('selfie_photo', {
        uri: selfiePhoto,
        type: 'image/jpeg',
        name: 'selfie.jpg',
      } as any);

      await ApiService.submitVerification(formData);
      Alert.alert('Success', 'Verification submitted! We will review within 24 hours.');
      onSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verify Profile</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={48} color={COLORS.primary} />
            <Text style={styles.infoTitle}>Get Verified</Text>
            <Text style={styles.infoText}>
              Verified profiles get more matches and trust. Upload your ID and a selfie to verify your identity.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Upload ID Photo</Text>
            <Text style={styles.sectionDescription}>
              Government-issued ID (passport, driver's license, national ID)
            </Text>
            {idPhoto ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: idPhoto }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeButton} onPress={() => setIdPhoto(null)}>
                  <Ionicons name="close-circle" size={32} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadButton} onPress={pickIdPhoto}>
                <Ionicons name="document" size={40} color={COLORS.primary} />
                <Text style={styles.uploadText}>Upload ID</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Take a Selfie</Text>
            <Text style={styles.sectionDescription}>
              Clear photo of your face matching your ID
            </Text>
            {selfiePhoto ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: selfiePhoto }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeButton} onPress={() => setSelfiePhoto(null)}>
                  <Ionicons name="close-circle" size={32} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadButton} onPress={takeSelfie}>
                <Ionicons name="camera" size={40} color={COLORS.primary} />
                <Text style={styles.uploadText}>Take Selfie</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>Tips for verification:</Text>
            <View style={styles.tip}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.tipText}>Make sure your ID is clear and readable</Text>
            </View>
            <View style={styles.tip}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.tipText}>Your face should be clearly visible in selfie</Text>
            </View>
            <View style={styles.tip}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.tipText}>Use good lighting for both photos</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, (!idPhoto || !selfiePhoto) && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={!idPhoto || !selfiePhoto || submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <Text style={styles.submitButtonText}>Submit for Verification</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  infoCard: {
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    padding: SPACING.xl,
    borderRadius: 16,
    marginBottom: SPACING.xl,
  },
  infoTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  uploadButton: {
    backgroundColor: COLORS.backgroundDark,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },
  photoPreview: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.backgroundDark,
  },
  removeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },
  tipsCard: {
    backgroundColor: COLORS.backgroundDark,
    padding: SPACING.md,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  tipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 25,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
});
