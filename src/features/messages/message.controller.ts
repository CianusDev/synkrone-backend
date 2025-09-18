import { Request, Response } from "express";
import { MessageService } from "./message.service";
import {
  createMessageSchema,
  markAsReadSchema,
  createSystemMessageSchema,
} from "./message.schema";
import { MessageType } from "./message.model";

export class MessageController {
  private readonly service: MessageService;

  // Supprimer logiquement un message
  async deleteMessage(req: Request, res: Response) {
    try {
      const { messageId } = req.params;
      // Optionnel : vérifier que l'utilisateur est bien l'expéditeur du message
      const success = await this.service.softDeleteMessage(messageId);
      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Message non trouvé ou déjà supprimé.",
        });
      }
      res.json({ success: true });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  constructor() {
    this.service = new MessageService();
  }

  private handleError(error: unknown, res: Response) {
    // ZodError import dynamique pour éviter le cycle
    const isZodError = error && typeof error === "object" && "issues" in error;
    if (isZodError) {
      return res.status(400).json({
        success: false,
        message: "Erreur de validation",
        errors: (error as any).issues,
      });
    }
    if (typeof error === "object" && error !== null && "message" in error) {
      return res.status(400).json({
        success: false,
        message:
          (error as { message?: string }).message || "Une erreur est survenue",
      });
    }
    return res.status(400).json({
      success: false,
      message: "Une erreur est survenue",
    });
  }

  // Créer un message
  async sendMessage(req: Request & { user?: { id: string } }, res: Response) {
    try {
      const userId = req.user?.id || "null";
      console.log("req.user:", req.user);
      console.log("sendMessage userId:", userId);
      const data = createMessageSchema.parse({
        ...req.body,
        senderId: userId,
      });

      // Déterminer automatiquement le type de message selon les médias
      if (data.mediaIds && data.mediaIds.length > 0) {
        data.typeMessage = MessageType.MEDIA;
      }

      const message = await this.service.sendMessage(data);
      res.status(201).json(message);
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  // Modifier le contenu d'un message
  async updateMessage(req: Request, res: Response) {
    try {
      const { messageId } = req.params;
      const { content, typeMessage } = req.body;
      if (!content || typeof content !== "string" || content.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Le contenu ne peut pas être vide.",
        });
      }
      const success = await this.service.updateMessageContent(
        messageId,
        content,
        typeMessage,
      );
      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Message non trouvé ou déjà supprimé.",
        });
      }
      res.json({ success: true });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  // Récupérer les messages d'une conversation (avec pagination)
  async getMessagesForConversation(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const messages = await this.service.getMessagesForConversation(
        conversationId,
        limit,
        offset,
      );
      res.json(messages);
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  // Marquer un message comme lu
  async markAsRead(req: Request, res: Response) {
    try {
      const data = markAsReadSchema.parse(req.body);
      const success = await this.service.markAsRead(
        data.messageId,
        data.userId,
      );
      res.json({ success });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  // Créer un message système
  async createSystemMessage(req: Request, res: Response) {
    try {
      const data = createSystemMessageSchema.parse(req.body);
      const message = await this.service.createSystemMessage(
        data.senderId,
        data.receiverId,
        data.content,
        data.conversationId,
        data.projectId,
      );
      res.status(201).json(message);
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
}
