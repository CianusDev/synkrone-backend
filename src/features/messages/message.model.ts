import { Media } from "../media/media.model";

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  typeMessage?: MessageType;
  isRead: boolean;
  sentAt: Date;
  projectId?: string;
  replyToMessageId?: string;
  conversationId?: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export enum MessageType {
  TEXT = "text",
  MEDIA = "media",
  SYSTEM = "system",
}

export interface UserInfo {
  id: string;
  firstname?: string;
  lastname?: string;
  companyName?: string;
  photoUrl?: string;
  logoUrl?: string;
  role: "freelance" | "company";
}

export interface MessageWithUserInfo extends Message {
  sender: UserInfo;
  receiver: UserInfo;
  media?: Media[];
}

export enum MessageEvent {
  Send = "send_message",
  Receive = "receive_message",
  Read = "read_message",
}
