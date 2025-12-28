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
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscriptionPlans, useSubscribeToPlan } from '../../hooks/useSubscriptions';
import { useCoinPackages, useWallet, usePurchaseCoins } from '../../hooks/useCoins';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/config';
import { SubscriptionPlan, CoinPackage } from '../../types';

type TabType = 'premium' | 'coins';

export default function PurchaseScreenNew() {
  const [activeTab, setActiveTab] = useState<TabType>('premium');
  const { data: plans, isLoading } = useSubscriptionPlans();
  const { data: coinPackages, isLoading: isCoinLoading } = useCoinPackages();
  const { data: wallet } = useWallet();
  const subscribeMutation = useSubscribeToPlan();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const purchaseMutation = usePurchaseCoins();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setSelectedPlan(plan.id.toString());
    try {
      const returnUrl = LinkingExpo.createURL('/subscription/return');
      const result = await subscribeMutation.mutateAsync({
        planId: plan.id.toString(),
        returnUrl,
      });

      if (result?.checkout_url) {
        const supported = await Linking.canOpenURL(result.checkout_url);
        if (supported) {
          await Linking.openURL(result.checkout_url);
        } else {
          Alert.alert('Error', 'Unable to open payment page');
        }
      } else {
        Alert.alert('Error', 'Failed to initiate subscription');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to subscribe');
    } finally {
      setSelectedPlan(null);
    }
  };

  const handleBuyCoins = async (pkg: CoinPackage) => {
    setSelectedPackage(pkg.id);

    try {
      const returnUrl = LinkingExpo.createURL('/coins/return');
      const result = await purchaseMutation.mutateAsync({ packageId: pkg.id, returnUrl });

      if (result?.checkout_url) {
        const supported = await Linking.canOpenURL(result.checkout_url);
        if (supported) {
          await Linking.openURL(result.checkout_url);
        } else {
          Alert.alert('Error', 'Unable to open payment page');
        }
      } else {
        Alert.alert('Error', 'Failed to initiate purchase');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to initiate purchase');
    } finally {
      setSelectedPackage(null);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Premium & Gifts</Text>
          <Text style={styles.headerSubtitle}>Enhance your dating experience</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'premium' && styles.tabActive]}
          onPress={() => setActiveTab('premium')}
        >
          <LinearGradient
            colors={activeTab === 'premium' ? COLORS.gradientPrimary : ['#FFFFFF', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.tabGradient}
          >
            <Ionicons 
              name="flash" 
              size={20} 
              color={activeTab === 'premium' ? COLORS.background : COLORS.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'premium' && styles.tabTextActive]}>
              Premium Plans
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'coins' && styles.tabActive]}
          onPress={() => setActiveTab('coins')}
        >
          <LinearGradient
            colors={activeTab === 'coins' ? COLORS.gradientPrimary : ['#FFFFFF', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.tabGradient}
          >
            <Ionicons 
              name="gift" 
              size={20} 
              color={activeTab === 'coins' ? COLORS.background : COLORS.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'coins' && styles.tabTextActive]}>
              Gifts & Coins
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {activeTab === 'premium' ? (
          <>
            {/* Send Gifts Banner */}
            <View style={styles.giftBanner}>
              <View style={styles.giftBannerContent}>
                <Ionicons name="gift" size={32} color={COLORS.orange} />
                <View style={styles.giftBannerText}>
                  <Text style={styles.giftBannerTitle}>Send Gifts</Text>
                  <Text style={styles.giftBannerSubtitle}>Buy coins and send romantic gifts</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.viewGiftsButton}
                onPress={() => setActiveTab('coins')}
              >
                <Text style={styles.viewGiftsButtonText}>View Gifts</Text>
              </TouchableOpacity>
            </View>

            {/* Premium Subscriptions */}
            <Text style={styles.sectionTitle}>Premium Subscriptions</Text>
            <Text style={styles.sectionSubtitle}>
              Unlock unlimited likes, boosts, and premium features
            </Text>

            {plans && plans.map((plan, index) => {
              const isPopular = index === 1;

              return (
                <View
                  key={plan.id}
                  style={[styles.planCard, isPopular && styles.planCardPopular]}
                >
                  {isPopular && (
                    <LinearGradient
                      colors={['#F72585', '#B5179E']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.planPopularStrip}
                    >
                      <Text style={styles.planPopularStripText}>Most Popular</Text>
                    </LinearGradient>
                  )}

                  <View style={styles.planContentRow}>
                    <View style={styles.planIcon}>
                      <Text style={styles.planIconText}>{plan.icon}</Text>
                    </View>
                    <View style={styles.planInfo}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planPrice}>
                        {plan.price_etb}{' '}
                        <Text style={styles.planPriceCurrency}>ETB</Text>
                      </Text>
                      {plan.duration_days ? (
                        <Text style={styles.planDuration}>{plan.duration_days} days</Text>
                      ) : null}
                      <Text style={styles.planDescription}>{plan.description}</Text>
                    </View>
                  </View>

                  {plan.features && plan.features.length > 0 && (
                    <View style={styles.planFeatures}>
                      {plan.features.map((feature, idx) => (
                        <View key={idx} style={styles.planFeatureItem}>
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color="#22C55E"
                          />
                          <Text style={styles.planFeatureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.subscribeButton}
                    onPress={() => handleSubscribe(plan)}
                    disabled={selectedPlan === plan.id.toString()}
                  >
                    <LinearGradient
                      colors={
                        isPopular
                          ? ['#F72585', '#B5179E']
                          : [COLORS.gray100, COLORS.gray200]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.subscribeButtonGradient}
                    >
                      {selectedPlan === plan.id.toString() ? (
                        <ActivityIndicator color={COLORS.background} size="small" />
                      ) : (
                        <Text
                          style={[
                            styles.subscribeButtonText,
                            !isPopular && styles.subscribeButtonTextSecondary,
                          ]}
                        >
                          Subscribe Now
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        ) : (
          <>
            {/* Wallet Card */}
            <LinearGradient
              colors={['#FBBF24', '#F97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.walletCardOuter}
            >
              <View style={styles.walletCardInner}>
                <View style={styles.walletIconCircle}>
                  <Ionicons name="cash" size={28} color={COLORS.background} />
                </View>
                <Text style={styles.walletTitle}>Your Wallet</Text>
                <Text style={styles.walletBalance}>{wallet?.balance || 0} coins</Text>

                <View style={styles.walletStatsRow}>
                  <View style={styles.walletPill}>
                    <Text style={styles.walletPillLabel}>Total Spent</Text>
                    <Text style={styles.walletPillValue}>
                      {`${(wallet?.total_spent ?? 0).toFixed(2)} ETB`}
                    </Text>
                  </View>
                  <View style={styles.walletPill}>
                    <Text style={styles.walletPillLabel}>Total Earned</Text>
                    <Text style={styles.walletPillValue}>
                      {`${(wallet?.total_earned ?? 0).toFixed(2)} ETB`}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>

            {/* Buy Coins */}
            <Text style={styles.sectionTitle}>Buy Coins</Text>
            <Text style={styles.sectionSubtitle}>
              Purchase coins to send gifts and show your affection
            </Text>

            {isCoinLoading && !coinPackages?.length && (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            )}

            {coinPackages && coinPackages.map((pkg, index) => {
              const isPopular = index === 1;
              const totalCoins = pkg.total_coins ?? (pkg.coins + (pkg.bonus_coins || 0));

              return (
                <View key={pkg.id} style={[styles.coinCard, isPopular && styles.coinCardPopular]}>
                  {isPopular && (
                    <View style={styles.popularBadge}>
                      <LinearGradient
                        colors={['#F72585', '#B5179E']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.popularBadgeInner}
                      >
                        <Text style={styles.popularBadgeText}>Best Value</Text>
                      </LinearGradient>
                    </View>
                  )}
                  <View style={styles.coinIcon}>
                    <Text style={styles.coinIconText}>💰</Text>
                  </View>
                  <View style={styles.coinInfo}>
                    <Text style={styles.coinName}>{pkg.name}</Text>
                    <Text style={styles.coinAmount}>{totalCoins} coins</Text>
                    <Text style={styles.coinPrice}>{pkg.price_etb} ETB</Text>
                    {pkg.bonus_coins > 0 && (
                      <Text style={styles.coinBonus}>+{pkg.bonus_coins} bonus coins</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.buyButton}
                    onPress={() => handleBuyCoins(pkg)}
                  >
                    <LinearGradient
                      colors={isPopular ? ['#FBBF24', '#F97316'] : [COLORS.gray100, COLORS.gray200]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buyButtonGradient}
                    >
                      {selectedPackage === pkg.id ? (
                        <ActivityIndicator color={COLORS.background} />
                      ) : (
                        <Text style={[styles.buyButtonText, !isPopular && styles.buyButtonTextGray]}>
                          Buy Now
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              );
            })}

            <View style={styles.howGiftsCard}>
              <View style={styles.howGiftsHeader}>
                <Ionicons name="gift" size={18} color={COLORS.primary} />
                <Text style={styles.howGiftsTitle}>How Gifts Work</Text>
              </View>
              <View style={styles.howGiftsList}>
                <View style={styles.howGiftsStep}>
                  <View style={styles.howGiftsStepBadge}>
                    <Text style={styles.howGiftsStepBadgeText}>1</Text>
                  </View>
                  <Text style={styles.howGiftsStepText}>Buy coins with real money</Text>
                </View>
                <View style={styles.howGiftsStep}>
                  <View style={styles.howGiftsStepBadge}>
                    <Text style={styles.howGiftsStepBadgeText}>2</Text>
                  </View>
                  <Text style={styles.howGiftsStepText}>Send gifts to other users using coins</Text>
                </View>
                <View style={styles.howGiftsStep}>
                  <View style={styles.howGiftsStepBadge}>
                    <Text style={styles.howGiftsStepBadgeText}>3</Text>
                  </View>
                  <Text style={styles.howGiftsStepText}>Recipients earn 70% of gift value in their bank account</Text>
                </View>
                <View style={styles.howGiftsStep}>
                  <View style={styles.howGiftsStepBadge}>
                    <Text style={styles.howGiftsStepBadgeText}>4</Text>
                  </View>
                  <Text style={styles.howGiftsStepText}>Platform keeps 30% to maintain the service</Text>
                </View>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabActive: {
    shadowOpacity: 0.2,
    elevation: 5,
  },
  tabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  giftBanner: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.orange,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  giftBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  giftBannerText: {
    flex: 1,
  },
  giftBannerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  giftBannerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  viewGiftsButton: {
    backgroundColor: COLORS.orange,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  viewGiftsButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  planCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden', // so the gradient strip follows the rounded corners
  },
  planCardPopular: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  planPopularStrip: {
    marginHorizontal: -SPACING.lg,
    marginTop: -SPACING.lg,
    marginBottom: SPACING.md,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    paddingVertical: 4,
    paddingHorizontal: SPACING.md,
  },
  planPopularStripText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.background,
    textAlign: 'left',
  },
  planContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  planIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  planIconText: {
    fontSize: 32,
  },
  planInfo: {
    marginBottom: SPACING.md,
  },
  planName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  planDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  planPrice: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  planPriceCurrency: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  planDuration: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 4,
  },
  planFeatures: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  planFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  planFeatureText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  subscribeButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  subscribeButtonGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
  subscribeButtonTextSecondary: {
    color: COLORS.text,
  },
  walletCardOuter: {
    borderRadius: BORDER_RADIUS.xl,
    padding: 2,
    marginBottom: SPACING.lg,
  },
  walletCardInner: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  walletIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  walletTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  walletStatsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
    marginTop: SPACING.sm,
  },
  walletPill: {
    flex: 1,
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  walletPillLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  walletPillValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  coinCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  coinCardPopular: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  popularBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },
  popularBadgeInner: {
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  popularBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.background,
  },
  coinIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.orangeLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  coinIconText: {
    fontSize: 32,
  },
  coinInfo: {
    marginBottom: SPACING.md,
  },
  coinName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  coinAmount: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  coinPrice: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.orange,
  },
  buyButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  buyButtonGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
  buyButtonTextGray: {
    color: COLORS.text,
  },
  howGiftsCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  howGiftsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  howGiftsTitle: {
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  howGiftsList: {
    gap: SPACING.sm,
  },
  howGiftsStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  howGiftsStepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  howGiftsStepBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  howGiftsStepText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
