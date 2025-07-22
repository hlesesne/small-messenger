import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Conversation, Message, AppSettings } from '../types';
import { ChatGPTService } from '../utils/chatgpt';
import { 
  saveConversations, 
  loadConversations, 
  saveCurrentConversationId, 
  loadCurrentConversationId,
  generateConversationTitle 
} from '../utils/storage';
import { loadSettings, migrateOldSettings, isLocalEndpoint } from '../utils/settings';

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatService, setChatService] = useState<ChatGPTService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(loadSettings());

  useEffect(() => {
    // Migrate old settings and initialize service
    const currentSettings = migrateOldSettings();
    setSettings(currentSettings);
    
    // Initialize chat service if we have required settings
    if (currentSettings.ai.endpoint) {
      const service = new ChatGPTService(currentSettings.ai);
      setChatService(service);
    }
    
    setSettingsLoaded(true);
  }, []);

  useEffect(() => {
    const loadedConversations = loadConversations();
    console.log('Loaded conversations on mount:', loadedConversations.length);
    setConversations(loadedConversations);
    
    const currentId = loadCurrentConversationId();
    if (currentId && loadedConversations.length > 0) {
      const current = loadedConversations.find(conv => conv.id === currentId);
      setCurrentConversation(current || null);
    }
    
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    // Only save after initial load and if we have conversations or had conversations before
    if (isInitialized) {
      console.log('Saving conversations:', conversations.length);
      saveConversations(conversations);
    }
  }, [conversations, isInitialized]);

  useEffect(() => {
    saveCurrentConversationId(currentConversation?.id || null);
  }, [currentConversation]);

  const createConversation = useCallback((): Conversation => {
    const newConversation: Conversation = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      updatedAt: new Date()
    };

    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversation(newConversation);
    
    return newConversation;
  }, []);

  const selectConversation = useCallback((id: string) => {
    const conversation = conversations.find(conv => conv.id === id);
    if (conversation) {
      setCurrentConversation(conversation);
    }
  }, [conversations]);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    
    // If we're deleting the current conversation, clear it
    if (currentConversation?.id === id) {
      setCurrentConversation(null);
    }
  }, [currentConversation]);

  const updateSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    
    // Update or create chat service with new settings
    if (newSettings.ai.endpoint) {
      if (chatService) {
        chatService.updateSettings(newSettings.ai);
      } else {
        const service = new ChatGPTService(newSettings.ai);
        setChatService(service);
      }
    }
  }, [chatService]);

  // Check if configuration is complete
  const isConfigurationComplete = useCallback(() => {
    if (!settings.ai.endpoint) return false;
    
    // Local endpoints don't always require API keys
    const isLocal = isLocalEndpoint(settings.ai.endpoint);
    if (isLocal) {
      return !!settings.ai.model; // Just need a model for local endpoints
    }
    
    // Remote endpoints need both API key and model
    return !!(settings.ai.apiKey && settings.ai.model);
  }, [settings]);

  const updateConversation = useCallback((updatedConversation: Conversation) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === updatedConversation.id ? updatedConversation : conv
      )
    );
    
    if (currentConversation?.id === updatedConversation.id) {
      setCurrentConversation(updatedConversation);
    }
  }, [currentConversation]);

  const sendMessage = useCallback(async (content: string) => {
    if (!chatService) {
      alert('Please set your OpenAI API key in the settings first.');
      return;
    }

    let conversation = currentConversation;
    
    if (!conversation) {
      conversation = createConversation();
    }

    const userMessage: Message = {
      id: uuidv4(),
      content,
      sender: 'user',
      timestamp: new Date()
    };

    const updatedMessages = [...conversation.messages, userMessage];
    const updatedConversation: Conversation = {
      ...conversation,
      messages: updatedMessages,
      lastMessage: content,
      updatedAt: new Date(),
      title: conversation.messages.length === 0 ? generateConversationTitle(content) : conversation.title
    };

    updateConversation(updatedConversation);
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(updatedMessages);
      
      const assistantMessage: Message = {
        id: uuidv4(),
        content: response,
        sender: 'assistant',
        timestamp: new Date()
      };

      const finalConversation: Conversation = {
        ...updatedConversation,
        messages: [...updatedMessages, assistantMessage],
        lastMessage: response,
        updatedAt: new Date()
      };

      updateConversation(finalConversation);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: uuidv4(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'assistant',
        timestamp: new Date()
      };

      const errorConversation: Conversation = {
        ...updatedConversation,
        messages: [...updatedMessages, errorMessage],
        lastMessage: errorMessage.content,
        updatedAt: new Date()
      };

      updateConversation(errorConversation);
    } finally {
      setIsLoading(false);
    }
  }, [chatService, currentConversation, createConversation, updateConversation]);

  return {
    conversations,
    currentConversation,
    createConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    isLoading,
    hasApiKey: settingsLoaded ? isConfigurationComplete() : true, // Assume true while loading to prevent settings popup
    settings,
    updateSettings,
    settingsLoaded
  };
};