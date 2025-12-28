import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../constants/config';

interface FloatingActionButtonsProps {
  onRewind: () => void;
  onDislike: () => void;
  onLike: () => void;
  onSuperLike: () => void;
  onBoost: () => void;
  canRewind?: boolean;
  canSuperLike?: boolean;
  canBoost?: boolean;
  showSuperLike?: boolean;
  showBoost?: boolean;
}

export default function FloatingActionButtons({
  onRewind,
  onDislike,
  onLike,
  onSuperLike,
  onBoost,
  canRewind = false,
  canSuperLike = false,
  canBoost = false,
  showSuperLike = true,
  showBoost = true,
}: FloatingActionButtonsProps) {
  return (
    <View style={styles.container}>
      {/* Rewind Button */}
      <TouchableOpacity
        style={[
          styles.button,
          styles.mediumButton,
          styles.rewindButton,
          !canRewind && styles.disabledButton,
        ]}
        onPress={onRewind}
        disabled={!canRewind}
        activeOpacity={0.7}
      >
        <Ionicons
          name="arrow-undo"
          size={24}
          color={canRewind ? COLORS.yellow : COLORS.gray400}
        />
      </TouchableOpacity>

      {/* Dislike Button */}
      <TouchableOpacity
        style={[styles.button, styles.largeButton, styles.dislikeButton]}
        onPress={onDislike}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={32} color={COLORS.red} />
      </TouchableOpacity>

      {/* Like Button (Largest) */}
      <TouchableOpacity
        style={[styles.button, styles.extraLargeButton, styles.likeButton]}
        onPress={onLike}
        activeOpacity={0.7}
      >
        <Ionicons name="heart" size={36} color={COLORS.green} />
      </TouchableOpacity>

      {/* Super Like Button */}
      {showSuperLike && (
        <TouchableOpacity
          style={[
            styles.button,
            styles.mediumButton,
            styles.superLikeButton,
            !canSuperLike && styles.disabledButton,
          ]}
          onPress={onSuperLike}
          disabled={!canSuperLike}
          activeOpacity={0.7}
        >
          <Ionicons
            name="star"
            size={24}
            color={canSuperLike ? COLORS.blue : COLORS.gray400}
          />
        </TouchableOpacity>
      )}

      {/* Boost Button */}
      {showBoost && (
        <TouchableOpacity
          style={[
            styles.button,
            styles.mediumButton,
            styles.boostButton,
            !canBoost && styles.disabledButton,
          ]}
          onPress={onBoost}
          disabled={!canBoost}
          activeOpacity={0.7}
        >
          <Ionicons
            name="flash"
            size={24}
            color={canBoost ? COLORS.purple : COLORS.gray400}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 85,
    left: 0,
    right: 0,
  },
  button: {
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9999,
    ...SHADOWS.lg,
  },
  mediumButton: {
    width: 56,
    height: 56,
  },
  largeButton: {
    width: 64,
    height: 64,
  },
  extraLargeButton: {
    width: 72,
    height: 72,
  },
  rewindButton: {
    borderWidth: 2,
    borderColor: COLORS.yellow,
  },
  dislikeButton: {
    borderWidth: 2,
    borderColor: COLORS.red,
  },
  likeButton: {
    borderWidth: 2,
    borderColor: COLORS.green,
  },
  superLikeButton: {
    borderWidth: 2,
    borderColor: COLORS.blue,
  },
  boostButton: {
    borderWidth: 2,
    borderColor: COLORS.purple,
  },
  disabledButton: {
    opacity: 0.4,
    borderColor: COLORS.gray300,
  },
});
