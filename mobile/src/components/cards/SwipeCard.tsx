import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient'; // Temporarily disabled - restart Expo with: npx expo start -c
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { PanGestureHandler, GestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { PotentialMatch } from '../../types';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/config';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.65;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface SwipeCardProps {
  profile: PotentialMatch;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onPress?: () => void;
  isTop: boolean;
}

export default function SwipeCard({
  profile,
  onSwipeLeft,
  onSwipeRight,
  onPress,
  isTop,
}: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = React.useState(0);

  const photos = profile.user_photos || [];
  const currentPhoto = photos[currentPhotoIndex]?.photo || '';

  const gestureHandler = (event: GestureHandlerGestureEvent) => {
    'worklet';
    // This is a simplified version - for full gesture handling, consider using react-native-gesture-handler v2 API
  };

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-15, 0, 15],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [1, 0.8],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
      opacity,
    };
  });

  const likeStampStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    );

    return { opacity };
  });

  const nopeStampStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    );

    return { opacity };
  });

  const handlePhotoTap = (side: 'left' | 'right') => {
    if (side === 'left' && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    } else if (side === 'right' && currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  if (!isTop) {
    return (
      <View style={[styles.card, styles.cardBehind]}>
        <Image source={{ uri: currentPhoto }} style={styles.photo} />
      </View>
    );
  }

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.card, cardStyle]}>
        {/* Photo */}
        <Image source={{ uri: currentPhoto }} style={styles.photo} />

        {/* Photo Navigation Areas */}
        <View style={styles.photoNavigation}>
          <TouchableOpacity
            style={styles.photoNavLeft}
            onPress={() => handlePhotoTap('left')}
            activeOpacity={1}
          />
          <TouchableOpacity
            style={styles.photoNavCenter}
            onPress={onPress}
            activeOpacity={1}
          />
          <TouchableOpacity
            style={styles.photoNavRight}
            onPress={() => handlePhotoTap('right')}
            activeOpacity={1}
          />
        </View>

        {/* Photo Indicators */}
        {photos.length > 1 && (
          <View style={styles.photoIndicators}>
            {photos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentPhotoIndex && styles.indicatorActive,
                ]}
              />
            ))}
          </View>
        )}

        {/* Like Stamp */}
        <Animated.View style={[styles.stamp, styles.likeStamp, likeStampStyle]}>
          <Text style={styles.stampText}>LIKE</Text>
        </Animated.View>

        {/* Nope Stamp */}
        <Animated.View style={[styles.stamp, styles.nopeStamp, nopeStampStyle]}>
          <Text style={styles.stampText}>NOPE</Text>
        </Animated.View>

        {/* Profile Info */}
        <View style={[styles.infoGradient, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <View style={styles.infoContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>
                {profile.first_name}, {profile.age}
              </Text>
            </View>
            
            {profile.bio && (
              <Text style={styles.bio} numberOfLines={2}>
                {profile.bio}
              </Text>
            )}

            <View style={styles.detailsRow}>
              {profile.city && (
                <View style={styles.detailItem}>
                  <Ionicons name="location" size={14} color={COLORS.background} />
                  <Text style={styles.detailText}>{profile.city}</Text>
                </View>
              )}
              {profile.relationship_intent && (
                <View style={styles.detailItem}>
                  <Ionicons name="heart" size={14} color={COLORS.background} />
                  <Text style={styles.detailText}>{profile.relationship_intent}</Text>
                </View>
              )}
            </View>

            {profile.interests && profile.interests.length > 0 && (
              <View style={styles.interestsContainer}>
                {profile.interests.slice(0, 3).map((interest) => (
                  <View key={interest.id} style={styles.interestTag}>
                    <Text style={styles.interestText}>
                      {interest.emoji} {interest.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  cardBehind: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoNavigation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  photoNavLeft: {
    flex: 1,
  },
  photoNavCenter: {
    flex: 2,
  },
  photoNavRight: {
    flex: 1,
  },
  photoIndicators: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    gap: 4,
  },
  indicator: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  indicatorActive: {
    backgroundColor: COLORS.background,
  },
  stamp: {
    position: 'absolute',
    top: 80,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderWidth: 4,
    borderRadius: 8,
    transform: [{ rotate: '-20deg' }],
  },
  likeStamp: {
    right: 40,
    borderColor: COLORS.success,
  },
  nopeStamp: {
    left: 40,
    borderColor: COLORS.error,
  },
  stampText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  infoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: SPACING.xxl * 2,
  },
  infoContainer: {
    padding: SPACING.lg,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  name: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  bio: {
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    marginBottom: SPACING.sm,
    opacity: 0.9,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
    opacity: 0.9,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  interestTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  interestText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.background,
  },
});
