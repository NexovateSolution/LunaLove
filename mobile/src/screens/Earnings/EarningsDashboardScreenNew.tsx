import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/config';
import ApiService from '../../services/api';

interface SubaccountStatus {
  has_subaccount: boolean;
  bank_name?: string;
  account_number?: string;
  total_earnings?: string;
  total_withdrawn?: string;
  available_balance?: string;
  is_verified?: boolean;
}

interface Bank {
  id: string | number;
  name: string;
}

const formatAmount = (value?: string | number) => {
  const num = typeof value === 'number' ? value : Number(value || 0);
  if (!Number.isFinite(num)) {
    return '0.00 ETB';
  }
  return `${num.toFixed(2)} ETB`;
};

const getBankName = (code: string, banks: Bank[]) => {
  const match = banks.find((bank) => String(bank.id) === String(code));
  return match ? match.name : 'Selected bank';
};

const humanizeSetupError = (raw?: string | null) => {
  if (!raw) return null;
  const msg = raw.trim();
  const lower = msg.toLowerCase();

  if (lower.includes('invalid account number')) {
    return 'This account number is invalid for the selected bank or mobile wallet type. Please double-check the digits and bank.';
  }

  if (lower.includes('already have a subaccount') || lower.includes('already has a subaccount')) {
    return 'You already have a connected earnings account. Use Change Account if you need to switch banks.';
  }

  if (lower.includes('bank_code') && lower.includes('required')) {
    return 'Please select a bank before creating your earnings account.';
  }

  if (lower.includes('account_number') && lower.includes('required')) {
    return 'Please enter your full bank account number.';
  }

  if (lower.includes('account_name') && lower.includes('required')) {
    return 'Please enter the account holder name exactly as it appears at your bank.';
  }

  return msg;
};

export default function EarningsDashboardScreenNew() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [subaccountStatus, setSubaccountStatus] = useState<SubaccountStatus | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [showSetup, setShowSetup] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [setupForm, setSetupForm] = useState({
    bank_code: '',
    account_number: '',
    account_name: '',
  });
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showChangeAccount, setShowChangeAccount] = useState(false);

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    setLoading(true);
    try {
      const [statusData, banksData] = await Promise.all([
        ApiService.getSubaccountStatus(),
        ApiService.getBanks(),
      ]);
      setSubaccountStatus(statusData);

      // Build the bank list from Chapa's /v1/banks response so it matches the
      // web earnings dashboard exactly. We filter by known slugs and keep a
      // fixed order.
      const root: any = banksData as any;
      const rawList: any[] = Array.isArray(root?.data)
        ? root.data
        : Array.isArray(root)
        ? root
        : [];

      const preferredSlugs = [
        'addis_int_bank',
        'ahadu_bank',
        'berhan_bank',
        'cbebirr',
        'coop_bank',
        'enat_bank',
        'global_bank',
        'kacha',
        'anbesa_bank',
        'mpesa',
        'telebirr',
        'wegagen_bank',
        'yaya',
      ];

      const bySlug: Record<string, any> = {};
      rawList.forEach((bank: any) => {
        if (bank && bank.slug && bank.id != null && bank.name) {
          bySlug[String(bank.slug)] = bank;
        }
      });

      const orderedBanks: Bank[] = [];
      preferredSlugs.forEach((slug) => {
        const bank = bySlug[slug];
        if (bank) {
          orderedBanks.push({ id: bank.id, name: bank.name });
        }
      });

      setBanks(orderedBanks);
    } catch (error) {
      Alert.alert('Error', 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const reloadStatus = async () => {
    try {
      const data = await ApiService.getSubaccountStatus();
      setSubaccountStatus(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh earnings data');
    }
  };

  const validateSetupForm = () => {
    if (!setupForm.bank_code) {
      Alert.alert('Bank required', 'Please select your bank');
      return false;
    }
    if (!setupForm.account_number || setupForm.account_number.length < 10) {
      Alert.alert('Account number', 'Please enter a valid account number');
      return false;
    }
    if (!setupForm.account_name.trim()) {
      Alert.alert('Account holder name', 'Please enter the account holder name');
      return false;
    }
    return true;
  };

  const handleCreateAccount = async () => {
    if (!validateSetupForm()) {
      return;
    }
    setSetupLoading(true);
    setSetupError(null);
    try {
      const payload = {
        bank_code: setupForm.bank_code,
        account_number: setupForm.account_number,
        account_name: setupForm.account_name,
      };
      const data = await ApiService.createSubaccount(payload);
      if (data?.success) {
        await reloadStatus();
        setShowSetup(false);
        setSetupForm({ bank_code: '', account_number: '', account_name: '' });
        setSetupError(data.message || 'Subaccount created successfully');
      } else {
        let errorMsg =
          data?.error || data?.message || data?.detail || 'Failed to create subaccount';
        if (data?.details && data.details.message) {
          errorMsg = data.details.message;
        }
        setSetupError(humanizeSetupError(errorMsg) || errorMsg);
      }
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Network error. Please try again.';
      setSetupError(humanizeSetupError(errorMsg) || errorMsg);
    } finally {
      setSetupLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteLoading) {
      return;
    }
    setDeleteLoading(true);
    try {
      const data = await ApiService.deleteSubaccount();
      if (data?.success) {
        await reloadStatus();
        setShowSetup(true);
        setShowChangeAccount(false);
      } else {
        const errorMsg =
          data?.error || data?.message || 'Failed to remove bank account';
        Alert.alert('Error', errorMsg);
      }
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Network error. Please try again.';
      Alert.alert('Error', errorMsg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const hasSubaccount = !!subaccountStatus?.has_subaccount;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.green} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#ECFDF5", "#D1FAE5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backRow}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={18} color={COLORS.textSecondary} />
              <Text style={styles.backText}>Back to Settings</Text>
            </TouchableOpacity>
            <View style={styles.headerMain}>
              <View style={styles.headerIcon}>
                <Ionicons name="cash" size={24} color={COLORS.background} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Earnings Dashboard</Text>
                <Text style={styles.headerSubtitle}>Manage your gift earnings</Text>
              </View>
            </View>
          </View>

          {!hasSubaccount ? (
            !showSetup ? (
              <View style={styles.card}>
                <View style={styles.introIconWrapper}>
                  <View style={styles.introIconCircle}>
                    <Ionicons name="gift" size={32} color={COLORS.background} />
                  </View>
                </View>
                <Text style={styles.introTitle}>Start Earning from Gifts!</Text>
                <Text style={styles.introSubtitle}>
                  Set up your bank account to receive 70% of gift values
                </Text>

                <View style={styles.howCard}>
                  <Text style={styles.howTitle}>How it works:</Text>
                  <View style={styles.howStepRow}>
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepBadgeText}>1</Text>
                    </View>
                    <View style={styles.stepTextColumn}>
                      <Text style={styles.stepTitle}>Someone sends you a gift</Text>
                      <Text style={styles.stepSubtitle}>Worth 100 ETB</Text>
                    </View>
                  </View>
                  <View style={styles.howStepRow}>
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepBadgeText}>2</Text>
                    </View>
                    <View style={styles.stepTextColumn}>
                      <Text style={styles.stepTitle}>You earn 70 ETB</Text>
                      <Text style={styles.stepSubtitle}>70% goes to your bank account</Text>
                    </View>
                  </View>
                  <View style={styles.howStepRow}>
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepBadgeText}>3</Text>
                    </View>
                    <View style={styles.stepTextColumn}>
                      <Text style={styles.stepTitle}>Automatic settlement</Text>
                      <Text style={styles.stepSubtitle}>Money sent to your bank</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setShowSetup(true)}
                >
                  <Text style={styles.primaryButtonText}>Set Up Bank Account</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.formTitle}>Connect Your Bank Account</Text>

                {setupError ? (
                  <View
                    style={[
                      styles.setupMessage,
                      setupError.toLowerCase().includes('success')
                        ? styles.setupMessageSuccess
                        : styles.setupMessageError,
                    ]}
                  >
                    <Text
                      style={
                        setupError.toLowerCase().includes('success')
                          ? styles.setupMessageSuccessText
                          : styles.setupMessageErrorText
                      }
                    >
                      {setupError}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Select Your Bank</Text>
                  <TouchableOpacity
                    style={styles.bankPickerButton}
                    onPress={() => setShowBankPicker(true)}
                    disabled={setupLoading}
                  >
                    <Text
                      style={
                        setupForm.bank_code
                          ? styles.bankPickerText
                          : styles.bankPickerPlaceholder
                      }
                    >
                      {setupForm.bank_code
                        ? getBankName(setupForm.bank_code, banks)
                        : 'Choose a bank...'}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Account Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1000123456789"
                    value={setupForm.account_number}
                    onChangeText={(value) =>
                      setSetupForm((prev) => ({
                        ...prev,
                        account_number: value.replace(/\D/g, ''),
                      }))
                    }
                    keyboardType="number-pad"
                    editable={!setupLoading}
                  />
                  <Text style={styles.fieldHint}>
                    Enter your full bank account number (usually 13-16 digits for Ethiopian
                    banks)
                  </Text>
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Account Holder Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    value={setupForm.account_name}
                    onChangeText={(text) =>
                      setSetupForm((prev) => ({
                        ...prev,
                        account_name: text,
                      }))
                    }
                    editable={!setupLoading}
                  />
                  <Text style={styles.fieldWarning}>
                    Make sure this matches your bank account exactly
                  </Text>
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => {
                      setShowSetup(false);
                      setSetupError(null);
                    }}
                    disabled={setupLoading}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryButtonSmall}
                    onPress={handleCreateAccount}
                    disabled={setupLoading}
                  >
                    {setupLoading ? (
                      <ActivityIndicator color={COLORS.background} />
                    ) : (
                      <Text style={styles.primaryButtonText}>Create Account</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )
          ) : (
            <View style={styles.dashboardSection}>
              <View style={styles.overviewRow}>
                <View style={styles.overviewCard}>
                  <View style={styles.overviewLabelRow}>
                    <Ionicons name="trending-up" size={20} color={COLORS.green} />
                    <Text style={styles.overviewLabel}>Total Earned</Text>
                  </View>
                  <Text style={styles.overviewAmount}>
                    {formatAmount(subaccountStatus?.total_earnings)}
                  </Text>
                </View>
                <View style={styles.overviewCard}>
                  <View style={styles.overviewLabelRow}>
                    <Ionicons name="cash" size={20} color={COLORS.blue} />
                    <Text style={styles.overviewLabel}>Available</Text>
                  </View>
                  <Text style={[styles.overviewAmount, styles.overviewAmountAvailable]}>
                    {formatAmount(subaccountStatus?.available_balance)}
                  </Text>
                </View>
                <View style={styles.overviewCard}>
                  <View style={styles.overviewLabelRow}>
                    <Ionicons name="checkmark-done" size={20} color={COLORS.purple} />
                    <Text style={styles.overviewLabel}>Withdrawn</Text>
                  </View>
                  <Text style={styles.overviewAmount}>
                    {formatAmount(subaccountStatus?.total_withdrawn)}
                  </Text>
                </View>
              </View>

              <View style={styles.bankCard}>
                <View style={styles.bankHeaderRow}>
                  <Text style={styles.bankTitle}>Connected Bank Account</Text>
                  <TouchableOpacity
                    onPress={() => setShowChangeAccount(true)}
                    disabled={deleteLoading}
                  >
                    <Text style={styles.bankChangeText}>
                      {deleteLoading ? 'Changing...' : 'Change Account'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.bankInnerCard}>
                  <View>
                    <Text style={styles.bankNameText}>
                      {subaccountStatus?.bank_name}
                    </Text>
                    <Text style={styles.bankAccountText}>
                      Account: {subaccountStatus?.account_number}
                    </Text>
                    {subaccountStatus?.is_verified ? (
                      <View style={styles.verifiedPill}>
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color={COLORS.green}
                        />
                        <Text style={styles.verifiedPillText}>Verified</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <View style={styles.bankNotice}>
                  <Text style={styles.bankNoticeText}>
                    For security reasons, bank account changes require verification. Contact
                    support to update your account details.
                  </Text>
                </View>
              </View>

              <View style={styles.howEarningsCard}>
                <View style={styles.howEarningsHeader}>
                  <Ionicons name="gift" size={20} color={COLORS.green} />
                  <Text style={styles.howEarningsTitle}>How Your Earnings Work</Text>
                </View>
                <Text style={styles.howEarningsText}>
                  You receive 70% of every gift's value
                </Text>
                <Text style={styles.howEarningsText}>
                  Earnings are automatically sent to your bank account
                </Text>
                <Text style={styles.howEarningsText}>
                  Settlement happens based on Chapa's schedule
                </Text>
                <Text style={styles.howEarningsText}>
                  Track all your earnings here in real-time
                </Text>
              </View>

              <View style={styles.recentCard}>
                <Text style={styles.recentTitle}>Recent Earnings</Text>
                <View style={styles.recentEmpty}>
                  <Ionicons
                    name="gift-outline"
                    size={40}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.recentEmptyText}>No earnings yet</Text>
                  <Text style={styles.recentEmptySubtext}>
                    Start receiving gifts to see your earnings here!
                  </Text>
                </View>
              </View>
            </View>
          )}

          {showChangeAccount && (
            <View style={styles.changeOverlay}>
              <View style={styles.changeCard}>
                <Text style={styles.changeTitle}>Change Bank Account?</Text>

                <View style={styles.changeMessageGroup}>
                  <View style={styles.changeWarningBox}>
                    <Text style={styles.changeWarningText}>
                      Warning: This will remove your current bank account.
                    </Text>
                  </View>

                  {Number(subaccountStatus?.available_balance || 0) > 0 ? (
                    <View style={[styles.changeInfoBox, styles.changeInfoBoxError]}>
                      <Text style={styles.changeInfoText}>
                        You have {formatAmount(subaccountStatus?.available_balance)} in
                        pending earnings. You cannot change accounts until your
                        earnings are settled.
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.changeInfoBox, styles.changeInfoBoxInfo]}>
                      <Text style={styles.changeInfoText}>
                        After removing your current account, you'll be able to add a
                        new one immediately.
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.changeButtonsRow}>
                  <TouchableOpacity
                    style={styles.changeCancelButton}
                    onPress={() => setShowChangeAccount(false)}
                    disabled={deleteLoading}
                  >
                    <Text style={styles.changeCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.changeRemoveButton,
                      (Number(subaccountStatus?.available_balance || 0) > 0 ||
                        deleteLoading) &&
                        styles.changeRemoveButtonDisabled,
                    ]}
                    onPress={handleDeleteAccount}
                    disabled={
                      deleteLoading || Number(subaccountStatus?.available_balance || 0) > 0
                    }
                  >
                    <Text style={styles.changeRemoveText}>
                      {deleteLoading ? 'Removing...' : 'Remove Account'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          <Modal
            visible={showBankPicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowBankPicker(false)}
          >
            <View style={styles.bankPickerOverlay}>
              <View style={styles.bankPickerSheet}>
                <View style={styles.bankPickerHeader}>
                  <Text style={styles.bankPickerTitle}>
                    Select Your Bank{banks.length ? ` (${banks.length})` : ''}
                  </Text>
                  <TouchableOpacity onPress={() => setShowBankPicker(false)}>
                    <Ionicons
                      name="close"
                      size={22}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  style={styles.bankPickerList}
                  contentContainerStyle={styles.bankPickerContent}
                  showsVerticalScrollIndicator
                >
                  {banks.map((bank) => (
                    <TouchableOpacity
                      key={String(bank.id)}
                      style={styles.bankPickerItem}
                      onPress={() => {
                        setSetupForm((prev) => ({
                          ...prev,
                          bank_code: String(bank.id),
                        }));
                        setShowBankPicker(false);
                      }}
                    >
                      <Text style={styles.bankPickerItemText}>{bank.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ECFDF5',
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  backText: {
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  card: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.lg,
  },
  introIconWrapper: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  introIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  introTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  introSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  howCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    backgroundColor: '#DCFCE7',
    marginBottom: SPACING.lg,
  },
  howTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  howStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  stepBadgeText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
  },
  stepTextColumn: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  stepSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  primaryButton: {
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.green,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
  formTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  setupMessage: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  setupMessageSuccess: {
    backgroundColor: '#ECFDF3',
  },
  setupMessageError: {
    backgroundColor: '#FEF2F2',
  },
  setupMessageSuccessText: {
    color: COLORS.green,
    fontSize: FONT_SIZES.sm,
  },
  setupMessageErrorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
  },
  field: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  bankPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  bankPickerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  bankPickerPlaceholder: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  input: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  fieldHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  fieldWarning: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.warning,
    marginTop: SPACING.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  secondaryButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  primaryButtonSmall: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.green,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  dashboardSection: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  overviewRow: {
    marginBottom: SPACING.lg,
  },
  overviewCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.md,
    marginBottom: SPACING.md,
  },
  overviewLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  overviewLabel: {
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  overviewAmount: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  overviewAmountAvailable: {
    color: COLORS.green,
  },
  bankCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.md,
    marginBottom: SPACING.lg,
  },
  bankHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  bankTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  bankChangeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.blue,
  },
  bankInnerCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.gray50,
  },
  bankNameText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  bankAccountText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#DCFCE7',
    marginTop: SPACING.sm,
  },
  verifiedPillText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.green,
    marginLeft: 4,
  },
  bankNotice: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#EFF6FF',
  },
  bankNoticeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.info,
  },
  howEarningsCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: SPACING.lg,
  },
  howEarningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  howEarningsTitle: {
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  howEarningsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  recentCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.md,
    marginBottom: SPACING.lg,
  },
  recentTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  recentEmpty: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  recentEmptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  recentEmptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  changeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  changeCard: {
    width: '100%',
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    ...SHADOWS.lg,
  },
  changeTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  changeMessageGroup: {
    marginBottom: SPACING.lg,
  },
  changeWarningBox: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#FFFBEB',
    marginBottom: SPACING.sm,
  },
  changeWarningText: {
    fontSize: FONT_SIZES.sm,
    color: '#92400E',
  },
  changeInfoBox: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  changeInfoBoxError: {
    backgroundColor: '#FEF2F2',
  },
  changeInfoBoxInfo: {
    backgroundColor: '#EFF6FF',
  },
  changeInfoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  changeButtonsRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
  changeCancelButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  changeCancelText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  changeRemoveButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  changeRemoveButtonDisabled: {
    opacity: 0.5,
  },
  changeRemoveText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
  bankPickerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  bankPickerSheet: {
    maxHeight: '80%',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  bankPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  bankPickerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  bankPickerList: {
    flexGrow: 1,
  },
  bankPickerContent: {
    paddingBottom: SPACING.xl,
  },
  bankPickerItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  bankPickerItemText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
});
