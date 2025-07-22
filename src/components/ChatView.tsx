import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { Message } from '../types';
import './ChatView.css';

interface ChatViewProps {
  messages: Message[];
  isLoading?: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({ messages, isLoading = false }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const shouldShowTimestamp = (current: Message, previous?: Message) => {
    if (!previous) return true;
    
    const timeDiff = current.timestamp.getTime() - previous.timestamp.getTime();
    return timeDiff > 300000; // Show timestamp if more than 5 minutes apart
  };

  return (
    <div className="chat-view">
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <div className="welcome-content">
              <div className="ai-avatar">
                <div className="avatar-initials">AI</div>
              </div>
              <h2>Welcome to ChatGPT</h2>
              <p>I'm here to help you with questions, creative tasks, analysis, and more. What would you like to explore today?</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={message.id}>
              {shouldShowTimestamp(message, messages[index - 1]) && (
                <div className="timestamp-divider">
                  {message.timestamp.toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
              )}
              <MessageBubble message={message} />
            </div>
          ))
        )}
        {isLoading && (
          <MessageBubble 
            message={{
              id: 'typing',
              content: '',
              sender: 'assistant',
              timestamp: new Date(),
              isTyping: true
            }}
          />
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};