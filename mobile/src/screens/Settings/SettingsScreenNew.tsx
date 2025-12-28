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
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/config';

export default function SettingsScreenNew() {
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useTheme();

  const [privacySettings, setPrivacySettings] = useState({
    showAge: true,
    showDistance: true,
    showOnlineStatus: true,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    matches: true,
    messages: true,
    likes: true,
  });

  const [giftSoundsEnabled, setGiftSoundsEnabled] = useState(true);

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#7209B7', '#F72585']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Ionicons name="settings" size={36} color={COLORS.background} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Account & Premium Section */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Account & Premium</Text>
            </View>

            <TouchableOpacity
              style={styles.upgradeCard}
              onPress={() => navigation.navigate('Premium')}
            >
              <LinearGradient
                colors={['#7209B7', '#F72585']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.upgradeGradient}
              >
                <Ionicons name="flash" size={24} color={COLORS.background} />
                <Text style={styles.upgradeText}>Upgrade to Premium</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.background} />
              </LinearGradient>
            </TouchableOpacity>

            <SettingItem
              icon="checkmark-circle"
              iconColor={COLORS.info}
              label="Verify Profile"
              subtitle="Increase your credibility"
              onPress={() =>
                Alert.alert('Coming Soon', 'Profile verification will be available soon.')
              }
            />

            <SettingItem
              icon="refresh"
              iconColor={COLORS.primary}
              label="Re-run Profile Setup"
              subtitle="Update your profile information"
              onPress={() => navigation.navigate('EditProfile')}
            />
          </View>
        </View>

        {/* Earnings & Bank Account Section */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cash" size={20} color={COLORS.green} />
              <Text style={styles.sectionTitle}>Earnings & Bank Account</Text>
            </View>

            <View style={styles.earningsCard}>
              <View style={styles.earningsRow}>
                <View style={styles.earningsIconWrapper}>
                  <Ionicons name="gift" size={22} color={COLORS.green} />
                </View>
                <View style={styles.earningsTextWrapper}>
                  <Text style={styles.earningsTitle}>Earn from Gifts</Text>
                  <Text style={styles.earningsSubtitle}>
                    Receive 70% of gift values directly to your bank account!
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.earningsButton}
              onPress={() => navigation.navigate('Earnings' as never)}
            >
              <LinearGradient
                colors={[COLORS.green, '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.earningsButtonGradient}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <Ionicons name="wallet" size={20} color={COLORS.background} />
                  <Text style={styles.earningsButtonText}>View Earnings & Setup Bank</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.background} />
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.earningsNote}>
              Set up your bank account to start receiving earnings from gifts
            </Text>
          </View>
        </View>

        {/* Privacy & Security Section */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Privacy & Security</Text>
            </View>

            <SettingItemWithSwitch
              icon="eye"
              iconColor={COLORS.textSecondary}
              label="Show Age"
              subtitle="Display your age on profile"
              value={privacySettings.showAge}
              onValueChange={(value) =>
                setPrivacySettings((prev) => ({ ...prev, showAge: value }))
              }
            />

            <SettingItemWithSwitch
              icon="location"
              iconColor={COLORS.textSecondary}
              label="Show Distance"
              subtitle="Display distance to matches"
              value={privacySettings.showDistance}
              onValueChange={(value) =>
                setPrivacySettings((prev) => ({ ...prev, showDistance: value }))
              }
            />

            <SettingItemWithSwitch
              icon="ellipse"
              iconColor={COLORS.green}
              label="Show Online Status"
              subtitle="Let others see when you're online"
              value={privacySettings.showOnlineStatus}
              onValueChange={(value) =>
                setPrivacySettings((prev) => ({ ...prev, showOnlineStatus: value }))
              }
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Notifications</Text>
            </View>

            <SettingItemWithSwitch
              icon="heart"
              iconColor={COLORS.primary}
              label="New Matches"
              subtitle="Get notified about new matches"
              value={notificationSettings.matches}
              onValueChange={(value) =>
                setNotificationSettings((prev) => ({ ...prev, matches: value }))
              }
            />

            <SettingItemWithSwitch
              icon="chatbubble-ellipses"
              iconColor={COLORS.info}
              label="Messages"
              subtitle="Get notified about new messages"
              value={notificationSettings.messages}
              onValueChange={(value) =>
                setNotificationSettings((prev) => ({ ...prev, messages: value }))
              }
            />

            <SettingItemWithSwitch
              icon="heart-circle"
              iconColor={COLORS.pink}
              label="Likes"
              subtitle="Get notified when someone likes you"
              value={notificationSettings.likes}
              onValueChange={(value) =>
                setNotificationSettings((prev) => ({ ...prev, likes: value }))
              }
            />
          </View>
        </View>

        {/* App Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="options" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>App Preferences</Text>
            </View>

            <SettingItemWithSwitch
              icon="moon"
              iconColor={COLORS.purple}
              label="Dark Mode"
              subtitle="Switch to dark theme"
              value={isDarkMode}
              onValueChange={toggleTheme}
            />

            <SettingItemWithSwitch
              icon="musical-notes"
              iconColor={COLORS.primary}
              label="Gift Sounds"
              subtitle="Play sounds when receiving gifts"
              value={giftSoundsEnabled}
              onValueChange={setGiftSoundsEnabled}
            />
          </View>
        </View>

        {/* Support & Help Section */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="help-circle" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Support & Help</Text>
            </View>

            <SettingItem
              icon="help-buoy"
              iconColor={COLORS.info}
              label="Help Center"
              subtitle="Get answers to common questions"
              onPress={() => Alert.alert('Support', 'Contact us at support@lunalove.app')}
            />

            <SettingItem
              icon="mail"
              iconColor={COLORS.success}
              label="Contact Support"
              subtitle="Send us a message"
              onPress={() => Alert.alert('Support', 'Email us at support@lunalove.app')}
            />

            <SettingItem
              icon="information-circle"
              iconColor={COLORS.textSecondary}
              label="About ShebaLove"
              subtitle="App version & info"
              onPress={() =>
                Alert.alert('About', 'ShebaLove mobile app – earnings & gifts experience.')
              }
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle" size={20} color={COLORS.error} />
              <Text style={[styles.sectionTitle, styles.dangerSectionTitle]}>Danger Zone</Text>
            </View>

            <TouchableOpacity style={styles.dangerButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
              <Text style={styles.dangerButtonText}>Log Out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dangerButton, styles.deleteButton]}
              onPress={() =>
                Alert.alert('Coming Soon', 'Account deletion will be available soon.')
              }
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              <Text style={styles.dangerButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface SettingItemProps {
  icon: string;
  iconColor?: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
}

function SettingItem({ icon, iconColor = COLORS.textSecondary, label, subtitle, onPress }: SettingItemProps) {
  return (
    <TouchableOpacity
      style={[
        styles.settingItem,
        {
          backgroundColor:
            iconColor === COLORS.info
              ? COLORS.blue + '10'
              : iconColor === COLORS.warning
              ? COLORS.orange + '10'
              : iconColor === COLORS.error
              ? COLORS.red + '10'
              : COLORS.gray50,
        },
      ]}
      onPress={onPress}
    >
      <View style={[styles.settingIcon, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );
}

interface SettingItemWithSwitchProps {
  icon: string;
  iconColor?: string;
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

function SettingItemWithSwitch({ icon, iconColor = COLORS.textSecondary, label, subtitle, value, onValueChange }: SettingItemWithSwitchProps) {
  return (
    <View
      style={[
        styles.settingItem,
        {
          backgroundColor:
            iconColor === COLORS.warning
              ? COLORS.orange + '10'
              : iconColor === COLORS.purple
              ? COLORS.purpleLight + '10'
              : COLORS.gray50,
        },
      ]}
    >
      <View style={[styles.settingIcon, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
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
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  dangerSectionTitle: {
    color: COLORS.error,
  },
  upgradeCard: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  upgradeText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
    marginLeft: SPACING.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  settingLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  settingSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  earningsSection: {
    backgroundColor: COLORS.green + '10',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  earningsCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  earningsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  earningsSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  earningsButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  earningsButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  earningsButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
  earningsNote: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  deleteButton: {
    backgroundColor: COLORS.error + '10',
  },
  dangerButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.error,
  },
});
