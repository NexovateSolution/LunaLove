import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMyMatches } from '../../hooks/useMatches';
import { useAuthStore } from '../../store/authStore';
import OnlineStatusDot from '../../components/chat/OnlineStatusDot';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/config';
import { Match } from '../../types';

export default function ChatListScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { data: matches, isLoading } = useMyMatches();
  const [searchQuery, setSearchQuery] = useState('');

  const getOtherUser = (match: Match) => {
    return match.liker.id === user?.id ? match.liked : match.liker;
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - messageTime.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return messageTime.toLocaleDateString();
  };

  const filteredMatches = matches?.filter((match) => {
    const otherUser = getOtherUser(match);
    return otherUser.first_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderChatItem = ({ item }: { item: Match }) => {
    const otherUser = getOtherUser(item);
    const unreadCount = item.unread_count || 0;
    const isOnline = otherUser.is_online || false;
    const isTyping = false; // TODO: Implement WebSocket typing indicator

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate('Chat', { match: item })}
        activeOpacity={0.7}
      >
        {/* Profile Photo with Online Status */}
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: otherUser.user_photos?.[0]?.photo }}
            style={styles.avatar}
          />
          <View style={styles.onlineStatusContainer}>
            <OnlineStatusDot isOnline={isOnline} size={14} />
          </View>
        </View>

        {/* Chat Info */}
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.userName} numberOfLines={1}>
              {otherUser.first_name}
            </Text>
            {item.last_message && (
              <Text style={styles.timestamp}>
                {getRelativeTime(item.last_message.created_at)}
              </Text>
            )}
          </View>

          {/* Last Message or Typing Indicator */}
          {isTyping ? (
            <Text style={styles.typingText}>Typing...</Text>
          ) : item.last_message ? (
            <View style={styles.messagePreviewContainer}>
              {item.last_message.sender === user?.id && (
                <Ionicons
                  name={item.last_message.is_read ? 'checkmark-done' : 'checkmark'}
                  size={14}
                  color={item.last_message.is_read ? COLORS.blue : COLORS.gray400}
                  style={styles.readReceiptIcon}
                />
              )}
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.last_message.content}
              </Text>
            </View>
          ) : (
            <Text style={styles.noMessages}>Start a conversation</Text>
          )}
        </View>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={80} color={COLORS.gray300} />
      <Text style={styles.emptyTitle}>No Conversations Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start chatting with your matches!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={COLORS.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredMatches}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          !filteredMatches || filteredMatches.length === 0
            ? styles.emptyListContent
            : styles.listContent
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
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
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    padding: 0,
  },
  listContent: {
    paddingBottom: SPACING.lg,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.backgroundDark,
  },
  onlineStatusContainer: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  chatInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  timestamp: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  messagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readReceiptIcon: {
    marginRight: 2,
  },
  lastMessage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  typingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  noMessages: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray400,
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: SPACING.sm,
  },
  unreadText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
