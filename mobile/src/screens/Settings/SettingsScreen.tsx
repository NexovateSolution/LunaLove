import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/config';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Implement account deletion
            Alert.alert('Coming Soon', 'Account deletion will be available soon.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingItem
            icon="person-outline"
            label="Edit Profile"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <SettingItemWithSwitch
            icon="notifications-outline"
            label="Push Notifications"
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
          <SettingItemWithSwitch
            icon="eye-off-outline"
            label="Show Online Status"
            value={showOnlineStatus}
            onValueChange={setShowOnlineStatus}
          />
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <SettingItem
            icon="star-outline"
            label="Manage Subscription"
            onPress={() => navigation.navigate('Purchase', { type: 'subscription' })}
            showBadge={user?.is_premium}
            badgeText="Premium"
          />
          <SettingItem
            icon="diamond-outline"
            label="Buy Coins"
            onPress={() => navigation.navigate('BuyCoins')}
          />
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <SettingItemWithSwitch
            icon="moon-outline"
            label="Dark Mode"
            value={isDarkMode}
            onValueChange={toggleTheme}
          />
        </View>

        {/* Discovery Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discovery</Text>
          <SettingItem
            icon="options-outline"
            label="Discovery Preferences"
            onPress={() => Alert.alert('Coming Soon', 'Discovery preferences will be available soon.')}
          />
          <SettingItem
            icon="location-outline"
            label="Location"
            value={user?.city}
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => Alert.alert('Support', 'Contact us at support@lunalove.app')}
          />
          <SettingItem
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => Alert.alert('Coming Soon', 'Terms of Service will be available soon.')}
          />
          <SettingItem
            icon="shield-outline"
            label="Privacy Policy"
            onPress={() => Alert.alert('Coming Soon', 'Privacy Policy will be available soon.')}
          />
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <SettingItem
            icon="log-out-outline"
            label="Log Out"
            onPress={handleLogout}
            danger
          />
          <SettingItem
            icon="trash-outline"
            label="Delete Account"
            onPress={handleDeleteAccount}
            danger
          />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>LunaLove v1.0.0</Text>
          <Text style={styles.appInfoText}>Made with ❤️</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingItem({
  icon,
  label,
  value,
  onPress,
  danger,
  showBadge,
  badgeText,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  showBadge?: boolean;
  badgeText?: string;
}) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <Ionicons
        name={icon}
        size={24}
        color={danger ? COLORS.error : COLORS.textSecondary}
      />
      <Text style={[styles.settingLabel, danger && styles.dangerText]}>
        {label}
      </Text>
      {showBadge && badgeText && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      )}
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {onPress && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={COLORS.textSecondary}
        />
      )}
    </TouchableOpacity>
  );
}

function SettingItemWithSwitch({
  icon,
  label,
  value,
  onValueChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.settingItem}>
      <Ionicons name={icon} size={24} color={COLORS.textSecondary} />
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
        thumbColor={COLORS.background}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  settingLabel: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  dangerText: {
    color: COLORS.error,
  },
  settingValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.background,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.xs,
  },
  appInfoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
