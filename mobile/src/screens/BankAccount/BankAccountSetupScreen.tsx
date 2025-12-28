import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/config';
import ApiService from '../../services/api';

interface BankAccount {
  account_holder_name: string;
  bank_name: string;
  account_number: string;
  branch: string;
  is_verified: boolean;
}

export default function BankAccountSetupScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);

  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const ETHIOPIAN_BANKS = [
    'Commercial Bank of Ethiopia',
    'Awash Bank',
    'Dashen Bank',
    'Bank of Abyssinia',
    'Wegagen Bank',
    'United Bank',
    'Nib International Bank',
    'Cooperative Bank of Oromia',
    'Lion International Bank',
    'Oromia International Bank',
    'Zemen Bank',
    'Bunna International Bank',
    'Berhan International Bank',
    'Abay Bank',
    'Addis International Bank',
    'Debub Global Bank',
    'Enat Bank',
    'Hijra Bank',
    'Shabelle Bank',
    'Siinqee Bank',
  ];

  useEffect(() => {
    loadBankAccount();
  }, []);

  const loadBankAccount = async () => {
    setLoading(true);
    try {
      const account = await ApiService.getBankAccount();
      if (account) {
        setHasAccount(true);
        setAccountHolderName(account.account_holder_name);
        setBankName(account.bank_name);
        setAccountNumber(account.account_number);
        setBranch(account.branch);
        setIsVerified(account.is_verified);
      }
    } catch (error) {
      // No account exists yet
      setHasAccount(false);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!accountHolderName.trim()) {
      Alert.alert('Required', 'Please enter account holder name');
      return false;
    }
    if (!bankName) {
      Alert.alert('Required', 'Please select a bank');
      return false;
    }
    if (!accountNumber.trim()) {
      Alert.alert('Required', 'Please enter account number');
      return false;
    }
    if (!branch.trim()) {
      Alert.alert('Required', 'Please enter branch name');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const data = {
        account_holder_name: accountHolderName,
        bank_name: bankName,
        account_number: accountNumber,
        branch: branch,
      };

      await ApiService.updateBankAccount(data);
      Alert.alert(
        'Success',
        'Bank account saved successfully. It will be verified within 24 hours.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save bank account');
    } finally {
      setSaving(false);
    }
  };

  const showBankPicker = () => {
    Alert.alert(
      'Select Bank',
      '',
      ETHIOPIAN_BANKS.map((bank) => ({
        text: bank,
        onPress: () => setBankName(bank),
      })).concat([{ text: 'Cancel', style: 'cancel' }])
    );
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
        <Text style={styles.headerTitle}>Bank Account</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={32} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Withdrawal Information</Text>
            <Text style={styles.infoText}>
              Add your bank account to receive withdrawals. Your account will be verified within 24 hours.
            </Text>
          </View>
        </View>

        {/* Verification Status */}
        {hasAccount && (
          <View style={[styles.statusCard, isVerified ? styles.verifiedCard : styles.pendingCard]}>
            <Ionicons
              name={isVerified ? 'checkmark-circle' : 'time'}
              size={24}
              color={isVerified ? COLORS.success : COLORS.warning}
            />
            <Text style={styles.statusText}>
              {isVerified ? 'Account Verified' : 'Verification Pending'}
            </Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Account Holder Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Full name as per bank account"
            value={accountHolderName}
            onChangeText={setAccountHolderName}
            editable={!isVerified}
          />

          <Text style={styles.label}>Bank Name</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={showBankPicker}
            disabled={isVerified}
          >
            <Text style={[styles.pickerText, !bankName && styles.placeholderText]}>
              {bankName || 'Select your bank'}
            </Text>
            <Ionicons name="chevron-down" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.label}>Account Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter account number"
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="number-pad"
            editable={!isVerified}
          />

          <Text style={styles.label}>Branch</Text>
          <TextInput
            style={styles.input}
            placeholder="Branch name or location"
            value={branch}
            onChangeText={setBranch}
            editable={!isVerified}
          />

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
            <Text style={styles.securityText}>
              Your bank details are encrypted and secure
            </Text>
          </View>

          {/* Save Button */}
          {!isVerified && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {hasAccount ? 'Update Account' : 'Save Account'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Help Text */}
          <Text style={styles.helpText}>
            Make sure your account details are correct. Incorrect details may delay your withdrawals.
          </Text>
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
  content: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundDark,
    margin: SPACING.lg,
    padding: SPACING.md,
    borderRadius: 12,
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
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    borderRadius: 12,
  },
  verifiedCard: {
    backgroundColor: COLORS.success + '20',
  },
  pendingCard: {
    backgroundColor: COLORS.warning + '20',
  },
  statusText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  form: {
    padding: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  pickerText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  placeholderText: {
    color: COLORS.textSecondary,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.success + '10',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
  },
  securityText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
  helpText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
