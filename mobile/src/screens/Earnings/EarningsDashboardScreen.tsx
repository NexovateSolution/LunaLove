import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/config';
import ApiService from '../../services/api';

interface EarningsData {
  total_earnings: number;
  available_for_withdrawal: number;
  pending_earnings: number;
  lifetime_earnings: number;
  current_month_earnings: number;
}

interface GiftReceived {
  id: string;
  sender_name: string;
  gift_name: string;
  gift_icon: string;
  coin_value: number;
  etb_value: number;
  created_at: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  requested_at: string;
  completed_at?: string;
  transaction_id?: string;
}

export default function EarningsDashboardScreen() {
  const navigation = useNavigation();
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [gifts, setGifts] = useState<GiftReceived[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'gifts' | 'withdrawals'>('gifts');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [earningsData, giftsData, withdrawalsData] = await Promise.all([
        ApiService.getEarnings(),
        ApiService.getReceivedGifts(),
        ApiService.getWithdrawals(),
      ]);
      setEarnings(earningsData);
      setGifts(giftsData);
      setWithdrawals(withdrawalsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestWithdrawal = () => {
    if (!earnings || earnings.available_for_withdrawal < 100) {
      Alert.alert('Insufficient Balance', 'Minimum withdrawal amount is 100 ETB');
      return;
    }
    navigation.navigate('BankAccountSetup');
  };

  const renderGiftItem = ({ item }: { item: GiftReceived }) => (
    <View style={styles.listItem}>
      <View style={styles.giftIcon}>
        <Text style={styles.giftEmoji}>{item.gift_icon}</Text>
      </View>
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>
          {item.sender_name} sent {item.gift_name}
        </Text>
        <Text style={styles.listItemSubtitle}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.listItemRight}>
        <Text style={styles.earningsAmount}>+{item.etb_value} ETB</Text>
        <Text style={styles.coinsAmount}>{item.coin_value} coins</Text>
      </View>
    </View>
  );

  const renderWithdrawalItem = ({ item }: { item: Withdrawal }) => (
    <View style={styles.listItem}>
      <View style={[styles.statusIcon, getStatusStyle(item.status)]}>
        <Ionicons
          name={getStatusIcon(item.status)}
          size={24}
          color={COLORS.background}
        />
      </View>
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>{item.amount} ETB</Text>
        <Text style={styles.listItemSubtitle}>
          {new Date(item.requested_at).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.listItemRight}>
        <Text style={[styles.statusText, getStatusStyle(item.status)]}>
          {item.status}
        </Text>
      </View>
    </View>
  );

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'failed':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return { backgroundColor: COLORS.success };
      case 'pending':
        return { backgroundColor: COLORS.warning };
      case 'failed':
        return { backgroundColor: COLORS.error };
      default:
        return { backgroundColor: COLORS.textSecondary };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Overview Cards */}
        <View style={styles.cardsContainer}>
          <View style={[styles.card, styles.primaryCard]}>
            <Ionicons name="wallet" size={32} color={COLORS.background} />
            <Text style={styles.cardLabel}>Available</Text>
            <Text style={styles.cardValue}>{earnings?.available_for_withdrawal || 0} ETB</Text>
          </View>

          <View style={styles.card}>
            <Ionicons name="trending-up" size={24} color={COLORS.primary} />
            <Text style={styles.cardLabel}>This Month</Text>
            <Text style={styles.cardValueSmall}>{earnings?.current_month_earnings || 0} ETB</Text>
          </View>

          <View style={styles.card}>
            <Ionicons name="star" size={24} color={COLORS.warning} />
            <Text style={styles.cardLabel}>Lifetime</Text>
            <Text style={styles.cardValueSmall}>{earnings?.lifetime_earnings || 0} ETB</Text>
          </View>
        </View>

        {/* Withdrawal Button */}
        <TouchableOpacity
          style={styles.withdrawButton}
          onPress={handleRequestWithdrawal}
        >
          <Ionicons name="cash" size={24} color={COLORS.background} />
          <Text style={styles.withdrawButtonText}>Request Withdrawal</Text>
        </TouchableOpacity>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How it works</Text>
            <Text style={styles.infoText}>
              You earn 70% of the value of gifts you receive. Minimum withdrawal is 100 ETB.
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'gifts' && styles.activeTab]}
            onPress={() => setActiveTab('gifts')}
          >
            <Text style={[styles.tabText, activeTab === 'gifts' && styles.activeTabText]}>
              Gift History
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'withdrawals' && styles.activeTab]}
            onPress={() => setActiveTab('withdrawals')}
          >
            <Text style={[styles.tabText, activeTab === 'withdrawals' && styles.activeTabText]}>
              Withdrawals
            </Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        <View style={styles.listContainer}>
          {activeTab === 'gifts' ? (
            gifts.length > 0 ? (
              <FlatList
                data={gifts}
                renderItem={renderGiftItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="gift-outline" size={60} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>No gifts received yet</Text>
              </View>
            )
          ) : withdrawals.length > 0 ? (
            <FlatList
              data={withdrawals}
              renderItem={renderWithdrawalItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cash-outline" size={60} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>No withdrawals yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cardsContainer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 16,
    padding: SPACING.md,
    alignItems: 'center',
  },
  primaryCard: {
    backgroundColor: COLORS.primary,
    flex: 1.5,
  },
  cardLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
    marginTop: SPACING.xs,
    opacity: 0.9,
  },
  cardValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.background,
    marginTop: SPACING.xs,
  },
  cardValueSmall: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.success,
    marginHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 25,
    marginBottom: SPACING.lg,
  },
  withdrawButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundDark,
    marginHorizontal: SPACING.lg,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: SPACING.lg,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  giftIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  giftEmoji: {
    fontSize: 28,
  },
  statusIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  earningsAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.success,
  },
  coinsAmount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
});
