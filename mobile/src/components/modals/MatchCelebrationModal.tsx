import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient'; // Temporarily disabled - restart Expo with: npx expo start -c
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/config';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MatchCelebrationModalProps {
  visible: boolean;
  onClose: () => void;
  onSendMessage: () => void;
  matchedUser: {
    name: string;
    photo?: string;
  };
  currentUserPhoto?: string;
}

export default function MatchCelebrationModal({
  visible,
  onClose,
  onSendMessage,
  matchedUser,
  currentUserPhoto,
}: MatchCelebrationModalProps) {
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    if (visible && confettiRef.current) {
      confettiRef.current.start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Confetti */}
        <ConfettiCannon
          ref={confettiRef}
          count={200}
          origin={{ x: SCREEN_WIDTH / 2, y: 0 }}
          autoStart={false}
          fadeOut
        />

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color={COLORS.background} />
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <View style={[styles.titleGradient, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.title}>It's a Match!</Text>
          </View>

          <Text style={styles.subtitle}>
            You and {matchedUser.name} liked each other
          </Text>

          {/* Profile Photos */}
          <View style={styles.photosContainer}>
            {/* Current User Photo */}
            <View style={styles.photoWrapper}>
              {currentUserPhoto ? (
                <Image source={{ uri: currentUserPhoto }} style={styles.photo} />
              ) : (
                <View style={[styles.photo, styles.photoPlaceholder]}>
                  <Ionicons name="person" size={60} color={COLORS.gray400} />
                </View>
              )}
            </View>

            {/* Heart Icon */}
            <View style={styles.heartContainer}>
              <View style={[styles.heartGradient, { backgroundColor: COLORS.primary }]}>
                <Ionicons name="heart" size={32} color={COLORS.background} />
              </View>
            </View>

            {/* Matched User Photo */}
            <View style={styles.photoWrapper}>
              {matchedUser.photo ? (
                <Image source={{ uri: matchedUser.photo }} style={styles.photo} />
              ) : (
                <View style={[styles.photo, styles.photoPlaceholder]}>
                  <Ionicons name="person" size={60} color={COLORS.gray400} />
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.sendMessageButton}
              onPress={onSendMessage}
              activeOpacity={0.8}
            >
              <View style={[styles.buttonGradient, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.sendMessageText}>Send Message</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keepSwipingButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.keepSwipingText}>Keep Swiping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: SPACING.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    width: SCREEN_WIDTH - SPACING.xl * 2,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  titleGradient: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.background,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.background,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    opacity: 0.9,
  },
  photosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.lg,
  },
  photoWrapper: {
    borderWidth: 4,
    borderColor: COLORS.background,
    borderRadius: 80,
    padding: 4,
  },
  photo: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  photoPlaceholder: {
    backgroundColor: COLORS.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  heartGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  buttonsContainer: {
    width: '100%',
    gap: SPACING.md,
  },
  sendMessageButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
  },
  sendMessageText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.background,
  },
  keepSwipingButton: {
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  keepSwipingText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.background,
  },
});
