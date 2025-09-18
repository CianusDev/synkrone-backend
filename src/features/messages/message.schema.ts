import { z } from "zod";
import { MessageType } from "./message.model";

export const messageTypeEnum = z.enum(MessageType);

export const createMessageSchema = z.object({
  senderId: z.uuid(),
  receiverId: z.uuid(),
  content: z.string().min(1, "Le contenu du message ne peut pas être vide."),
  conversationId: z.uuid(),
  projectId: z.uuid().optional(),
  replyToMessageId: z.uuid().optional(),
  mediaIds: z.array(z.uuid()).optional(),
  typeMessage: messageTypeEnum.default(MessageType.TEXT),
});

export const updateMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Le contenu du message ne peut pas être vide.")
    .optional(),
  typeMessage: messageTypeEnum.optional(),
});

export const markAsReadSchema = z.object({
  messageId: z.uuid(),
  userId: z.uuid(),
});

export const createSystemMessageSchema = z.object({
  senderId: z.uuid(),
  receiverId: z.uuid(),
  content: z.string().min(1),
  typeMessage: messageTypeEnum.default(MessageType.SYSTEM),
  conversationId: z.uuid().optional(),
  projectId: z.uuid().optional(),
});
