import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import './MessageBubble.css';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={`message-container ${isUser ? 'user' : 'assistant'}`}>
      <div className={`message-bubble ${isUser ? 'user' : 'assistant'}`}>
        {message.isTyping ? (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        ) : (
          <div className="message-content">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
      {!message.isTyping && (
        <div className="message-timestamp">
          {formatTime(message.timestamp)}
        </div>
      )}
    </div>
  );
};