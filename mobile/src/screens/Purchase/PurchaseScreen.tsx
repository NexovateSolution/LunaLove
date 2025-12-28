import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import * as LinkingExpo from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useSubscriptionPlans, useSubscribeToPlan } from '../../hooks/useSubscriptions';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/config';
import { SubscriptionPlan } from '../../types';

export default function PurchaseScreen() {
  const route = useRoute();
  const params = route.params as { type?: 'subscription' | 'coins' } | undefined;
  const type = params?.type || 'subscription'; // Default to 'subscription' if no params
  const { user } = useAuthStore();
  const { data: plans, isLoading } = useSubscriptionPlans();
  const subscribeMutation = useSubscribeToPlan();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setSelectedPlan(plan.id);

    try {
      const returnUrl = LinkingExpo.createURL('/subscription/return');
      const result = await subscribeMutation.mutateAsync({ planId: plan.id, returnUrl });
      
      // Open Chapa checkout URL
      const supported = await Linking.canOpenURL(result.checkout_url);
      if (supported) {
        await Linking.openURL(result.checkout_url);
      } else {
        Alert.alert('Error', 'Unable to open payment page');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to initiate subscription');
    } finally {
      setSelectedPlan(null);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.headerSubtitle}>No subscription plans available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upgrade Your Experience</Text>
          <Text style={styles.headerSubtitle}>
            Get premium features and stand out from the crowd
          </Text>
        </View>

        {/* Plans */}
        {plans.map((plan) => (
          <View
            key={plan.id}
            style={[styles.planCard, plan.is_popular && styles.popularPlan]}
          >
            {plan.is_popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>MOST POPULAR</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <View style={styles.planIconContainer}>
                <Text style={styles.planIcon}>{plan.icon}</Text>
              </View>
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.planPrice}>{plan.price_etb} ETB</Text>
                {plan.duration_days && (
                  <Text style={styles.planDuration}>
                    /{plan.duration_days} days
                  </Text>
                )}
              </View>
            </View>

            <Text style={styles.planDescription}>{plan.description}</Text>

            {plan.features && plan.features.length > 0 && (
              <View style={styles.featuresContainer}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.subscribeButton,
                plan.is_popular && styles.popularButton,
                selectedPlan === plan.id && styles.loadingButton,
              ]}
              onPress={() => handleSubscribe(plan)}
              disabled={selectedPlan === plan.id}
            >
              {selectedPlan === plan.id ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <Text style={styles.subscribeButtonText}>
                  {getPlanButtonText(plan.code, user)}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ))}

        {/* Current Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Your Current Status</Text>
          <StatusItem
            icon="flash"
            label="Boost"
            active={user?.has_boost || false}
            expiry={user?.boost_expiry}
          />
          <StatusItem
            icon="eye"
            label="Likes Reveal"
            active={user?.can_see_likes || false}
            expiry={user?.likes_reveal_expiry}
          />
          <StatusItem
            icon="close-circle"
            label="Ad-Free"
            active={user?.ad_free || false}
            expiry={user?.ad_free_expiry}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Subscriptions auto-renew. Cancel anytime from settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getPlanButtonText(code: string, user: any): string {
  if (code === 'boost' && user?.has_boost) return 'Active';
  if (code === 'likes_reveal' && user?.can_see_likes) return 'Active';
  if (code === 'ad_free' && user?.ad_free) return 'Active';
  return 'Subscribe Now';
}

function StatusItem({
  icon,
  label,
  active,
  expiry,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  expiry?: string | null;
}) {
  return (
    <View style={styles.statusItem}>
      <Ionicons
        name={icon}
        size={24}
        color={active ? COLORS.success : COLORS.textSecondary}
      />
      <View style={styles.statusInfo}>
        <Text style={styles.statusLabel}>{label}</Text>
        {active && expiry && (
          <Text style={styles.statusExpiry}>
            Expires: {new Date(expiry).toLocaleDateString()}
          </Text>
        )}
        {!active && <Text style={styles.statusInactive}>Not active</Text>}
      </View>
      {active && (
        <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: COLORS.background,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: 16,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  popularPlan: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  planHeader: {
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  planIconContainer: {
    marginBottom: SPACING.sm,
  },
  planIcon: {
    fontSize: 48,
  },
  planDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  planName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  planDuration: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  featureText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  popularButton: {
    backgroundColor: COLORS.primary,
  },
  loadingButton: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
  statusContainer: {
    backgroundColor: COLORS.background,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: 16,
    padding: SPACING.lg,
  },
  statusTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusExpiry: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusInactive: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  footer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
