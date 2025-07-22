export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  lastMessage?: string;
  updatedAt: Date;
}

export interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  createConversation: () => void;
  selectConversation: (id: string) => void;
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
}

export interface AISettings {
  apiKey: string;
  endpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface AppSettings {
  ai: AISettings;
}

export const DEFAULT_SETTINGS: AppSettings = {
  ai: {
    apiKey: '',
    endpoint: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 2000
  }
};

export const COMMON_MODELS = [
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' }
];

export const COMMON_ENDPOINTS = [
  { id: 'openai', name: 'OpenAI', url: 'https://api.openai.com/v1', requiresKey: true },
  { id: 'ollama-local', name: 'Ollama (Local)', url: 'http://localhost:11434/v1', requiresKey: false },
  { id: 'ollama-remote', name: 'Ollama (Remote)', url: '', requiresKey: false },
  { id: 'lmstudio', name: 'LM Studio (Local)', url: 'http://localhost:1234/v1', requiresKey: false },
  { id: 'together', name: 'Together AI', url: 'https://api.together.xyz/v1', requiresKey: true },
  { id: 'custom', name: 'Custom Endpoint', url: '', requiresKey: true }
];