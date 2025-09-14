import { MessageRepository } from "./message.repository";
import { Message, MessageEvent, MessageWithUserInfo } from "./message.model";
import { io } from "../../server";
import { MessageMediaService } from "../media/message_media/message_media.service";
import { ConversationService } from "../converstions/conversation.service";
import { db } from "../../config/database";
import { Media } from "../media/media.model";

export class MessageService {
  private readonly repository: MessageRepository;
  private readonly messageMediaService: MessageMediaService;
  private readonly conversationService: ConversationService;

  constructor() {
    this.repository = new MessageRepository();
    this.messageMediaService = new MessageMediaService();
    this.conversationService = new ConversationService();
  }

  /**
   * Crée un message, le sauvegarde en base, associe les médias si présents et le transmet en realtime au destinataire
   */
  async sendMessage(
    data: Partial<Message> & { mediaIds?: string[] },
  ): Promise<MessageWithUserInfo> {
    const message = await this.repository.createMessage(data);

    // Associer les médias si fournis
    let media: Media[] = [];
    if (data.mediaIds && Array.isArray(data.mediaIds)) {
      for (const mediaId of data.mediaIds) {
        try {
          await this.messageMediaService.addMediaToMessage(message.id, mediaId);
        } catch (err) {
          // Ignore les erreurs d'association individuelle, mais log
          console.error("Erreur association média:", err);
        }
      }
      media = await this.getMediaForMessage(message.id);
    } else {
      media = await this.getMediaForMessage(message.id);
    }

    console.log("Media associés au message:", media);
    // Récupérer les infos utilisateur pour sender et receiver
    const sender = await this.repository.getUserInfo(
      // data.senderId ??
      message.senderId,
    );
    const receiver = await this.repository.getUserInfo(
      // data.receiverId ??
      message.receiverId,
    );

    // Ensure sender and receiver are not null
    if (!sender) {
      throw new Error(
        `Sender user info not found for id: ${message.senderId} ${data.senderId}`,
      );
    }
    if (!receiver) {
      throw new Error(
        `Receiver user info not found for id: ${message.receiverId} ${data.receiverId}`,
      );
    }

    // Emit realtime au destinataire (room = receiverId)
    io.to(message.receiverId).emit(MessageEvent.Receive, {
      ...message,
      media,
      sender,
      receiver,
    });

    // Optionnel : Emit au sender pour accusé d’envoi
    io.to(message.senderId).emit(MessageEvent.Send, {
      ...message,
      media,
      sender,
      receiver,
    });

    return { ...message, media, sender, receiver };
  }

  /**
   * Récupère un message par son ID et enrichit avec les médias associés
   */
  async getMessageById(id: string): Promise<MessageWithUserInfo | null> {
    const message = await this.repository.getMessageById(id);
    if (!message) return null;
    const media = await this.getMediaForMessage(message.id);
    const sender = await this.repository.getUserInfo(message.senderId);
    const receiver = await this.repository.getUserInfo(message.receiverId);

    // Ensure sender and receiver are not null to satisfy MessageWithUserInfo type
    if (!sender) {
      throw new Error(`Sender user info not found for id: ${message.senderId}`);
    }
    if (!receiver) {
      throw new Error(
        `Receiver user info not found for id: ${message.receiverId}`,
      );
    }

    return { ...message, media, sender, receiver };
  }

  /**
   * Récupère les médias associés à un message, avec toutes les infos du média
   */
  async getMediaForMessage(messageId: string): Promise<Media[]> {
    const links = await this.messageMediaService.getMediaForMessage(messageId);
    if (!links || links.length === 0) return [];
    const mediaInfos: Media[] = [];
    for (const link of links) {
      const result = await db.query(
        "SELECT id, url, type, description, uploaded_at FROM media WHERE id = $1",
        [link.mediaId],
      );
      if (result.rows.length > 0) {
        mediaInfos.push({
          id: result.rows[0].id,
          url: result.rows[0].url,
          type: result.rows[0].type,
          description: result.rows[0].description,
          uploadedAt: result.rows[0].uploaded_at,
        });
      }
    }
    return mediaInfos;
  }

  /**
   * Récupère les messages d'une conversation avec pagination et infos utilisateurs + médias associés
   * @param conversationId - L'ID de la conversation
   * @param limit - Nombre de messages à récupérer (défaut 20)
   * @param offset - Décalage pour la pagination (défaut 0)
   */
  async getMessagesForConversation(
    conversationId: string,
    limit = 20,
    offset = 0,
  ): Promise<MessageWithUserInfo[]> {
    const messages = await this.repository.getMessagesForConversation(
      conversationId,
      limit,
      offset,
    );

    // Le repository retourne déjà les infos utilisateur, on enrichit seulement avec les médias
    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        const media = await this.getMediaForMessage(msg.id);
        return { ...msg, media };
      }),
    );
    return enrichedMessages;
  }

  /**
   * Marque un message comme lu et notifie l'expéditeur en realtime
   */
  async markAsRead(messageId: string, userId: string): Promise<boolean> {
    const success = await this.repository.markAsRead(messageId, userId);
    if (success) {
      const message = await this.repository.getMessageById(messageId);
      if (message) {
        // Mettre à jour le compteur de messages non lus pour cette conversation
        try {
          const newUnreadCount =
            await this.conversationService.updateUnreadCount(
              message.conversationId || "null",
              userId,
            );

          // Notifier l'expéditeur que son message a été lu
          io.to(message.senderId).emit(MessageEvent.Read, {
            messageId,
            userId,
          });

          // Notifier le destinataire pour synchroniser les compteurs avec le nouveau count
          io.to(userId).emit("message_marked_read", {
            messageId,
            conversationId: message.conversationId,
            newUnreadCount,
          });
        } catch (error) {
          console.error("Erreur lors de la mise à jour du compteur:", error);
          // Continuer même si la mise à jour du compteur échoue
          io.to(message.senderId).emit(MessageEvent.Read, {
            messageId,
            userId,
          });
          io.to(userId).emit("message_marked_read", {
            messageId,
            conversationId: message.conversationId,
          });
        }
      }
    }
    return success;
  }

  /**
   * Modifie le contenu d'un message (soft update)
   * Vérifie que seul l'expéditeur peut modifier le message.
   * @param messageId - L'ID du message à modifier
   * @param newContent - Le nouveau contenu du message
   * @param userId - L'ID de l'utilisateur qui demande la modification
   * @returns true si modification réussie, false sinon
   */
  async updateMessageContent(
    messageId: string,
    newContent: string,
    userId?: string, // optionnel, à passer depuis le controller
  ): Promise<boolean> {
    const message = await this.repository.getMessageById(messageId);
    if (!message || message.deletedAt) {
      return false;
    }
    if (userId && message.senderId !== userId) {
      throw new Error("Seul l'expéditeur peut modifier ce message.");
    }
    const success = await this.repository.updateMessageContent(
      messageId,
      newContent,
    );
    if (success) {
      // Emit socket event pour modification
      io.to(message.receiverId).emit("update_message", {
        messageId,
        newContent,
      });
      io.to(message.senderId).emit("update_message", { messageId, newContent });
    }
    return success;
  }

  /**
   * Supprime logiquement un message (soft delete)
   * Vérifie que seul l'expéditeur peut supprimer le message.
   * @param messageId - L'ID du message à supprimer
   * @param userId - L'ID de l'utilisateur qui demande la suppression
   * @returns true si suppression réussie, false sinon
   */
  async softDeleteMessage(
    messageId: string,
    userId?: string,
  ): Promise<boolean> {
    const message = await this.repository.getMessageById(messageId);
    if (!message || message.deletedAt) {
      return false;
    }
    if (userId && message.senderId !== userId) {
      throw new Error("Seul l'expéditeur peut supprimer ce message.");
    }
    const success = await this.repository.softDeleteMessage(messageId);
    if (success) {
      // Emit socket event pour suppression
      io.to(message.receiverId).emit("delete_message", { messageId });
      io.to(message.senderId).emit("delete_message", { messageId });
    }
    return success;
  }
}
