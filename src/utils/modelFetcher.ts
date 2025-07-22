import { isLocalEndpoint } from './settings';

export interface ModelInfo {
  id: string;
  name?: string;
  owned_by?: string;
  created?: number;
  object?: string;
}

export interface ModelsResponse {
  object: string;
  data: ModelInfo[];
}

export const fetchAvailableModels = async (
  endpoint: string, 
  apiKey?: string,
  timeoutMs: number = 5000
): Promise<string[]> => {
  try {
    const modelsUrl = `${endpoint}/models`;
    const isLocal = isLocalEndpoint(endpoint);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Only add Authorization header if API key is provided and it's not a local endpoint
    if (apiKey && !isLocal) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (apiKey && isLocal) {
      // Some local endpoints might still expect an API key
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(modelsUrl, {
      method: 'GET',
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ModelsResponse = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid models response format');
    }

    // Extract model IDs and sort them
    const modelIds = data.data
      .map(model => model.id)
      .filter(id => id && typeof id === 'string')
      .sort();

    return modelIds;
  } catch (error) {
    console.warn('Failed to fetch models from endpoint:', endpoint, error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - endpoint may be unreachable');
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
        throw new Error('Network error - check if the endpoint is accessible');
      }
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error('Authentication failed - check your API key');
      }
    }
    
    throw error;
  }
};

export const getDefaultModelsForEndpoint = (endpointId: string): string[] => {
  switch (endpointId) {
    case 'openai':
      return ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'];
    case 'ollama-local':
    case 'ollama-remote':
      return ['llama3', 'llama2', 'mistral', 'codellama', 'vicuna', 'orca-mini', 'phi3'];
    case 'lmstudio':
      return ['local-model'];
    case 'together':
      return ['meta-llama/Llama-2-7b-chat-hf', 'mistralai/Mistral-7B-Instruct-v0.1', 'NousResearch/Nous-Hermes-2-Yi-34B'];
    default:
      return ['gpt-3.5-turbo'];
  }
};