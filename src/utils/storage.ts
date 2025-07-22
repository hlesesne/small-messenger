import { Conversation } from '../types';

const STORAGE_KEYS = {
  CONVERSATIONS: 'pwa_imessage_conversations',
  CURRENT_CONVERSATION: 'pwa_imessage_current_conversation',
};

export const saveConversations = (conversations: Conversation[]): void => {
  try {
    console.log('Saving to localStorage:', conversations.length, 'conversations');
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (error) {
    console.error('Error saving conversations:', error);
  }
};

export const loadConversations = (): Conversation[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    console.log('Loading from localStorage:', stored ? 'data found' : 'no data');
    if (!stored) return [];
    
    const conversations = JSON.parse(stored);
    console.log('Parsed conversations:', conversations.length);
    return conversations.map((conv: any) => ({
      ...conv,
      updatedAt: new Date(conv.updatedAt),
      messages: conv.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }));
  } catch (error) {
    console.error('Error loading conversations:', error);
    return [];
  }
};

export const saveCurrentConversationId = (conversationId: string | null): void => {
  try {
    if (conversationId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_CONVERSATION, conversationId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_CONVERSATION);
    }
  } catch (error) {
    console.error('Error saving current conversation ID:', error);
  }
};

export const loadCurrentConversationId = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_CONVERSATION);
  } catch (error) {
    console.error('Error loading current conversation ID:', error);
    return null;
  }
};

export const generateConversationTitle = (firstMessage: string): string => {
  if (!firstMessage) return 'New Conversation';
  
  const words = firstMessage.trim().split(' ').slice(0, 6);
  let title = words.join(' ');
  
  if (title.length > 50) {
    title = title.substring(0, 47) + '...';
  }
  
  if (firstMessage.split(' ').length > 6) {
    title += '...';
  }
  
  return title || 'New Conversation';
};

// Test localStorage availability
export const testLocalStorage = (): boolean => {
  try {
    const testKey = 'localStorage_test';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.error('localStorage not available:', error);
    return false;
  }
};