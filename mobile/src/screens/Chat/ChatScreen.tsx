import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useMatchMessages, useSendMessage, useMarkMessagesAsRead, useSendTypingIndicator } from '../../hooks/useChat';
import { useGiftTypes, useSendGift } from '../../hooks/useGifts';
import { useAuthStore } from '../../store/authStore';
import { useWalletStore } from '../../store/walletStore';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/config';
import { ChatMessage, GiftType, Match } from '../../types';
import GiftAnimation from '../../components/chat/GiftAnimation';
import MessageBubble from '../../components/chat/MessageBubble';
import TypingIndicator from '../../components/chat/TypingIndicator';

export default function ChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { match } = route.params as { match: Match };
  const { user } = useAuthStore();
  const { wallet } = useWalletStore();

  const otherUser = match.liker.id === user?.id ? match.liked : match.liker;

  const { data: messages, isLoading } = useMatchMessages(match.id);
  const sendMessageMutation = useSendMessage(match.id);
  const markAsReadMutation = useMarkMessagesAsRead(match.id);
  const sendTypingIndicator = useSendTypingIndicator(match.id);

  const { data: giftTypes } = useGiftTypes();
  const sendGiftMutation = useSendGift();

  const [messageText, setMessageText] = useState('');
  const [showGiftPicker, setShowGiftPicker] = useState(false);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <Image source={{ uri: otherUser.user_photos[0]?.photo }} style={styles.headerAvatar} />
          <Text style={styles.headerName}>{otherUser.first_name}</Text>
        </View>
      ),
    });
  }, []);

  useEffect(() => {
    if (messages && messages.length > 0) {
      markAsReadMutation.mutate();
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    const text = messageText.trim();
    setMessageText('');

    try {
      await sendMessageMutation.mutateAsync(text);
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
      setMessageText(text);
    }
  };

  const handleSendGift = async (gift: GiftType) => {
    if (!wallet || wallet.balance < gift.coin_cost) {
      Alert.alert(
        'Insufficient Coins',
        `You need ${gift.coin_cost} coins to send this gift.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy Coins', onPress: () => navigation.navigate('BuyCoins') },
        ]
      );
      return;
    }

    setShowGiftPicker(false);

    try {
      await sendGiftMutation.mutateAsync({
        receiverId: otherUser.id,
        giftTypeId: gift.id,
        quantity: 1,
      });

      // Show gift animation
      setActiveGiftAnimation({
        name: gift.name,
        animation_url: gift.animation_url,
        icon: gift.icon,
      });

      setTimeout(() => {
        setActiveGiftAnimation(null);
      }, 3000);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send gift');
    }
  };

  const handleTyping = () => {
    sendTypingIndicator();
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMine = item.sender_id === user?.id;

    if (item.message_type === 'gift' && item.gift_data) {
      return (
        <View style={[styles.messageContainer, isMine ? styles.myMessageContainer : styles.theirMessageContainer]}>
          <View style={[styles.giftMessage, isMine ? styles.myGiftMessage : styles.theirGiftMessage]}>
            <Text style={styles.giftIcon}>{item.gift_data.gift_icon}</Text>
            <Text style={[styles.giftText, isMine && styles.myMessageText]}>
              {isMine ? 'You' : otherUser.first_name} sent {item.gift_data.gift_name}
            </Text>
          </View>
          <Text style={[styles.timestamp, isMine && styles.myTimestamp]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.messageContainer, isMine ? styles.myMessageContainer : styles.theirMessageContainer]}>
        <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.theirMessage]}>
          <Text style={[styles.messageText, isMine && styles.myMessageText]}>
            {item.content}
          </Text>
        </View>
        <Text style={[styles.timestamp, isMine && styles.myTimestamp]}>
          {formatTime(item.created_at)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages || []}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {/* Gift Animation Overlay */}
        {activeGiftAnimation && (
          <GiftAnimation
            giftName={activeGiftAnimation.name}
            animationUrl={activeGiftAnimation.animation_url}
            icon={activeGiftAnimation.icon}
          />
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.giftButton}
            onPress={() => setShowGiftPicker(true)}
          >
            <Ionicons name="gift" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textSecondary}
            value={messageText}
            onChangeText={(text) => {
              setMessageText(text);
              handleTyping();
            }}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
          >
            <Ionicons name="send" size={20} color={COLORS.background} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Gift Picker Modal */}
      <Modal
        visible={showGiftPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGiftPicker(false)}
      >
        <View style={styles.giftPickerOverlay}>
          <View style={styles.giftPickerContainer}>
            <View style={styles.giftPickerHeader}>
              <Text style={styles.giftPickerTitle}>Send a Gift</Text>
              <TouchableOpacity onPress={() => setShowGiftPicker(false)}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.walletInfo}>
              <Ionicons name="wallet" size={20} color={COLORS.primary} />
              <Text style={styles.walletText}>
                {wallet?.balance || 0} coins
              </Text>
              <TouchableOpacity onPress={() => {
                setShowGiftPicker(false);
                navigation.navigate('BuyCoins');
              }}>
                <Ionicons name="add-circle" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={giftTypes || []}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.giftItem}
                  onPress={() => handleSendGift(item)}
                >
                  <Text style={styles.giftItemIcon}>{item.icon}</Text>
                  <View style={styles.giftItemInfo}>
                    <Text style={styles.giftItemName}>{item.name}</Text>
                    <Text style={styles.giftItemDescription}>{item.description}</Text>
                  </View>
                  <View style={styles.giftItemCost}>
                    <Ionicons name="diamond" size={16} color={COLORS.primary} />
                    <Text style={styles.giftItemCostText}>{item.coin_cost}</Text>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.giftRow}
              contentContainerStyle={styles.giftList}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  keyboardView: {
    flex: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  messagesList: {
    padding: SPACING.md,
  },
  messageContainer: {
    marginBottom: SPACING.md,
    maxWidth: '75%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 18,
  },
  myMessage: {
    backgroundColor: COLORS.primary,
  },
  theirMessage: {
    backgroundColor: COLORS.background,
  },
  messageText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  myMessageText: {
    color: COLORS.background,
  },
  giftMessage: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  myGiftMessage: {
    backgroundColor: COLORS.primary,
  },
  theirGiftMessage: {
    backgroundColor: COLORS.background,
  },
  giftIcon: {
    fontSize: 24,
  },
  giftText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  timestamp: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginLeft: SPACING.sm,
  },
  myTimestamp: {
    textAlign: 'right',
    marginRight: SPACING.sm,
    marginLeft: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  giftButton: {
    padding: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  giftPickerOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  giftPickerContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  giftPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  giftPickerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundDark,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  walletText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  giftList: {
    padding: SPACING.md,
  },
  giftRow: {
    gap: SPACING.md,
  },
  giftItem: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  giftItemIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  giftItemInfo: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  giftItemName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  giftItemDescription: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  giftItemCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  giftItemCostText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
