import React, { useState, useEffect } from 'react';
import { AppSettings, COMMON_ENDPOINTS } from '../types';
import { loadSettings, saveSettings, validateEndpoint, isLocalEndpoint } from '../utils/settings';
import { fetchAvailableModels, getDefaultModelsForEndpoint } from '../utils/modelFetcher';
import './Settings.css';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: AppSettings) => void;
  required?: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ 
  isOpen, 
  onClose, 
  onSettingsChange,
  required = false
}) => {
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [selectedEndpoint, setSelectedEndpoint] = useState('openai');
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsFetchError, setModelsFetchError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const currentSettings = loadSettings();
      setSettings(currentSettings);
      
      // Determine which endpoint is selected
      const endpoint = COMMON_ENDPOINTS.find(e => e.url === currentSettings.ai.endpoint);
      if (endpoint) {
        setSelectedEndpoint(endpoint.id);
      } else {
        // Check if it's a remote Ollama endpoint (contains /v1 and not localhost)
        if (currentSettings.ai.endpoint.includes('/v1') && !currentSettings.ai.endpoint.includes('localhost') && !currentSettings.ai.endpoint.includes('127.0.0.1')) {
          setSelectedEndpoint('ollama-remote');
          setCustomEndpoint(currentSettings.ai.endpoint);
        } else {
          setSelectedEndpoint('custom');
          setCustomEndpoint(currentSettings.ai.endpoint);
        }
      }
    }
  }, [isOpen]);

  // Only fetch models when we have a complete, valid endpoint
  const shouldFetchModels = (endpoint: string, endpointId: string) => {
    if (!endpoint || !validateEndpoint(endpoint)) return false;
    
    // For predefined endpoints, we have the complete URL
    const predefinedEndpoint = COMMON_ENDPOINTS.find(e => e.id === endpointId);
    if (predefinedEndpoint && predefinedEndpoint.url) {
      return true;
    }
    
    // For custom/remote endpoints, only fetch if URL looks complete
    if ((endpointId === 'custom' || endpointId === 'ollama-remote') && endpoint.includes('/v1')) {
      return true;
    }
    
    return false;
  };

  // Fetch models only when endpoint is complete and stable
  useEffect(() => {
    if (isOpen && shouldFetchModels(settings.ai.endpoint, selectedEndpoint)) {
      // Longer debounce for more stable fetching
      const timeoutId = setTimeout(() => {
        fetchModels(settings.ai.endpoint, settings.ai.apiKey);
      }, 1000);

      return () => clearTimeout(timeoutId);
    } else {
      // Set default models for the endpoint type
      setAvailableModels(getDefaultModelsForEndpoint(selectedEndpoint));
    }
  }, [isOpen, settings.ai.endpoint, settings.ai.apiKey, selectedEndpoint]);

  const handleEndpointChange = (endpointId: string) => {
    setSelectedEndpoint(endpointId);
    const endpoint = COMMON_ENDPOINTS.find(e => e.id === endpointId);
    
    if (endpoint && endpoint.id !== 'custom' && endpoint.id !== 'ollama-remote') {
      setSettings(prev => ({
        ...prev,
        ai: { ...prev.ai, endpoint: endpoint.url }
      }));
      setCustomEndpoint('');
    } else if (endpointId === 'ollama-remote') {
      // For remote Ollama, keep current custom endpoint or clear it
      if (!customEndpoint) {
        setCustomEndpoint('http://your-server:11434/v1');
      }
    }
  };

  const handleCustomEndpointChange = (url: string) => {
    setCustomEndpoint(url);
    if (selectedEndpoint === 'custom' || selectedEndpoint === 'ollama-remote') {
      setSettings(prev => ({
        ...prev,
        ai: { ...prev.ai, endpoint: url }
      }));
    }
  };

  const validateSettings = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!validateEndpoint(settings.ai.endpoint)) {
      newErrors.endpoint = 'Please enter a valid URL';
    }

    const endpoint = COMMON_ENDPOINTS.find(e => e.url === settings.ai.endpoint) || 
                    COMMON_ENDPOINTS.find(e => e.id === selectedEndpoint);
    const requiresKey = endpoint?.requiresKey !== false;
    const isLocal = isLocalEndpoint(settings.ai.endpoint);

    if (requiresKey && !isLocal && !settings.ai.apiKey.trim()) {
      newErrors.apiKey = 'API key is required for this endpoint';
    }

    if (!settings.ai.model.trim()) {
      newErrors.model = 'Model is required';
    }

    if (settings.ai.temperature < 0 || settings.ai.temperature > 2) {
      newErrors.temperature = 'Temperature must be between 0 and 2';
    }

    if (settings.ai.maxTokens < 1 || settings.ai.maxTokens > 8000) {
      newErrors.maxTokens = 'Max tokens must be between 1 and 8000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateSettings()) {
      saveSettings(settings);
      onSettingsChange(settings);
      onClose();
    }
  };

  const handleReset = () => {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      const defaultSettings = loadSettings();
      setSettings(defaultSettings);
      setSelectedEndpoint('openai');
      setCustomEndpoint('');
      setErrors({});
    }
  };

  const fetchModels = async (endpoint: string, apiKey?: string) => {
    if (!endpoint || !validateEndpoint(endpoint)) {
      setAvailableModels(getDefaultModelsForEndpoint(selectedEndpoint));
      return;
    }

    setIsLoadingModels(true);
    setModelsFetchError('');

    try {
      const models = await fetchAvailableModels(endpoint, apiKey, 8000);
      setAvailableModels(models);
    } catch (error) {
      console.warn('Failed to fetch models:', error);
      setModelsFetchError(error instanceof Error ? error.message : 'Failed to fetch models');
      // Fallback to default models
      setAvailableModels(getDefaultModelsForEndpoint(selectedEndpoint));
    } finally {
      setIsLoadingModels(false);
    }
  };

  const getModelSuggestions = () => {
    if (availableModels.length > 0) {
      return availableModels;
    }
    return getDefaultModelsForEndpoint(selectedEndpoint);
  };

  if (!isOpen) return null;

  const endpoint = COMMON_ENDPOINTS.find(e => e.url === settings.ai.endpoint) || 
                  COMMON_ENDPOINTS.find(e => e.id === selectedEndpoint);
  const requiresKey = endpoint?.requiresKey !== false;
  const isLocal = isLocalEndpoint(settings.ai.endpoint);

  return (
    <div className="settings-overlay" onClick={required ? undefined : onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <div className="settings-title">
            <h2>{required ? 'Setup Required' : 'Settings'}</h2>
            {required && (
              <p className="setup-subtitle">Configure your AI service to get started</p>
            )}
          </div>
          {!required && (
            <button className="close-button" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          )}
        </div>

        <div className="settings-content">
          <section className="settings-section">
            <h3>AI Service</h3>
            
            <div className="form-group">
              <label htmlFor="endpoint">Endpoint</label>
              <select
                id="endpoint"
                value={selectedEndpoint}
                onChange={(e) => handleEndpointChange(e.target.value)}
                className="form-control"
              >
                {COMMON_ENDPOINTS.map(endpoint => (
                  <option key={endpoint.id} value={endpoint.id}>
                    {endpoint.name}
                  </option>
                ))}
              </select>
            </div>

            {(selectedEndpoint === 'custom' || selectedEndpoint === 'ollama-remote') && (
              <div className="form-group">
                <label htmlFor="customEndpoint">
                  {selectedEndpoint === 'ollama-remote' ? 'Ollama Server URL' : 'Custom Endpoint URL'}
                </label>
                <input
                  id="customEndpoint"
                  type="url"
                  value={customEndpoint}
                  onChange={(e) => handleCustomEndpointChange(e.target.value)}
                  placeholder={selectedEndpoint === 'ollama-remote' ? 'http://your-server:11434/v1' : 'https://api.example.com/v1'}
                  className={`form-control ${errors.endpoint ? 'error' : ''}`}
                />
                {errors.endpoint && <span className="error-text">{errors.endpoint}</span>}
                {selectedEndpoint === 'ollama-remote' && (
                  <div className="help-text">
                    Enter the URL of your remote Ollama server (e.g., http://192.168.1.100:11434/v1)
                  </div>
                )}
                {(selectedEndpoint === 'custom' || selectedEndpoint === 'ollama-remote') && 
                 validateEndpoint(customEndpoint) && (
                  <button
                    type="button"
                    className="fetch-models-button"
                    onClick={() => {
                      setSettings(prev => ({
                        ...prev,
                        ai: { ...prev.ai, endpoint: customEndpoint }
                      }));
                      fetchModels(customEndpoint, settings.ai.apiKey);
                    }}
                    disabled={isLoadingModels}
                  >
                    {isLoadingModels ? 'Fetching Models...' : 'Fetch Available Models'}
                  </button>
                )}
              </div>
            )}

            {(requiresKey && !isLocal) && (
              <div className="form-group">
                <label htmlFor="apiKey">API Key</label>
                <input
                  id="apiKey"
                  type="password"
                  value={settings.ai.apiKey}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    ai: { ...prev.ai, apiKey: e.target.value }
                  }))}
                  placeholder="Enter your API key"
                  className={`form-control ${errors.apiKey ? 'error' : ''}`}
                />
                {errors.apiKey && <span className="error-text">{errors.apiKey}</span>}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="model">
                Model
                {isLoadingModels && <span className="loading-indicator"> (Loading...)</span>}
              </label>
              <div className="model-input-group">
                <select
                  id="model"
                  value={settings.ai.model}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    ai: { ...prev.ai, model: e.target.value }
                  }))}
                  className={`form-control ${errors.model ? 'error' : ''}`}
                  disabled={isLoadingModels}
                >
                  {!settings.ai.model && (
                    <option value="" disabled>
                      Select a model...
                    </option>
                  )}
                  {getModelSuggestions().map(model => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="refresh-models-button"
                  onClick={() => {
                    if (shouldFetchModels(settings.ai.endpoint, selectedEndpoint)) {
                      fetchModels(settings.ai.endpoint, settings.ai.apiKey);
                    }
                  }}
                  disabled={isLoadingModels || !shouldFetchModels(settings.ai.endpoint, selectedEndpoint)}
                  title="Refresh available models"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
                  </svg>
                </button>
              </div>
              {errors.model && <span className="error-text">{errors.model}</span>}
              {modelsFetchError && (
                <span className="error-text">⚠️ {modelsFetchError}</span>
              )}
              {availableModels.length > 0 && !isLoadingModels && !modelsFetchError && (
                <div className="help-text">
                  {availableModels.length} models available from this endpoint
                </div>
              )}
            </div>
          </section>

          <section className="settings-section">
            <h3>Generation Parameters</h3>
            
            <div className="form-group">
              <label htmlFor="temperature">
                Temperature: {settings.ai.temperature}
              </label>
              <input
                id="temperature"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.ai.temperature}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  ai: { ...prev.ai, temperature: parseFloat(e.target.value) }
                }))}
                className="form-control range"
              />
              <div className="range-labels">
                <span>Focused</span>
                <span>Balanced</span>
                <span>Creative</span>
              </div>
              {errors.temperature && <span className="error-text">{errors.temperature}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="maxTokens">Max Tokens</label>
              <input
                id="maxTokens"
                type="number"
                min="1"
                max="8000"
                value={settings.ai.maxTokens}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  ai: { ...prev.ai, maxTokens: parseInt(e.target.value) || 1000 }
                }))}
                className={`form-control ${errors.maxTokens ? 'error' : ''}`}
              />
              {errors.maxTokens && <span className="error-text">{errors.maxTokens}</span>}
            </div>
          </section>

          {(isLocal || selectedEndpoint === 'ollama-remote') && (
            <section className="settings-section local-info">
              <h3>{selectedEndpoint === 'ollama-remote' ? 'Ollama Server' : 'Local Server'}</h3>
              <div className="info-box">
                {selectedEndpoint === 'ollama-remote' ? (
                  <>
                    <p>Make sure your remote Ollama server is running and accessible.</p>
                    <ul>
                      <li><strong>Server:</strong> Run <code>ollama serve</code> on your server</li>
                      <li><strong>Network:</strong> Ensure the server is accessible from your network</li>
                      <li><strong>Models:</strong> Use <code>ollama pull model-name</code> to download models</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p>You're using a local AI server. Make sure it's running and accessible.</p>
                    <ul>
                      <li><strong>Ollama:</strong> Run <code>ollama serve</code></li>
                      <li><strong>LM Studio:</strong> Start the local server</li>
                    </ul>
                  </>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="settings-actions">
          <button className="button secondary" onClick={handleReset}>
            Reset to Defaults
          </button>
          <div className="button-group">
            {!required && (
              <button className="button secondary" onClick={onClose}>
                Cancel
              </button>
            )}
            <button className="button primary" onClick={handleSave}>
              {required ? 'Get Started' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};