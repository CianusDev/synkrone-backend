export interface UserPresence {
  userId: string;
  socketId: string;
  isOnline: boolean;
  lastSeen: Date;
  connectedAt: Date;
}

export interface TypingStatus {
  userId: string;
  conversationId: string;
  isTyping: boolean;
  startedAt: Date;
}

export enum PresenceEvent {
  UserOnline = "user_online",
  UserOffline = "user_offline",
  UserTypingStart = "user_typing_start",
  UserTypingStop = "user_typing_stop",
  PresenceUpdate = "presence_update",
}

export interface PresenceUpdateData {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface TypingEventData {
  userId: string;
  conversationId: string;
  isTyping: boolean;
}
