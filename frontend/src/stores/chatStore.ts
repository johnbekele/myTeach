import { create } from 'zustand';
import { api } from '@/lib/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  context_type: string;
  context_id?: string;
  messages: ChatMessage[];
  isActive: boolean;
}

interface ChatState {
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  sendMessage: (
    message: string,
    contextType?: string,
    contextId?: string,
    userCode?: string
  ) => Promise<void>;
  getHint: (exerciseId: string, hintLevel: number, userCode?: string) => Promise<string>;
  loadHistory: (sessionId: string) => Promise<void>;
  clearChat: () => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  currentSession: null,
  messages: [],
  isLoading: false,
  error: null,

  sendMessage: async (message, contextType = 'general', contextId, userCode) => {
    set({ isLoading: true, error: null });

    // Optimistically add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      messages: [...state.messages, userMessage],
    }));

    try {
      const response = await api.sendChatMessage({
        message,
        context_type: contextType,
        context_id: contextId,
        user_code: userCode,
      });

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: response.timestamp,
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to send message',
        isLoading: false,
      });
      // Remove optimistic user message on error
      set((state) => ({
        messages: state.messages.slice(0, -1),
      }));
      throw error;
    }
  },

  getHint: async (exerciseId, hintLevel, userCode = '') => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getHint(exerciseId, hintLevel, userCode);

      // Add hint as assistant message
      const hintMessage: ChatMessage = {
        role: 'assistant',
        content: `💡 **Hint ${hintLevel}:**\n\n${response.hint}`,
        timestamp: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, hintMessage],
        isLoading: false,
      }));

      return response.hint;
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to get hint',
        isLoading: false,
      });
      throw error;
    }
  },

  loadHistory: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getChatHistory(sessionId);
      set({
        messages: response.messages,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Failed to load history',
        isLoading: false,
      });
      throw error;
    }
  },

  clearChat: () => {
    set({
      messages: [],
      currentSession: null,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
