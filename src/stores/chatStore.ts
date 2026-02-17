import { create } from 'zustand';
import { ConversationWithDetails, MessageWithSender } from '../types/chat';

type ChatState = {
  conversations: ConversationWithDetails[];
  currentMessages: MessageWithSender[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;

  setConversations: (conversations: ConversationWithDetails[]) => void;
  setCurrentMessages: (messages: MessageWithSender[]) => void;
  addMessage: (message: MessageWithSender) => void;
  updateMessageTranslations: (messageId: string, translations: Record<string, string>) => void;
  removeMessage: (messageId: string) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentMessages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,

  setConversations: (conversations) => set({ conversations }),

  setCurrentMessages: (messages) => set({ currentMessages: messages }),

  addMessage: (message) =>
    set((state) => ({
      currentMessages: [...state.currentMessages, message],
    })),

  updateMessageTranslations: (messageId, translations) =>
    set((state) => ({
      currentMessages: state.currentMessages.map((msg) =>
        msg.id === messageId ? { ...msg, translations } : msg
      ),
    })),

  removeMessage: (messageId) =>
    set((state) => ({
      currentMessages: state.currentMessages.filter((msg) => msg.id !== messageId),
    })),
}));
