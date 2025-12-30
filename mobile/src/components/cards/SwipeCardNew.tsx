import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  PanGestureHandlerStateChangeEvent,
  State as GestureState,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import SafeImage from '../common/SafeImage';
import { PotentialMatch } from '../../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/config';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.92;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.68;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface SwipeCardNewProps {
  profile: PotentialMatch;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onInfoPress?: () => void;
  isTop: boolean;
}

export default function SwipeCardNew({
  profile,
  onSwipeLeft,
  onSwipeRight,
  onInfoPress,
  isTop,
}: SwipeCardNewProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const photos = profile.user_photos || [];
  const currentPhoto = photos[currentPhotoIndex]?.photo || '';
  const age = profile.date_of_birth ? calculateAge(profile.date_of_birth) : '';

  // Reset card position whenever we get a new profile or the card becomes the top card
  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
  }, [profile.id, isTop]);

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    if (!isTop) return;
    translateX.value = event.nativeEvent.translationX;
    translateY.value = event.nativeEvent.translationY;
  };

  const onHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (!isTop) return;

    const { state, translationX } = event.nativeEvent;

    if (
      state === GestureState.END ||
      state === GestureState.CANCELLED ||
      state === GestureState.FAILED
    ) {
      const absX = Math.abs(translationX);
      const shouldDismiss = absX > SWIPE_THRESHOLD;

      if (shouldDismiss) {
        const direction = translationX > 0 ? 1 : -1;
        // Animate the card off-screen for visual feedback
        translateX.value = withSpring(direction * SCREEN_WIDTH * 1.5);
        // Immediately trigger the corresponding swipe action on JS side
        if (direction > 0) {
          onSwipeRight();
        } else {
          onSwipeLeft();
        }
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    }
  };

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-10, 0, 10],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    ),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    ),
  }));

  const handlePhotoNav = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    } else if (direction === 'next' && currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  if (!isTop) {
    return (
      <View style={[styles.card, styles.cardBehind]}>
        <SafeImage uri={currentPhoto} style={styles.photo} />
      </View>
    );
  }

  return (
    <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
      <Animated.View style={[styles.card, cardStyle]}>
        {/* Main Photo */}
        <SafeImage uri={currentPhoto} style={styles.photo} />

        {/* Photo Navigation Overlays */}
        <View style={styles.photoNavigation}>
          <TouchableOpacity
            style={styles.navLeft}
            onPress={() => handlePhotoNav('prev')}
            activeOpacity={1}
          />
          <TouchableOpacity
            style={styles.navRight}
            onPress={() => handlePhotoNav('next')}
            activeOpacity={1}
          />
        </View>

        {/* Age Badge - Top Left */}
        {age && (
          <View style={styles.ageBadge}>
            <Text style={styles.ageBadgeText}>{age} years old</Text>
          </View>
        )}

        {/* Photo Indicators */}
        {photos.length > 1 && (
          <View style={styles.indicators}>
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

        {/* Swipe Stamps */}
        <Animated.View style={[styles.stamp, styles.likeStamp, likeOpacity]}>
          <Text style={styles.stampText}>LIKE</Text>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.nopeStamp, nopeOpacity]}>
          <Text style={styles.stampText}>NOPE</Text>
        </Animated.View>

        {/* Bottom Info Card */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.infoGradient}
        >
          <View style={styles.infoContainer}>
            <Text style={styles.name}>{profile.first_name}</Text>
            
            {profile.city && (
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={COLORS.background} />
                <Text style={styles.locationText}>{profile.city}</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Info Button - Bottom Right */}
        <TouchableOpacity style={styles.infoButton} onPress={onInfoPress}>
          <Ionicons name="information-circle" size={28} color={COLORS.background} />
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.background,
    position: 'absolute',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  navLeft: {
    flex: 1,
  },
  navRight: {
    flex: 1,
  },
  ageBadge: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  ageBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.background,
  },
  indicators: {
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
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  indicatorActive: {
    backgroundColor: COLORS.background,
  },
  stamp: {
    position: 'absolute',
    top: 50,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 4,
    transform: [{ rotate: '-20deg' }],
  },
  likeStamp: {
    right: 30,
    borderColor: COLORS.success,
  },
  nopeStamp: {
    left: 30,
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
    paddingTop: 60,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  infoContainer: {
    gap: 4,
  },
  name: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
    opacity: 0.9,
  },
  infoButton: {
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
