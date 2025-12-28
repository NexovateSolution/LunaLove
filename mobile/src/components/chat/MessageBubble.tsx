import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient'; // Temporarily disabled - restart Expo with: npx expo start -c
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/config';
import { ChatMessage } from '../../types';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
}

export default function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const getStatusIcon = () => {
    if (!isOwnMessage) return null;

    if (message.is_read) {
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="checkmark-done" size={14} color={COLORS.blue} />
        </View>
      );
    }

    if (message.created_at) {
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="checkmark" size={14} color={COLORS.gray400} />
        </View>
      );
    }

    return (
      <View style={styles.statusContainer}>
        <Ionicons name="time-outline" size={14} color={COLORS.gray400} />
      </View>
    );
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  if (isOwnMessage) {
    return (
      <View style={styles.ownMessageContainer}>
        <View style={[styles.ownBubble, { backgroundColor: COLORS.primary }]}>
          <Text style={styles.ownMessageText}>{message.content}</Text>
        </View>
        <View style={styles.messageFooter}>
          <Text style={styles.timestamp}>{formatTime(message.created_at)}</Text>
          {getStatusIcon()}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.otherMessageContainer}>
      <View style={styles.otherBubble}>
        <Text style={styles.otherMessageText}>{message.content}</Text>
      </View>
      <Text style={styles.timestamp}>{formatTime(message.created_at)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ownMessageContainer: {
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  ownBubble: {
    maxWidth: '75%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: 4,
  },
  ownMessageText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    lineHeight: 20,
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  otherBubble: {
    maxWidth: '75%',
    backgroundColor: COLORS.gray200,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.lg,
    borderBottomLeftRadius: 4,
  },
  otherMessageText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  timestamp: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusContainer: {
    marginLeft: 2,
  },
});
