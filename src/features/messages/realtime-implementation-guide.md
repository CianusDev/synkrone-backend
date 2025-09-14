# Guide d'Implémentation Realtime pour Messages et Conversations - Next.js App Router

Ce guide détaille comment implémenter proprement le système de chat en temps réel dans une application Next.js avec App Router, en utilisant Socket.IO pour la communication avec le backend Synkrone.

---

## 📋 Table des matières

1. [Architecture générale](#architecture-générale)
2. [Configuration Socket.IO côté client](#configuration-socketio-côté-client)
3. [Context Provider pour le Chat](#context-provider-pour-le-chat)
4. [Types TypeScript](#types-typescript)
5. [Hooks personnalisés](#hooks-personnalisés)
6. [Composants UI](#composants-ui)
7. [Gestion des états et optimistic updates](#gestion-des-états-et-optimistic-updates)
8. [Sécurité et authentification](#sécurité-et-authentification)
9. [Bonnes pratiques](#bonnes-pratiques)

---

## Architecture générale

```
src/
├── app/
│   ├── chat/
│   │   ├── page.tsx
│   │   └── [conversationId]/
│   │       └── page.tsx
│   └── layout.tsx
├── components/
│   ├── chat/
│   │   ├── ConversationList.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   ├── MessageBubble.tsx
│   │   └── TypingIndicator.tsx
│   └── providers/
│       └── ChatProvider.tsx
├── contexts/
│   └── ChatContext.tsx
├── hooks/
│   ├── useSocket.ts
│   ├── useConversations.ts
│   └── useMessages.ts
├── types/
│   └── chat.ts
└── lib/
    ├── socket.ts
    └── api.ts
```

---

## Configuration Socket.IO côté client

### `lib/socket.ts`

```typescript
"use client";

import { io, Socket } from "socket.io-client";

class SocketManager {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string): Socket {
    if (this.socket?.connected && this.token === token) {
      return this.socket;
    }

    this.disconnect();
    this.token = token;

    this.socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001", {
      auth: {
        token: token,
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.token = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("✅ Socket connecté:", this.socket?.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket déconnecté:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("🔥 Erreur de connexion socket:", error);
    });
  }
}

export const socketManager = new SocketManager();
```

---

## Types TypeScript

### `types/chat.ts`

```typescript
export interface User {
  id: string;
  firstname?: string;
  lastname?: string;
  companyName?: string;
  photoUrl?: string;
  logoUrl?: string;
  role: "freelance" | "company";
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  sentAt: Date;
  projectId?: string;
  replyToMessageId?: string;
  conversationId?: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  sender: User;
  receiver: User;
  media?: Media[];
  replyToMessage?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
  };
  // État local pour les optimistic updates
  isPending?: boolean;
  isError?: boolean;
}

export interface Conversation {
  id: string;
  freelanceId: string;
  companyId: string;
  applicationId?: string;
  contractId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ConversationWithDetails {
  conversation: Conversation;
  freelance: User;
  company: User;
  lastMessage?: Message;
  unreadCount?: number;
}

export interface Media {
  id: string;
  url: string;
  type: string;
  description?: string;
  uploadedAt: Date;
}

// Événements Socket
export enum MessageEvent {
  Send = "send_message",
  Receive = "receive_message",
  Read = "read_message",
  Update = "update_message",
  Delete = "delete_message",
}

export enum ConversationEvent {
  Create = "create_conversation",
  NewMessage = "new_message",
}

// États du chat
export interface ChatState {
  conversations: ConversationWithDetails[];
  currentConversation: ConversationWithDetails | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  typingUsers: Record<string, string[]>; // conversationId -> userIds[]
}

export interface ChatActions {
  // Conversations
  loadConversations: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  
  // Messages
  sendMessage: (content: string, conversationId: string, replyToMessageId?: string) => Promise<void>;
  loadMessages: (conversationId: string, offset?: number) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  updateMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  
  // Real-time
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
}
```

---

## Context Provider pour le Chat

### `contexts/ChatContext.tsx`

```typescript
"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { socketManager } from "@/lib/socket";
import { ChatState, ChatActions, Message, ConversationWithDetails, MessageEvent } from "@/types/chat";
import { useAuth } from "@/contexts/AuthContext"; // Supposons que vous avez un AuthContext

interface ChatContextType extends ChatState, ChatActions {}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Reducer pour gérer l'état du chat
function chatReducer(state: ChatState, action: any): ChatState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    
    case "SET_CONNECTED":
      return { ...state, isConnected: action.payload };
    
    case "SET_CONVERSATIONS":
      return { 
        ...state, 
        conversations: action.payload,
        isLoading: false,
        error: null 
      };
    
    case "ADD_CONVERSATION":
      return {
        ...state,
        conversations: [action.payload, ...state.conversations.filter(c => c.conversation.id !== action.payload.conversation.id)]
      };
    
    case "UPDATE_CONVERSATION_LAST_MESSAGE":
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.conversation.id === action.conversationId
            ? { ...conv, lastMessage: action.message }
            : conv
        )
      };
    
    case "SET_CURRENT_CONVERSATION":
      return { ...state, currentConversation: action.payload };
    
    case "SET_MESSAGES":
      return { 
        ...state, 
        messages: action.payload,
        isLoading: false,
        error: null 
      };
    
    case "ADD_MESSAGE":
      // Éviter les doublons
      const messageExists = state.messages.some(m => m.id === action.payload.id);
      if (messageExists) return state;
      
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
    
    case "ADD_OPTIMISTIC_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, { ...action.payload, isPending: true }]
      };
    
    case "UPDATE_MESSAGE":
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.messageId
            ? { ...msg, content: action.content, isPending: false, isError: false }
            : msg
        )
      };
    
    case "DELETE_MESSAGE":
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.messageId)
      };
    
    case "MARK_MESSAGE_AS_READ":
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.messageId
            ? { ...msg, isRead: true }
            : msg
        )
      };
    
    case "SET_MESSAGE_ERROR":
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.messageId
            ? { ...msg, isPending: false, isError: true }
            : msg
        )
      };
    
    case "SET_TYPING":
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.conversationId]: action.userIds
        }
      };
    
    default:
      return state;
  }
}

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,
  isConnected: false,
  typingUsers: {},
};

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user, token } = useAuth(); // Supposons que vous avez ces données

  // Connexion Socket.IO
  useEffect(() => {
    if (!token || !user) return;

    const socket = socketManager.connect(token);
    
    socket.on("connect", () => {
      dispatch({ type: "SET_CONNECTED", payload: true });
    });

    socket.on("disconnect", () => {
      dispatch({ type: "SET_CONNECTED", payload: false });
    });

    // Écoute des événements de messages
    socket.on(MessageEvent.Receive, (message: Message) => {
      dispatch({ type: "ADD_MESSAGE", payload: message });
      dispatch({ 
        type: "UPDATE_CONVERSATION_LAST_MESSAGE", 
        conversationId: message.conversationId,
        message 
      });
    });

    socket.on(MessageEvent.Send, (message: Message) => {
      // Confirmer l'envoi du message optimiste
      dispatch({ type: "ADD_MESSAGE", payload: message });
    });

    socket.on(MessageEvent.Read, ({ messageId }: { messageId: string }) => {
      dispatch({ type: "MARK_MESSAGE_AS_READ", messageId });
    });

    socket.on(MessageEvent.Update, ({ messageId, newContent }: { messageId: string; newContent: string }) => {
      dispatch({ type: "UPDATE_MESSAGE", messageId, content: newContent });
    });

    socket.on(MessageEvent.Delete, ({ messageId }: { messageId: string }) => {
      dispatch({ type: "DELETE_MESSAGE", messageId });
    });

    // Événements de typing
    socket.on("user_typing", ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      dispatch({
        type: "SET_TYPING",
        conversationId,
        userIds: [...(state.typingUsers[conversationId] || []), userId].filter((v, i, a) => a.indexOf(v) === i)
      });
    });

    socket.on("user_stop_typing", ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      dispatch({
        type: "SET_TYPING",
        conversationId,
        userIds: (state.typingUsers[conversationId] || []).filter(id => id !== userId)
      });
    });

    return () => {
      socketManager.disconnect();
    };
  }, [token, user]);

  // Actions
  const loadConversations = useCallback(async () => {
    if (!token) return;
    
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const response = await fetch("/api/conversations/user", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error("Erreur lors du chargement des conversations");
      
      const conversations = await response.json();
      dispatch({ type: "SET_CONVERSATIONS", payload: conversations });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  }, [token]);

  const selectConversation = useCallback(async (conversationId: string) => {
    const conversation = state.conversations.find(c => c.conversation.id === conversationId);
    if (!conversation) return;

    dispatch({ type: "SET_CURRENT_CONVERSATION", payload: conversation });
    await loadMessages(conversationId);
    joinConversation(conversationId);
  }, [state.conversations]);

  const loadMessages = useCallback(async (conversationId: string, offset = 0) => {
    if (!token) return;

    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const response = await fetch(`/api/messages/${conversationId}?offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error("Erreur lors du chargement des messages");
      
      const messages = await response.json();
      dispatch({ type: offset === 0 ? "SET_MESSAGES" : "ADD_MESSAGES", payload: messages });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: (error as Error).message });
    }
  }, [token]);

  const sendMessage = useCallback(async (content: string, conversationId: string, replyToMessageId?: string) => {
    if (!token || !user) return;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      content,
      senderId: user.id,
      receiverId: state.currentConversation?.freelance.id === user.id 
        ? state.currentConversation.company.id 
        : state.currentConversation?.freelance.id || "",
      conversationId,
      replyToMessageId,
      isRead: false,
      sentAt: new Date(),
      createdAt: new Date(),
      sender: user,
      receiver: state.currentConversation?.freelance.id === user.id 
        ? state.currentConversation.company 
        : state.currentConversation?.freelance || user,
      isPending: true,
    };

    dispatch({ type: "ADD_OPTIMISTIC_MESSAGE", payload: optimisticMessage });

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          conversationId,
          receiverId: optimisticMessage.receiverId,
          replyToMessageId
        })
      });

      if (!response.ok) throw new Error("Erreur lors de l'envoi du message");

      // Le message réel sera reçu via Socket.IO
      // Supprimer le message optimiste
      dispatch({ type: "DELETE_MESSAGE", messageId: tempId });
      
    } catch (error) {
      dispatch({ type: "SET_MESSAGE_ERROR", messageId: tempId });
    }
  }, [token, user, state.currentConversation]);

  const markAsRead = useCallback(async (messageId: string) => {
    if (!token || !user) return;

    try {
      await fetch("/api/messages/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ messageId, userId: user.id })
      });
    } catch (error) {
      console.error("Erreur lors du marquage comme lu:", error);
    }
  }, [token, user]);

  const updateMessage = useCallback(async (messageId: string, content: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });

      if (!response.ok) throw new Error("Erreur lors de la modification");
    } catch (error) {
      console.error("Erreur lors de la modification du message:", error);
    }
  }, [token]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression");
    } catch (error) {
      console.error("Erreur lors de la suppression du message:", error);
    }
  }, [token]);

  const joinConversation = useCallback((conversationId: string) => {
    const socket = socketManager.getSocket();
    if (socket) {
      socket.emit("join_conversation", conversationId);
    }
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    const socket = socketManager.getSocket();
    if (socket) {
      socket.emit("leave_conversation", conversationId);
    }
  }, []);

  const startTyping = useCallback((conversationId: string) => {
    const socket = socketManager.getSocket();
    if (socket) {
      socket.emit("typing", { conversationId });
    }
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    const socket = socketManager.getSocket();
    if (socket) {
      socket.emit("stop_typing", { conversationId });
    }
  }, []);

  const value: ChatContextType = {
    ...state,
    loadConversations,
    selectConversation,
    sendMessage,
    loadMessages,
    markAsRead,
    updateMessage,
    deleteMessage,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
```

---

## Hooks personnalisés

### `hooks/useMessages.ts`

```typescript
"use client";

import { useEffect, useRef, useCallback } from "react";
import { useChat } from "@/contexts/ChatContext";

export function useMessages(conversationId: string) {
  const {
    messages,
    loadMessages,
    sendMessage,
    markAsRead,
    updateMessage,
    deleteMessage,
    startTyping,
    stopTyping,
    isLoading,
    error
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Scroll vers le bas automatiquement
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Gestion du typing avec debounce
  const handleTyping = useCallback(() => {
    startTyping(conversationId);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversationId);
    }, 3000);
  }, [conversationId, startTyping, stopTyping]);

  const handleStopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    stopTyping(conversationId);
  }, [conversationId, stopTyping]);

  // Marquer les messages comme lus automatiquement
  useEffect(() => {
    const unreadMessages = messages.filter(msg => 
      !msg.isRead && msg.receiverId === conversationId // Supposons que vous avez l'userId
    );

    unreadMessages.forEach(msg => {
      markAsRead(msg.id);
    });
  }, [messages, conversationId, markAsRead]);

  return {
    messages,
    messagesEndRef,
    sendMessage: (content: string, replyToMessageId?: string) => 
      sendMessage(content, conversationId, replyToMessageId),
    updateMessage,
    deleteMessage,
    handleTyping,
    handleStopTyping,
    isLoading,
    error,
    scrollToBottom
  };
}
```

### `hooks/useConversations.ts`

```typescript
"use client";

import { useEffect } from "react";
import { useChat } from "@/contexts/ChatContext";

export function useConversations() {
  const {
    conversations,
    currentConversation,
    loadConversations,
    selectConversation,
    isLoading,
    error,
    typingUsers
  } = useChat();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Calculer le nombre de messages non lus par conversation
  const getUnreadCount = (conversationId: string) => {
    // Cette logique dépend de votre implémentation
    // Vous pourriez maintenir un compteur dans le state ou le calculer
    return 0;
  };

  return {
    conversations,
    currentConversation,
    selectConversation,
    isLoading,
    error,
    getUnreadCount,
    typingUsers
  };
}
```

---

## Composants UI

### `components/chat/ConversationList.tsx`

```typescript
"use client";

import React from "react";
import { useConversations } from "@/hooks/useConversations";
import { ConversationWithDetails } from "@/types/chat";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ConversationItemProps {
  conversation: ConversationWithDetails;
  isSelected: boolean;
  onClick: () => void;
  unreadCount: number;
}

function ConversationItem({ conversation, isSelected, onClick, unreadCount }: ConversationItemProps) {
  const { freelance, company, lastMessage } = conversation;
  
  // Déterminer l'autre participant (selon votre logique métier)
  const otherParticipant = freelance; // ou company selon le contexte
  
  return (
    <div
      className={`p-4 cursor-pointer border-b hover:bg-gray-50 transition-colors ${
        isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <Avatar className="w-10 h-10">
          <img
            src={otherParticipant.photoUrl || otherParticipant.logoUrl}
            alt={otherParticipant.firstname || otherParticipant.companyName}
            className="w-full h-full object-cover"
          />
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {otherParticipant.role === "freelance" 
                ? `${otherParticipant.firstname} ${otherParticipant.lastname}`
                : otherParticipant.companyName
              }
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
              {lastMessage && (
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(lastMessage.sentAt), { 
                    addSuffix: true, 
                    locale: fr 
                  })}
                </span>
              )}
            </div>
          </div>
          
          {lastMessage && (
            <p className="text-sm text-gray-600 truncate mt-1">
              {lastMessage.content}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ConversationList() {
  const { 
    conversations, 
    currentConversation, 
    selectConversation, 
    isLoading, 
    error,
    getUnreadCount 
  } = useConversations();

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>Erreur: {error}</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          Aucune conversation
        </div>
      ) : (
        conversations.map((conversation) => (
          <ConversationItem
            key={conversation.conversation.id}
            conversation={conversation}
            isSelected={currentConversation?.conversation.id === conversation.conversation.id}
            onClick={() => selectConversation(conversation.conversation.id)}
            unreadCount={getUnreadCount(conversation.conversation.id)}
          />
        ))
      )}
    </div>
  );
}
```

### `components/chat/MessageBubble.tsx`

```typescript
"use client";

import React, { useState } from "react";
import { Message } from "@/types/chat";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Reply, Edit, Trash2, Check, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
}

export function MessageBubble({ message, isOwn, onReply, onEdit, onDelete }: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const handleEdit = () => {
    if (onEdit && editContent.trim() !== message.content) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditContent(message.content);
    }
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4 group`}>
      <div className={`flex max-w-[70%] ${isOwn ? "flex-row-reverse" : "flex-row"} items-start space-x-2`}>
        {!isOwn && (
          <Avatar className="w-8 h-8 flex-shrink-0">
            <img
              src={message.sender.photoUrl || message.sender.logoUrl}
              alt={message.sender.firstname || message.sender.companyName}
              className="w-full h-full object-cover"
            />
          </Avatar>
        )}
        
        <div className={`relative ${isOwn ? "mr-2" : "ml-2"}`}>
          {/* Message parent si réponse */}
          {message.replyToMessage && (
            <div className="mb-2 p-2 bg-gray-100 rounded border-l-4 border-gray-300 text-sm">
              <p className="text-gray-600 font-medium">
                Réponse à {message.replyToMessage.senderId === message.senderId ? "vous" : "l'autre utilisateur"}
              </p>
              <p className="text-gray-800 truncate">{message.replyToMessage.content}</p>
            </div>
          )}
          
          <div
            className={`px-4 py-2 rounded-lg ${
              isOwn
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-900"
            } ${message.isPending ? "opacity-60" : ""} ${message.isError ? "bg-red-500" : ""}`}
          >
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleEdit}
                className="w-full bg-transparent resize-none border-none outline-none"
                autoFocus
                rows={editContent.split('\n').length}
              />
            ) : (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}
            
            {/* Médias */}
            {message.media && message.media.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.media.map((media) => (
                  <div key={media.id}>
                    {media.type.startsWith("image/") ? (
                      <img
                        src={media.url}
                        alt={media.description}
                        className="max-w-full h-auto rounded"
                      />
                    ) : (
                      <a
                        href={media.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-300 underline"
                      >
                        {media.description || "Fichier joint"}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Timestamp et statut */}
          <div className={`flex items-center mt-1 text-xs text-gray-500 ${isOwn ? "justify-end" : "justify-start"}`}>
            <span>
              {formatDistanceToNow(new Date(message.sentAt), { 
                addSuffix: true, 
                locale: fr 
              })}
            </span>
            {isOwn && (
              <div className="ml-2">
                {message.isPending ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
                ) : message.isError ? (
                  <span className="text-red-500">❌</span>
                ) : message.isRead ? (
                  <CheckCheck className="w-4 h-4 text-blue-500" />
                ) : (
                  <Check className="w-4 h-4 text-gray-400" />
                )}
              </div>
            )}
          </div>
          
          {/* Menu d'actions */}
          <div className={`absolute top-0 ${isOwn ? "left-0 -ml-8" : "right-0 -mr-8"} opacity-0 group-hover:opacity-100 transition-opacity`}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {onReply && (
                  <DropdownMenuItem onClick={() => onReply(message)}>
                    <Reply className="h-4 w-4 mr-2" />
                    Répondre
                  </DropdownMenuItem>
                )}
                {isOwn && onEdit && !message.isPending && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                )}
                {isOwn && onDelete && !message.isPending && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(message.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### `components/chat/MessageInput.tsx`

```typescript
"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X, Paperclip } from "lucide-react";
import { Message } from "@/types/chat";

interface MessageInputProps {
  onSendMessage: (content: string, replyToMessageId?: string) => void;
  onTyping: () => void;
  onStopTyping: () => void;
  replyToMessage?: Message;
  onCancelReply?: () => void;
}

export function MessageInput({ 
  onSendMessage, 
  onTyping, 
  onStopTyping, 
  replyToMessage,
  onCancelReply 
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (content.trim()) {
      onSendMessage(content.trim(), replyToMessage?.id);
      setContent("");
      onStopTyping();
      if (onCancelReply) onCancelReply();
      
      // Réinitialiser la hauteur du textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    
    // Gestion du typing
    onTyping();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
    }, 1000);
  };

  return (
    <div className="border-t bg-white p-4">
      {/* Message de réponse */}
      {replyToMessage && (
        <div className="mb-3 p-3 bg-gray-100 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">
                Réponse à {replyToMessage.sender.firstname || replyToMessage.sender.companyName}
              </p>
              <p className="text-sm text-gray-800 truncate mt-1">
                {replyToMessage.content}
              </p>
            </div>
            {onCancelReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelReply}
                className="ml-2 h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyPress}
            placeholder="Tapez votre message..."
            className="min-h-[40px] max-h-[120px] resize-none"
            rows={1}
          />
        </div>
        
        <div className="flex space-x-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <Button
            type="submit"
            disabled={!content.trim()}
            size="sm"
            className="h-10 w-10 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
```

---

## Pages Next.js

### `app/chat/page.tsx`

```typescript
"use client";

import { ConversationList } from "@/components/chat/ConversationList";
import { useChat } from "@/contexts/ChatContext";

export default function ChatPage() {
  const { currentConversation } = useChat();

  return (
    <div className="h-screen flex">
      {/* Liste des conversations */}
      <div className="w-1/3 border-r bg-white">
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold">Messages</h1>
        </div>
        <ConversationList />
      </div>
      
      {/* Zone de conversation */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        {currentConversation ? (
          <div className="text-center text-gray-500">
            <p>Conversation sélectionnée</p>
            <p className="text-sm">Accédez à /chat/{currentConversation.conversation.id}</p>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <p>Sélectionnez une conversation pour commencer</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### `app/chat/[conversationId]/page.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { ConversationList } from "@/components/chat/ConversationList";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { useMessages } from "@/hooks/useMessages";
import { useChat } from "@/contexts/ChatContext";
import { Message } from "@/types/chat";

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  
  const { currentConversation, selectConversation, typingUsers } = useChat();
  const {
    messages,
    messagesEndRef,
    sendMessage,
    updateMessage,
    deleteMessage,
    handleTyping,
    handleStopTyping,
    isLoading,
    error
  } = useMessages(conversationId);

  useEffect(() => {
    if (conversationId) {
      selectConversation(conversationId);
    }
  }, [conversationId, selectConversation]);

  const handleSendMessage = (content: string, replyToMessageId?: string) => {
    sendMessage(content, replyToMessageId);
    setReplyToMessage(null);
  };

  const handleReply = (message: Message) => {
    setReplyToMessage(message);
  };

  if (!currentConversation) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Chargement de la conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Liste des conversations */}
      <div className="w-1/3 border-r bg-white">
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold">Messages</h1>
        </div>
        <ConversationList />
      </div>
      
      {/* Zone de conversation */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <img
              src={currentConversation.company.logoUrl || currentConversation.freelance.photoUrl}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h2 className="font-semibold">
                {currentConversation.company.companyName || 
                 `${currentConversation.freelance.firstname} ${currentConversation.freelance.lastname}`}
              </h2>
              <p className="text-sm text-gray-500">
                {currentConversation.company.companyName ? "Entreprise" : "Freelance"}
              </p>
            </div>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500">
              <p>Erreur: {error}</p>
            </div>
          ) : (
            <>
              <MessageList
                messages={messages}
                currentUserId={""} // Remplacez par l'ID de l'utilisateur connecté
                onReply={handleReply}
                onEdit={updateMessage}
                onDelete={deleteMessage}
              />
              <TypingIndicator 
                typingUsers={typingUsers[conversationId] || []}
                currentConversation={currentConversation}
              />
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onStopTyping={handleStopTyping}
          replyToMessage={replyToMessage || undefined}
          onCancelReply={() => setReplyToMessage(null)}
        />
      </div>
    </div>
  );
}
```

---

## Configuration du Provider principal

### `app/layout.tsx`

```typescript
import { ChatProvider } from "@/components/providers/ChatProvider";
import { AuthProvider } from "@/components/providers/AuthProvider"; // Supposons que vous avez ceci

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <ChatProvider>
            {children}
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## Bonnes pratiques et conseils

### Optimisation des performances

1. **Memoization** : Utilisez `React.memo`, `useMemo`, et `useCallback` pour éviter les re-renders inutiles
2. **Virtualisation** : Pour de très longues listes de messages, considérez react-window
3. **Pagination** : Implémentez le lazy loading pour les anciens messages
4. **Debouncing** : Pour les événements de typing et la recherche

### Gestion des erreurs

```typescript
// Error boundary pour le chat
import { ErrorBoundary } from "react-error-boundary";

function ChatErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-4 text-center">
      <h2 className="text-lg font-semibold text-red-600">Une erreur est survenue</h2>
      <p className="text-gray-600">{error.message}</p>
      <button 
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Recharger
      </button>
    </div>
  );
}

// Utilisation
<ErrorBoundary FallbackComponent={ChatErrorFallback}>
  <ChatProvider>
    {children}
  </ChatProvider>
</ErrorBoundary>
```

### Tests

```typescript
// Exemple de test pour le hook useMessages
import { renderHook } from "@testing-library/react";
import { useMessages } from "@/hooks/useMessages";
import { ChatProvider } from "@/contexts/ChatContext";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChatProvider>{children}</ChatProvider>
);

test("should send message", async () => {
  const { result } = renderHook(() => useMessages("conversation-id"), { wrapper });
  
  await act(async () => {
    await result.current.sendMessage("Hello world");
  });
  
  expect(result.current.messages).toHaveLength(1);
});
```

### Sécurité

1. **Validation côté client** : Toujours valider les données avant envoi
2. **Sanitisation** : Échapper le HTML dans les messages
3. **Rate limiting** : Implémenter un throttling pour l'envoi de messages
4. **Token refresh** : Gérer l'expiration des tokens d'authentification

---

Cette implémentation vous donne une base solide pour un système de chat en temps réel avec Next.js App Router. Adaptez les composants selon vos besoins spécifiques et votre design system.