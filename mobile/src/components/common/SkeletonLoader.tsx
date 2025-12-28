import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS } from '../../constants/config';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = BORDER_RADIUS.sm,
  style,
}: SkeletonLoaderProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

// Pre-built skeleton components
export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <SkeletonLoader width="100%" height={200} borderRadius={BORDER_RADIUS.lg} />
      <View style={styles.cardContent}>
        <SkeletonLoader width="60%" height={24} />
        <SkeletonLoader width="40%" height={16} style={{ marginTop: 8 }} />
        <SkeletonLoader width="80%" height={16} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

export function SkeletonProfile() {
  return (
    <View style={styles.profile}>
      <SkeletonLoader width={100} height={100} borderRadius={50} />
      <View style={styles.profileInfo}>
        <SkeletonLoader width="70%" height={24} />
        <SkeletonLoader width="50%" height={16} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.listItem}>
          <SkeletonLoader width={50} height={50} borderRadius={25} />
          <View style={styles.listItemContent}>
            <SkeletonLoader width="70%" height={16} />
            <SkeletonLoader width="50%" height={14} style={{ marginTop: 6 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.gray300,
  },
  card: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardContent: {
    padding: 16,
  },
  profile: {
    alignItems: 'center',
    padding: 24,
  },
  profileInfo: {
    marginTop: 16,
    alignItems: 'center',
    width: '100%',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.background,
    marginBottom: 8,
    borderRadius: BORDER_RADIUS.md,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
});
