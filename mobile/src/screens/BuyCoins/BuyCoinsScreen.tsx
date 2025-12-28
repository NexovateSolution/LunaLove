import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import * as LinkingExpo from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCoinPackages, useWallet, usePurchaseCoins } from '../../hooks/useCoins';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/config';
import { CoinPackage } from '../../types';

export default function BuyCoinsScreen() {
  const { data: packages, isLoading } = useCoinPackages();
  const { data: wallet } = useWallet();
  const purchaseMutation = usePurchaseCoins();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const handlePurchase = async (pkg: CoinPackage) => {
    setSelectedPackage(pkg.id);

    try {
      const returnUrl = LinkingExpo.createURL('/coins/return');
      const result = await purchaseMutation.mutateAsync({ packageId: pkg.id, returnUrl });
      
      // Open Chapa checkout URL
      const supported = await Linking.canOpenURL(result.checkout_url);
      if (supported) {
        await Linking.openURL(result.checkout_url);
      } else {
        Alert.alert('Error', 'Unable to open payment page');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to initiate purchase');
    } finally {
      setSelectedPackage(null);
    }
  };

  const renderPackage = ({ item }: { item: CoinPackage }) => {
    const totalCoins = item.coins + item.bonus_coins;
    const isProcessing = selectedPackage === item.id;

    return (
      <TouchableOpacity
        style={[styles.packageCard, item.is_popular && styles.popularPackage]}
        onPress={() => handlePurchase(item)}
        disabled={isProcessing}
        activeOpacity={0.7}
      >
        {item.is_popular && (
          <View style={styles.popularBadge}>
            <Ionicons name="star" size={12} color={COLORS.background} style={{ marginRight: 4 }} />
            <Text style={styles.popularText}>MOST POPULAR</Text>
          </View>
        )}

        <View style={styles.packageHeader}>
          <View style={styles.coinIconContainer}>
            <Ionicons name="diamond" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.packageCoins}>{totalCoins}</Text>
          <Text style={styles.packageCoinsLabel}>Coins</Text>
        </View>

        {item.bonus_coins > 0 && (
          <View style={styles.bonusBadge}>
            <Ionicons name="gift" size={14} color={COLORS.green} style={{ marginRight: 4 }} />
            <Text style={styles.bonusText}>+{item.bonus_coins} Bonus</Text>
          </View>
        )}

        <Text style={styles.packageName}>{item.name}</Text>

        <TouchableOpacity
          style={styles.buyButton}
          onPress={() => handlePurchase(item)}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <>
              <Text style={styles.buyButtonText}>Buy for {item.price} ETB</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.background} />
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Current Balance */}
      <View style={styles.balanceContainer}>
        <View style={styles.balanceCard}>
          <Ionicons name="wallet" size={32} color={COLORS.primary} />
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>{wallet?.balance || 0} Coins</Text>
          </View>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>What can you do with coins?</Text>
        <View style={styles.infoList}>
          <InfoItem icon="gift" text="Send gifts to matches" />
          <InfoItem icon="star" text="Send Super Likes" />
          <InfoItem icon="sparkles" text="Boost your profile" />
        </View>
      </View>

      {/* Packages */}
      <FlatList
        data={packages || []}
        renderItem={renderPackage}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.packageRow}
        contentContainerStyle={styles.packagesList}
        showsVerticalScrollIndicator={false}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Secure payment powered by Chapa
        </Text>
      </View>
    </SafeAreaView>
  );
}

function InfoItem({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={20} color={COLORS.primary} />
      <Text style={styles.infoText}>{text}</Text>
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
  balanceContainer: {
    padding: SPACING.lg,
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceInfo: {
    marginLeft: SPACING.md,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  infoSection: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoList: {
    gap: SPACING.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  packagesList: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  packageRow: {
    gap: SPACING.md,
  },
  packageCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  popularPackage: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  packageHeader: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  packageCoins: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  packageCoinsLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  coinIconContainer: {
    marginBottom: SPACING.sm,
  },
  bonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.green}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  bonusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.green,
  },
  packageName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
    width: '100%',
  },
  buyButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
  packageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  packagePrice: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  footer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
});
