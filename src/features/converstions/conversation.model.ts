export interface Conversation {
  id: string;
  freelanceId: string;
  companyId: string;
  applicationId?: string;
  contractId?: string;
  lastMessage?: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
}

export enum ConversationEvent {
  Create = "create_conversation",
  NewMessage = "new_message",
}
