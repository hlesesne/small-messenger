import React, { useState } from 'react';
import { Conversation } from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import './ConversationList.css';

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
  onOpenSettings: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onOpenSettings
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    conversationId: string;
    conversationTitle: string;
  }>({
    isOpen: false,
    conversationId: '',
    conversationTitle: ''
  });
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today - show time
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      // This week - show day
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      // Older - show date
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const truncateMessage = (message: string, maxLength: number = 60) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength).trim() + '...';
  };

  const handleDeleteClick = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({
      isOpen: true,
      conversationId: conversation.id,
      conversationTitle: conversation.title
    });
  };

  const handleDeleteConfirm = () => {
    onDeleteConversation(deleteConfirm.conversationId);
    setDeleteConfirm({
      isOpen: false,
      conversationId: '',
      conversationTitle: ''
    });
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({
      isOpen: false,
      conversationId: '',
      conversationTitle: ''
    });
  };

  return (
    <div className="conversation-list">
      <div className="conversation-list-header">
        <div className="header-left">
          <button 
            className="settings-button" 
            onClick={onOpenSettings}
            aria-label="Settings"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
            </svg>
          </button>
        </div>
        <h1>Messages</h1>
        <div className="header-right">
          <button 
            className="new-conversation-button" 
            onClick={onNewConversation}
            aria-label="New conversation"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="conversations-container">
        {conversations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
              </svg>
            </div>
            <h2>No conversations yet</h2>
            <p>Tap the + button to start your first conversation</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="conversation-item"
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="conversation-avatar">
                <div className="avatar-initials">AI</div>
              </div>
              <div className="conversation-info">
                <div className="conversation-header">
                  <span className="conversation-title">{conversation.title}</span>
                  <span className="conversation-time">
                    {formatTime(conversation.updatedAt)}
                  </span>
                </div>
                <div className="conversation-preview">
                  {conversation.lastMessage 
                    ? truncateMessage(conversation.lastMessage)
                    : 'Start a conversation...'
                  }
                </div>
              </div>
              <div className="conversation-actions">
                <button
                  className="delete-button"
                  onClick={(e) => handleDeleteClick(conversation, e)}
                  aria-label="Delete conversation"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
                <div className="conversation-chevron">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                  </svg>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Conversation"
        message={`Are you sure you want to delete "${deleteConfirm.conversationTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        destructive={true}
      />
    </div>
  );
};