import React, { createContext, useContext, useState } from 'react';
import { chatAPI } from '../services/api';
import toast from 'react-hot-toast';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [currentProfile, setCurrentProfile] = useState(null);
  const [conversations, setConversations] = useState({});
  const [loading, setLoading] = useState(false);

  const sendTextMessage = async (message, profileId) => {
    try {
      setLoading(true);
      const response = await chatAPI.sendTextMessage(message, profileId);
      
      // Update conversation in state
      setConversations(prev => ({
        ...prev,
        [profileId]: [
          ...(prev[profileId] || []),
          { type: 'user', content: message, inputType: 'text', timestamp: new Date() },
          { type: 'ai', content: response.data.response, inputType: 'text', timestamp: new Date() }
        ]
      }));

      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send message';
      if (error.response?.data?.limitReached) {
        toast.error(message);
      } else {
        toast.error(message);
      }
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const sendImageMessage = async (imageFile, profileId) => {
    try {
      setLoading(true);
      const response = await chatAPI.sendImageMessage(imageFile, profileId);
      
      // Update conversation in state
      setConversations(prev => ({
        ...prev,
        [profileId]: [
          ...(prev[profileId] || []),
          { type: 'user', content: 'Image uploaded', inputType: 'image', timestamp: new Date() },
          { type: 'ai', content: response.data.response, inputType: 'text', timestamp: new Date() }
        ]
      }));

      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send image';
      if (error.response?.data?.limitReached) {
        toast.error(message);
      } else {
        toast.error(message);
      }
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const sendVoiceMessage = async (audioFile, profileId) => {
    try {
      setLoading(true);
      const response = await chatAPI.sendVoiceMessage(audioFile, profileId);
      
      // Update conversation in state
      setConversations(prev => ({
        ...prev,
        [profileId]: [
          ...(prev[profileId] || []),
          { type: 'user', content: response.data.transcription, inputType: 'voice', timestamp: new Date() },
          { type: 'ai', content: response.data.response, inputType: 'text', timestamp: new Date() }
        ]
      }));

      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send voice message';
      if (error.response?.data?.limitReached) {
        toast.error(message);
      } else {
        toast.error(message);
      }
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const sendScreenshotMessage = async (screenshotFile, profileId) => {
    try {
      setLoading(true);
      const response = await chatAPI.sendScreenshotMessage(screenshotFile, profileId);
      
      // Update conversation in state
      setConversations(prev => ({
        ...prev,
        [profileId]: [
          ...(prev[profileId] || []),
          { type: 'user', content: 'Screenshot uploaded', inputType: 'screenshot', timestamp: new Date() },
          { type: 'ai', content: response.data.response, inputType: 'text', timestamp: new Date() }
        ]
      }));

      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send screenshot';
      if (error.response?.data?.limitReached) {
        toast.error(message);
      } else {
        toast.error(message);
      }
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (profileId) => {
    try {
      const response = await chatAPI.getConversation(profileId);
      setConversations(prev => ({
        ...prev,
        [profileId]: response.data.messages || []
      }));
    } catch (error) {
      console.error('Load conversation error:', error);
    }
  };

  const generateConversationStarters = async (profileId) => {
    try {
      const response = await chatAPI.generateConversationStarters(profileId);
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to generate conversation starters';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const clearConversation = (profileId) => {
    setConversations(prev => ({
      ...prev,
      [profileId]: []
    }));
  };

  const value = {
    currentProfile,
    setCurrentProfile,
    conversations,
    loading,
    sendTextMessage,
    sendImageMessage,
    sendVoiceMessage,
    sendScreenshotMessage,
    loadConversation,
    generateConversationStarters,
    clearConversation
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
