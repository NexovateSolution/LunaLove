import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGiftTypes, useSendGift } from '../../hooks/useGifts';
import { useWalletStore } from '../../store/walletStore';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/config';
import { GiftType } from '../../types';

interface GiftStoreModalProps {
  visible: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
  onGiftSent?: () => void;
}

export default function GiftStoreModal({
  visible,
  onClose,
  receiverId,
  receiverName,
  onGiftSent,
}: GiftStoreModalProps) {
  const { data: gifts, isLoading } = useGiftTypes();
  const sendGiftMutation = useSendGift();
  const { wallet } = useWalletStore();
  const [selectedGift, setSelectedGift] = useState<GiftType | null>(null);
  const [message, setMessage] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleSendGift = async () => {
    if (!selectedGift) return;

    const totalCost = selectedGift.coin_cost * quantity;

    if (!wallet || wallet.balance < totalCost) {
      Alert.alert(
        'Insufficient Coins',
        `You need ${totalCost} coins to send this gift.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy Coins', onPress: () => {
            onClose();
            // Navigate to buy coins
          }},
        ]
      );
      return;
    }

    try {
      await sendGiftMutation.mutateAsync({
        receiverId,
        giftTypeId: selectedGift.id,
        quantity,
        message: message.trim() || undefined,
      });

      Alert.alert('Success', `Gift sent to ${receiverName}!`);
      setSelectedGift(null);
      setMessage('');
      setQuantity(1);
      onClose();
      onGiftSent?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to send gift. Please try again.');
    }
  };

  const renderGiftItem = ({ item }: { item: GiftType }) => {
    const isSelected = selectedGift?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.giftCard, isSelected && styles.giftCardSelected]}
        onPress={() => setSelectedGift(item)}
      >
        <Text style={styles.giftIcon}>{item.icon}</Text>
        <Text style={styles.giftName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.giftCostContainer}>
          <Ionicons name="diamond" size={14} color={COLORS.primary} />
          <Text style={styles.giftCost}>{item.coin_cost}</Text>
        </View>
        {item.etb_value && (
          <Text style={styles.giftValue}>
            {item.etb_value} ETB
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderGiftPreview = () => {
    if (!selectedGift) return null;

    const totalCost = selectedGift.coin_cost * quantity;

    return (
      <View style={styles.previewContainer}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>Send Gift</Text>
          <TouchableOpacity onPress={() => setSelectedGift(null)}>
            <Ionicons name="close" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.previewContent}>
          <Text style={styles.previewIcon}>{selectedGift.icon}</Text>
          <Text style={styles.previewName}>{selectedGift.name}</Text>

          {/* Quantity Selector */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.min(99, quantity + 1))}
              >
                <Ionicons name="add" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Optional Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Add a message (optional)</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Say something nice..."
              placeholderTextColor={COLORS.gray400}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={200}
            />
            <Text style={styles.characterCount}>{message.length}/200</Text>
          </View>

          {/* Total Cost */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Cost</Text>
            <View style={styles.totalCost}>
              <Ionicons name="diamond" size={20} color={COLORS.primary} />
              <Text style={styles.totalValue}>{totalCost}</Text>
            </View>
          </View>

          {/* Balance */}
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Your Balance</Text>
            <View style={styles.balanceCost}>
              <Ionicons name="diamond" size={16} color={COLORS.textSecondary} />
              <Text style={styles.balanceValue}>{wallet?.balance || 0}</Text>
            </View>
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!wallet || wallet.balance < totalCost) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendGift}
            disabled={!wallet || wallet.balance < totalCost || sendGiftMutation.isLoading}
          >
            {sendGiftMutation.isLoading ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <>
                <Ionicons name="gift" size={20} color={COLORS.background} />
                <Text style={styles.sendButtonText}>
                  Send to {receiverName}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Gift Store</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading gifts...</Text>
            </View>
          ) : selectedGift ? (
            renderGiftPreview()
          ) : (
            <>
              <Text style={styles.subtitle}>
                Choose a gift to send to {receiverName}
              </Text>
              <FlatList
                data={gifts}
                renderItem={renderGiftItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.giftGrid}
                showsVerticalScrollIndicator={false}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '90%',
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  giftGrid: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  giftCard: {
    flex: 1,
    margin: SPACING.xs,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.sm,
  },
  giftCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  giftIcon: {
    fontSize: 40,
    marginBottom: SPACING.xs,
  },
  giftName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  giftCostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  giftCost: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  giftValue: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  previewContainer: {
    flex: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  previewTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  previewContent: {
    paddingHorizontal: SPACING.lg,
  },
  previewIcon: {
    fontSize: 80,
    textAlign: 'center',
    marginVertical: SPACING.lg,
  },
  previewName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  quantityContainer: {
    marginBottom: SPACING.lg,
  },
  quantityLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    minWidth: 40,
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: SPACING.lg,
  },
  messageLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  messageInput: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  totalLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totalValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  balanceCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balanceValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray300,
  },
  sendButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
});
