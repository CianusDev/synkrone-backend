import { z } from "zod";

export const createMessageSchema = z.object({
  senderId: z.uuid(),
  receiverId: z.uuid(),
  content: z.string().min(1, "Le contenu du message ne peut pas être vide."),
  conversationId: z.uuid(),
  projectId: z.uuid().optional(),
  replyToMessageId: z.uuid().optional(),
});

export const markAsReadSchema = z.object({
  messageId: z.uuid(),
  userId: z.uuid(),
});
