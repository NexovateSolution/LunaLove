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
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMatchMessages, useSendMessage, useMarkMessagesAsRead } from '../../hooks/useChat';
import { useGiftTypes, useSendGift } from '../../hooks/useGifts';
import { useAuthStore } from '../../store/authStore';
import { useWalletStore } from '../../store/walletStore';
import SafeImage from '../../components/common/SafeImage';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/config';
import { ChatMessage, GiftType, Match } from '../../types';

export default function ChatScreenNew() {
  const route = useRoute();
  const navigation = useNavigation();
  const { match } = route.params as { match: Match };
  const { user } = useAuthStore();
  const { wallet } = useWalletStore();

  const otherUser = match.liker?.id === user?.id ? match.liked : match.liker;

  const { data: messages = [], isLoading } = useMatchMessages(match.id);
  const sendMessageMutation = useSendMessage(match.id);
  const markAsReadMutation = useMarkMessagesAsRead(match.id);

  const { data: giftTypes = [] } = useGiftTypes();
  const sendGiftMutation = useSendGift();

  const [messageText, setMessageText] = useState('');
  const [showGiftPicker, setShowGiftPicker] = useState(false);
  const flatListRef = useRef<FlatList>(null);

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
          { text: 'Buy Coins', onPress: () => navigation.navigate('Premium') },
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
        message: '',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to send gift');
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.sender.id === user?.id;

    return (
      <View style={[styles.messageContainer, isOwnMessage && styles.ownMessageContainer]}>
        {!isOwnMessage && (
          <SafeImage uri={otherUser.user_photos?.[0]?.photo} style={styles.messageAvatar} />
        )}
        
        <View style={[styles.messageBubble, isOwnMessage && styles.ownMessageBubble]}>
          {isOwnMessage ? (
            <LinearGradient
              colors={['#7209B7', '#F72585']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ownMessageGradient}
            >
              <Text style={styles.ownMessageText}>{item.content}</Text>
              {item.gift && (
                <View style={styles.giftContainer}>
                  <Text style={styles.giftEmoji}>{item.gift.emoji}</Text>
                  <Text style={styles.giftName}>{item.gift.name}</Text>
                  <Text style={styles.giftValue}>({item.gift.coin_cost} coins)</Text>
                </View>
              )}
              <Text style={styles.ownMessageTime}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </LinearGradient>
          ) : (
            <>
              <Text style={styles.otherMessageText}>{item.content}</Text>
              {item.gift && (
                <View style={styles.giftContainer}>
                  <Text style={styles.giftEmoji}>{item.gift.emoji}</Text>
                  <Text style={styles.giftNameOther}>{item.gift.name}</Text>
                  <Text style={styles.giftValueOther}>({item.gift.coin_cost} coins)</Text>
                </View>
              )}
              <Text style={styles.otherMessageTime}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </>
          )}
        </View>

        {isOwnMessage && (
          <SafeImage uri={user?.user_photos?.[0]?.photo} style={styles.messageAvatar} />
        )}
      </View>
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.background} />
        </TouchableOpacity>
        <SafeImage uri={otherUser?.user_photos?.[0]?.photo} style={styles.headerAvatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherUser?.first_name}</Text>
          <Text style={styles.headerStatus}>● Connecting...</Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={COLORS.background} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.giftButton}
            onPress={() => setShowGiftPicker(true)}
          >
            <Ionicons name="gift" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor={COLORS.textTertiary}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
          />

          <TouchableOpacity style={styles.emojiButton}>
            <Ionicons name="happy-outline" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
          >
            <LinearGradient
              colors={messageText.trim() ? ['#7209B7', '#F72585'] : [COLORS.gray300, COLORS.gray300]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendButtonGradient}
            >
              <Ionicons name="send" size={20} color={COLORS.background} />
            </LinearGradient>
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
        <View style={styles.modalOverlay}>
          <View style={styles.giftPickerContainer}>
            <View style={styles.giftPickerHeader}>
              <Text style={styles.giftPickerTitle}>Send a Gift</Text>
              <TouchableOpacity onPress={() => setShowGiftPicker(false)}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={giftTypes}
              numColumns={3}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.giftItem}
                  onPress={() => handleSendGift(item)}
                >
                  <Text style={styles.giftItemEmoji}>{item.emoji}</Text>
                  <Text style={styles.giftItemName}>{item.name}</Text>
                  <Text style={styles.giftItemCost}>{item.coin_cost} coins</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.giftGrid}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  headerStatus: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.background,
    opacity: 0.8,
  },
  headerButton: {
    padding: SPACING.xs,
  },
  messagesList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  ownMessageContainer: {
    flexDirection: 'row-reverse',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageBubble: {
    maxWidth: '70%',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ownMessageBubble: {
    backgroundColor: 'transparent',
    padding: 0,
    overflow: 'hidden',
  },
  ownMessageGradient: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  ownMessageText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    lineHeight: 20,
  },
  otherMessageText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 20,
  },
  ownMessageTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.background,
    opacity: 0.7,
    marginTop: SPACING.xs,
    alignSelf: 'flex-end',
  },
  otherMessageTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  giftContainer: {
    marginTop: SPACING.sm,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  giftEmoji: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  giftName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.background,
  },
  giftValue: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.background,
    opacity: 0.7,
  },
  giftNameOther: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  giftValueOther: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
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
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    maxHeight: 100,
  },
  emojiButton: {
    padding: SPACING.sm,
  },
  sendButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  giftPickerContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
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
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  giftGrid: {
    padding: SPACING.md,
  },
  giftItem: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    margin: SPACING.xs,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: BORDER_RADIUS.lg,
    minWidth: 100,
  },
  giftItemEmoji: {
    fontSize: 40,
    marginBottom: SPACING.xs,
  },
  giftItemName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  giftItemCost: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    marginTop: 2,
  },
});
