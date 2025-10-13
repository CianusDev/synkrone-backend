import {
  ConversationRepository,
  ConversationWithDetails,
} from "./conversation.repository";
import { Conversation } from "./conversation.model";
import { io } from "../../server";
import { MessageEvent } from "../messages/message.model";

export class ConversationService {
  private readonly repository: ConversationRepository;

  constructor() {
    this.repository = new ConversationRepository();
  }

  /**
   * Crée une conversation ou retourne l'existante (évite les doublons)
   * Basé sur applicationId pour séparer les conversations par mission
   */
  async createOrGetConversation(
    data: Partial<Conversation>,
    currentUserId?: string,
  ): Promise<ConversationWithDetails> {
    let conversation: ConversationWithDetails | null = null;

    // Si applicationId est fourni, chercher par applicationId
    if (data.applicationId) {
      conversation = await this.repository.findConversationByApplication(
        data.applicationId,
        currentUserId,
      );
    } else {
      // Sinon, utiliser l'ancienne méthode (pour compatibilité)
      conversation = await this.repository.findConversation(
        data.freelanceId!,
        data.companyId!,
        currentUserId,
      );
    }

    if (!conversation) {
      try {
        // Essayer de créer une nouvelle conversation
        const created = await this.repository.createConversation(data);
        // Récupérer la conversation créée avec détails
        if (created.applicationId) {
          conversation = await this.repository.findConversationByApplication(
            created.applicationId,
            currentUserId,
          );
        } else {
          conversation = await this.repository.findConversation(
            created.freelanceId,
            created.companyId,
            currentUserId,
          );
        }
      } catch (error) {
        // Si erreur de contrainte unique, récupérer la conversation existante et la mettre à jour
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "23505" // Code erreur PostgreSQL pour violation de contrainte unique
        ) {
          console.log(
            `⚠️ Conversation existe déjà entre freelance ${data.freelanceId} et company ${data.companyId}, mise à jour de l'application_id`,
          );

          // Récupérer la conversation existante
          const existingConversation = await this.repository.findConversation(
            data.freelanceId!,
            data.companyId!,
            currentUserId,
          );

          if (existingConversation?.conversation.id && data.applicationId) {
            // Mettre à jour l'application_id de la conversation existante
            await this.repository.updateConversationApplicationId(
              existingConversation.conversation.id,
              data.applicationId,
            );

            // Récupérer la conversation mise à jour
            conversation = await this.repository.findConversationByApplication(
              data.applicationId,
              currentUserId,
            );
          } else {
            conversation = existingConversation;
          }
        } else {
          // Si autre erreur, la relancer
          throw error;
        }
      }
    }
    return conversation!;
  }

  /**
   * Trouve une conversation par applicationId
   */
  async findConversationByApplication(
    applicationId: string,
    currentUserId?: string,
  ): Promise<ConversationWithDetails | null> {
    return this.repository.findConversationByApplication(
      applicationId,
      currentUserId,
    );
  }

  /**
   * Récupère une conversation par son ID
   */
  async getConversationById(id: string): Promise<Conversation | null> {
    return this.repository.getConversationById(id);
  }

  /**
   * Trouve une conversation existante entre un freelance et une entreprise (avec détails)
   */
  async findConversation(
    freelanceId: string,
    companyId: string,
    currentUserId?: string,
  ): Promise<ConversationWithDetails | null> {
    return this.repository.findConversation(
      freelanceId,
      companyId,
      currentUserId,
    );
  }

  /**
   * Récupère toutes les conversations d'un utilisateur (avec détails, pagination supportée)
   * @param userId - ID de l'utilisateur
   * @param limit - Nombre d'éléments par page (défaut : 20)
   * @param offset - Décalage (défaut : 0)
   */
  async getConversationsForUser(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<ConversationWithDetails[]> {
    return this.repository.getConversationsForUser(userId, limit, offset);
  }

  /**
   * Met à jour le compteur de messages non lus pour une conversation
   */
  async updateUnreadCount(
    conversationId: string,
    userId: string,
  ): Promise<number> {
    return this.repository.updateUnreadCount(conversationId, userId);
  }

  /**
   * Récupère les compteurs de messages non lus pour toutes les conversations d'un utilisateur
   */
  async getUnreadCountsForUser(userId: string): Promise<Map<string, number>> {
    return this.repository.getUnreadCountsForUser(userId);
  }

  /**
   * Marque tous les messages non lus d'une conversation comme lus
   * Émet les événements socket appropriés pour synchroniser les clients
   */
  async markAllMessagesAsReadInConversation(
    conversationId: string,
    userId: string,
  ): Promise<number> {
    try {
      console.log(
        `🎯 [ConversationService] markAllMessagesAsReadInConversation called for conversation: ${conversationId}, user: ${userId}`,
      );

      // 1. Récupérer les messages avant de les marquer (pour les IDs et expéditeurs)
      const { db } = await import("../../config/database");
      const messagesQuery = `
        SELECT id, sender_id, receiver_id
        FROM messages
        WHERE conversation_id = $1
        AND receiver_id = $2
        AND is_read = false
        AND deleted_at IS NULL
      `;
      const messagesResult = await db.query(messagesQuery, [
        conversationId,
        userId,
      ]);
      const unreadMessages = messagesResult.rows;

      console.log(
        `📋 Found ${unreadMessages.length} unread messages to mark`,
        unreadMessages.map((m) => ({ id: m.id, sender: m.sender_id })),
      );

      if (unreadMessages.length === 0) {
        console.log(
          `ℹ️ No unread messages found in conversation ${conversationId} for user ${userId}`,
        );
        return 0;
      }

      // 2. Marquer les messages comme lus en base
      const markedCount =
        await this.repository.markAllMessagesAsReadInConversation(
          conversationId,
          userId,
        );

      console.log(
        `✅ ${markedCount} messages marked as read in database for conversation ${conversationId}`,
      );

      if (markedCount > 0) {
        // 3. Calculer le nouveau compteur de non-lus
        const newUnreadCount = await this.repository.updateUnreadCount(
          conversationId,
          userId,
        );

        console.log(
          `📊 New unread count for conversation ${conversationId}: ${newUnreadCount}`,
        );

        // 4. Préparer les données pour les événements
        const messageIds = unreadMessages.map((msg) => msg.id);
        const uniqueSenderIds = new Set(
          unreadMessages.map((msg) => msg.sender_id),
        );

        console.log(
          `📤 Preparing to notify - Message IDs: [${messageIds.join(", ")}]`,
        );
        console.log(
          `👥 Unique sender IDs: [${Array.from(uniqueSenderIds).join(", ")}]`,
        );

        // 5. Notifier le destinataire (celui qui a marqué comme lu)
        io.to(userId).emit("batch_messages_marked_read", {
          messageIds,
          conversationId,
          newUnreadCount,
          markedCount,
          timestamp: new Date().toISOString(),
        });

        console.log(
          `📬 Emitted 'batch_messages_marked_read' to receiver ${userId} - new count: ${newUnreadCount}`,
        );

        // 6. Notifier tous les expéditeurs uniques
        uniqueSenderIds.forEach((senderId) => {
          if (senderId !== userId) {
            // Éviter de notifier l'utilisateur qui marque
            const senderMessageIds = messageIds.filter((id) => {
              const msg = unreadMessages.find((m) => m.id === id);
              return msg && msg.sender_id === senderId;
            });

            io.to(senderId).emit("batch_messages_read", {
              messageIds: senderMessageIds,
              userId,
              conversationId,
              markedCount: senderMessageIds.length,
              timestamp: new Date().toISOString(),
            });

            console.log(
              `📬 Emitted 'batch_messages_read' to sender ${senderId} - ${senderMessageIds.length} messages [${senderMessageIds.join(", ")}]`,
            );
          } else {
            console.log(
              `⏭️ Skipping notification to ${senderId} (same as receiver)`,
            );
          }
        });

        console.log(
          `✅ [ConversationService] Successfully processed ${markedCount} messages for conversation ${conversationId}`,
        );
      }

      return markedCount;
    } catch (error) {
      console.error(
        `❌ [ConversationService] Error in markAllMessagesAsReadInConversation:`,
        error,
      );
      throw error;
    }
  }
}
