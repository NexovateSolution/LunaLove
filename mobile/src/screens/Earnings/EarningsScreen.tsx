import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEarnings, useWithdraw } from '../../hooks/useEarnings';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/config';

export default function EarningsScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { data: earnings, isLoading, refetch } = useEarnings();
  const withdrawMutation = useWithdraw();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleWithdraw = () => {
    if (!earnings || earnings.available_balance < 100) {
      Alert.alert(
        'Minimum Withdrawal',
        'You need at least 100 ETB to withdraw.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!user?.bank_account_number) {
      Alert.alert(
        'Bank Account Required',
        'Please add your bank account details to withdraw earnings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Bank Account', onPress: () => navigation.navigate('Settings') },
        ]
      );
      return;
    }

    Alert.alert(
      'Withdraw Earnings',
      `Withdraw ${earnings.available_balance} ETB to your bank account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: async () => {
            try {
              await withdrawMutation.mutateAsync();
              Alert.alert('Success', 'Withdrawal request submitted successfully!');
              refetch();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to process withdrawal');
            }
          },
        },
      ]
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

  const totalEarnings = earnings?.total_earnings || 0;
  const availableBalance = earnings?.available_balance || 0;
  const pendingBalance = earnings?.pending_balance || 0;
  const totalWithdrawn = earnings?.total_withdrawn || 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Earnings</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Balance Cards */}
        <View style={styles.balanceSection}>
          {/* Available Balance */}
          <View style={[styles.balanceCard, styles.primaryCard]}>
            <View style={styles.balanceHeader}>
              <Ionicons name="wallet" size={32} color={COLORS.primary} />
              <Text style={styles.balanceLabel}>Available Balance</Text>
            </View>
            <Text style={styles.balanceAmount}>{availableBalance.toFixed(2)} ETB</Text>
            <TouchableOpacity
              style={styles.withdrawButton}
              onPress={handleWithdraw}
              disabled={availableBalance < 100 || withdrawMutation.isLoading}
            >
              {withdrawMutation.isLoading ? (
                <ActivityIndicator color={COLORS.background} size="small" />
              ) : (
                <>
                  <Ionicons name="cash-outline" size={18} color={COLORS.background} />
                  <Text style={styles.withdrawButtonText}>Withdraw</Text>
                </>
              )}
            </TouchableOpacity>
            {availableBalance < 100 && (
              <Text style={styles.minWithdrawText}>Minimum: 100 ETB</Text>
            )}
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={24} color={COLORS.green} />
              <Text style={styles.statValue}>{totalEarnings.toFixed(2)} ETB</Text>
              <Text style={styles.statLabel}>Total Earnings</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={24} color={COLORS.yellow} />
              <Text style={styles.statValue}>{pendingBalance.toFixed(2)} ETB</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.blue} />
              <Text style={styles.statValue}>{totalWithdrawn.toFixed(2)} ETB</Text>
              <Text style={styles.statLabel}>Withdrawn</Text>
            </View>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>How Earnings Work</Text>
          <View style={styles.infoCard}>
            <InfoItem
              icon="gift"
              title="Receive Gifts"
              description="When someone sends you a gift, you earn 70% of its value"
            />
            <InfoItem
              icon="time"
              title="Pending Period"
              description="Earnings are pending for 7 days before becoming available"
            />
            <InfoItem
              icon="cash"
              title="Withdraw"
              description="Withdraw your available balance to your bank account (min. 100 ETB)"
            />
            <InfoItem
              icon="shield-checkmark"
              title="Secure"
              description="All transactions are secure and processed within 1-3 business days"
            />
          </View>
        </View>

        {/* Bank Account Info */}
        {user?.bank_account_number ? (
          <View style={styles.bankSection}>
            <Text style={styles.sectionTitle}>Bank Account</Text>
            <View style={styles.bankCard}>
              <View style={styles.bankInfo}>
                <Ionicons name="business" size={24} color={COLORS.primary} />
                <View style={styles.bankDetails}>
                  <Text style={styles.bankName}>{user.bank_name}</Text>
                  <Text style={styles.bankAccount}>
                    {user.bank_account_number.replace(/(\d{4})/g, '$1 ')}
                  </Text>
                  <Text style={styles.accountHolder}>{user.account_holder_name}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                <Ionicons name="create-outline" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.noBankSection}>
            <Ionicons name="alert-circle" size={48} color={COLORS.yellow} />
            <Text style={styles.noBankTitle}>No Bank Account</Text>
            <Text style={styles.noBankText}>
              Add your bank account details to withdraw your earnings
            </Text>
            <TouchableOpacity
              style={styles.addBankButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="add-circle" size={20} color={COLORS.background} />
              <Text style={styles.addBankButtonText}>Add Bank Account</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Transaction History */}
        {earnings?.transactions && earnings.transactions.length > 0 && (
          <View style={styles.transactionsSection}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {earnings.transactions.slice(0, 10).map((transaction: any) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                  <Ionicons
                    name={transaction.type === 'withdrawal' ? 'arrow-up' : 'arrow-down'}
                    size={20}
                    color={transaction.type === 'withdrawal' ? COLORS.red : COLORS.green}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTitle}>
                    {transaction.type === 'withdrawal' ? 'Withdrawal' : 'Gift Received'}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    transaction.type === 'withdrawal' && styles.transactionAmountNegative,
                  ]}
                >
                  {transaction.type === 'withdrawal' ? '-' : '+'}
                  {transaction.amount.toFixed(2)} ETB
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoItem({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.infoItem}>
      <View style={styles.infoIconContainer}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoDescription}>{description}</Text>
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  balanceSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  balanceCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    ...SHADOWS.lg,
  },
  primaryCard: {
    backgroundColor: COLORS.background,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  balanceAmount: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  withdrawButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
  minWithdrawText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  infoSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  infoItem: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  bankSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  bankCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  bankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bankDetails: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  bankName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  bankAccount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  accountHolder: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  noBankSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  noBankTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  noBankText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  addBankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  addBankButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
  transactionsSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  transactionAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.green,
  },
  transactionAmountNegative: {
    color: COLORS.red,
  },
});
