import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/config';

interface ProfileStatsCardsProps {
  profileCompleteness: number;
  profileViews: number;
  likesReceived: number;
  matchesCount: number;
}

export default function ProfileStatsCards({
  profileCompleteness,
  profileViews,
  likesReceived,
  matchesCount,
}: ProfileStatsCardsProps) {
  const stats = [
    {
      icon: 'checkmark-circle' as const,
      label: 'Profile',
      value: `${profileCompleteness}%`,
      color: COLORS.green,
      subtitle: 'Complete',
    },
    {
      icon: 'eye' as const,
      label: 'Views',
      value: profileViews.toString(),
      color: COLORS.blue,
      subtitle: 'This week',
    },
    {
      icon: 'heart' as const,
      label: 'Likes',
      value: likesReceived.toString(),
      color: COLORS.pink,
      subtitle: 'Received',
    },
    {
      icon: 'people' as const,
      label: 'Matches',
      value: matchesCount.toString(),
      color: COLORS.purple,
      subtitle: 'Total',
    },
  ];

  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <View key={index} style={styles.statCard}>
          <View style={[styles.iconContainer, { backgroundColor: `${stat.color}15` }]}>
            <Ionicons name={stat.icon} size={24} color={stat.color} />
          </View>
          <Text style={styles.statValue}>{stat.value}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
          <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
});
