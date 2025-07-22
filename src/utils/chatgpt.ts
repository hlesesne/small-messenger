import { Message, AISettings } from '../types';
import { isLocalEndpoint } from './settings';

export interface ChatGPTMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class ChatGPTService {
  private settings: AISettings;

  constructor(settings: AISettings) {
    this.settings = settings;
  }

  updateSettings(settings: AISettings) {
    this.settings = settings;
  }

  async sendMessage(messages: Message[]): Promise<string> {
    try {
      const chatMessages: ChatGPTMessage[] = [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. Provide clear, concise, and helpful responses. Use markdown formatting when appropriate for code blocks, lists, and emphasis.'
        },
        ...messages
          .filter(msg => !msg.isTyping)
          .map(msg => ({
            role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.content
          }))
      ];

      const apiUrl = `${this.settings.endpoint}/chat/completions`;
      const isLocal = isLocalEndpoint(this.settings.endpoint);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Only add Authorization header if API key is provided
      if (this.settings.apiKey && !isLocal) {
        headers['Authorization'] = `Bearer ${this.settings.apiKey}`;
      } else if (this.settings.apiKey) {
        // Some local endpoints might still expect an API key
        headers['Authorization'] = `Bearer ${this.settings.apiKey}`;
      }

      const requestBody = {
        model: this.settings.model,
        messages: chatMessages,
        temperature: this.settings.temperature,
        max_tokens: this.settings.maxTokens,
        stream: false
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Sorry, I encountered an error processing your request.';
    } catch (error) {
      console.error('ChatGPT API Error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('API key') || error.message.includes('auth')) {
          return 'Please check your API key in the settings.';
        }
        if (error.message.includes('quota')) {
          return 'API quota exceeded. Please check your account.';
        }
        if (error.message.includes('rate limit')) {
          return 'Rate limit exceeded. Please wait a moment before sending another message.';
        }
        if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
          const isLocal = isLocalEndpoint(this.settings.endpoint);
          if (isLocal) {
            return 'Cannot connect to local server. Please ensure your local AI server is running.';
          }
          return 'Network error. Please check your connection and try again.';
        }
      }
      
      return 'I apologize, but I encountered an error. Please try again in a moment.';
    }
  }
}

// Legacy functions for backward compatibility
// These will be deprecated in favor of the settings system
export const getStoredApiKey = (): string | null => {
  // Try new settings first, fallback to old storage
  try {
    const settings = JSON.parse(localStorage.getItem('pwa_imessage_settings') || '{}');
    if (settings.ai?.apiKey) {
      return settings.ai.apiKey;
    }
  } catch (error) {
    console.warn('Error reading settings:', error);
  }
  
  return localStorage.getItem('openai_api_key');
};

export const storeApiKey = (apiKey: string): void => {
  // Store in old format for compatibility
  localStorage.setItem('openai_api_key', apiKey);
};

export const removeApiKey = (): void => {
  localStorage.removeItem('openai_api_key');
};