import { useState, useEffect } from 'react';
import { ChatHeader } from './components/ChatHeader';
import { ChatView } from './components/ChatView';
import { MessageInput } from './components/MessageInput';
import { ConversationList } from './components/ConversationList';
import { Settings } from './components/Settings';
import { useChat } from './hooks/useChat';
import { } from './utils/chatgpt';
import { testLocalStorage } from './utils/storage';
import {  } from './utils/settings';
import './App.css';

function App() {
  const { 
    conversations, 
    currentConversation, 
    sendMessage, 
    isLoading, 
    selectConversation,
    deleteConversation,
    hasApiKey,
    updateSettings,
    settingsLoaded
  } = useChat();
  const [showConversationList, setShowConversationList] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Test localStorage availability
    const storageAvailable = testLocalStorage();
    console.log('localStorage available:', storageAvailable);
    
    // Only check configuration after settings have loaded to avoid premature settings popup
    if (settingsLoaded) {
      const isConfigurationIncomplete = !hasApiKey;
      if (isConfigurationIncomplete) {
        setShowSettings(true);
      }
    }
  }, [hasApiKey, settingsLoaded]);

  useEffect(() => {
    // Show conversation list when there's no current conversation
    if (!currentConversation) {
      setShowConversationList(true);
    } else {
      setShowConversationList(false);
    }
  }, [currentConversation]);


  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    // Only allow closing if configuration is complete
    if (hasApiKey) {
      setShowSettings(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!hasApiKey) {
      setShowSettings(true);
      return;
    }
    await sendMessage(message);
  };

  const handleNewChat = () => {
    // const newConv = createConversation();
    setShowConversationList(false);
  };

  const handleBackToList = () => {
    setShowConversationList(true);
  };

  const handleSelectConversation = (conversationId: string) => {
    selectConversation(conversationId);
    setShowConversationList(false);
  };


  if (showConversationList) {
    return (
      <div className="app">
        <ConversationList
          conversations={conversations}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewChat}
          onDeleteConversation={deleteConversation}
          onOpenSettings={handleOpenSettings}
        />
        <Settings
          isOpen={showSettings}
          onClose={handleCloseSettings}
          onSettingsChange={updateSettings}
          required={!hasApiKey}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <ChatHeader 
        title={currentConversation?.title || "ChatGPT"}
        onBack={handleBackToList}
        showBack={true}
        onSettings={handleOpenSettings}
        showSettings={true}
      />
      <ChatView 
        messages={currentConversation?.messages || []} 
        isLoading={isLoading}
      />
      <MessageInput 
        onSendMessage={handleSendMessage}
        disabled={isLoading}
        placeholder="Message"
      />
      <Settings
        isOpen={showSettings}
        onClose={handleCloseSettings}
        onSettingsChange={updateSettings}
        required={!hasApiKey}
      />
    </div>
  );
}

export default App;