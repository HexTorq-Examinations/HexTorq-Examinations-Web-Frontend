import { create } from 'zustand';
import { api } from '@/lib/api';

export interface MessageUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STUDENT';
  avatar?: string;
}

export interface ConversationSummary {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name: string;
  participants: MessageUser[];
  lastMessage: { text: string; createdAt: string; senderName: string; isMine: boolean } | null;
  unreadCount: number;
  joinedAt: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  createdAt: string;
  senderId: string;
  senderName?: string;
  isMine: boolean;
}

interface MessagingState {
  isPanelOpen: boolean;
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  messages: ChatMessage[];
  unreadTotal: number;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  searchResults: MessageUser[];

  openPanel: () => void;
  closePanel: () => void;
  fetchConversations: () => Promise<void>;
  openConversation: (id: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  startDirectConversation: (recipientUserId: string) => Promise<string>;
  startGroupConversation: (name: string, memberUserIds: string[]) => Promise<string>;
  searchUsers: (q: string) => Promise<void>;
  fetchUnreadTotal: () => Promise<void>;
}

export const useMessagingStore = create<MessagingState>()((set, get) => ({
  isPanelOpen: false,
  conversations: [],
  activeConversationId: null,
  messages: [],
  unreadTotal: 0,
  isLoadingConversations: false,
  isLoadingMessages: false,
  searchResults: [],

  openPanel: () => {
    set({ isPanelOpen: true });
    get().fetchConversations();
  },
  closePanel: () => set({ isPanelOpen: false, activeConversationId: null, messages: [] }),

  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    const { data } = await api.get('/messages/conversations');
    set({ conversations: data, isLoadingConversations: false });
  },

  openConversation: async (id: string) => {
    set({ activeConversationId: id, isLoadingMessages: true, messages: [] });
    const { data } = await api.get(`/messages/conversations/${id}/messages`);
    set((state) => ({
      messages: data,
      isLoadingMessages: false,
      conversations: state.conversations.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
    }));
    get().fetchUnreadTotal();
  },

  sendMessage: async (text: string) => {
    const { activeConversationId } = get();
    if (!activeConversationId || !text.trim()) return;
    const { data } = await api.post(`/messages/conversations/${activeConversationId}/messages`, { text });
    set((state) => ({ messages: [...state.messages, data] }));
    get().fetchConversations();
  },

  startDirectConversation: async (recipientUserId: string) => {
    const { data } = await api.post('/messages/conversations', { recipientUserId });
    await get().fetchConversations();
    return data.id;
  },

  startGroupConversation: async (name: string, memberUserIds: string[]) => {
    const { data } = await api.post('/messages/conversations', { type: 'GROUP', name, memberUserIds });
    await get().fetchConversations();
    return data.id;
  },

  searchUsers: async (q: string) => {
    const { data } = await api.get('/messages/searchable-users', { params: { q } });
    set({ searchResults: data });
  },

  fetchUnreadTotal: async () => {
    const { data } = await api.get('/messages/unread-count', { silent: true });
    set({ unreadTotal: data.count });
  },
}));
