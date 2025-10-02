import { Conversation } from "./conversation.model";
import { Message } from "../messages/message.model";
import { db } from "../../config/database";
import { decrypt } from "dotenv";
import { decryptMessage } from "../../utils/encryption";

export interface ConversationWithDetails {
  conversation: Conversation;
  freelance: {
    id: string;
    firstname: string;
    lastname: string;
    photoUrl?: string;
    // autres champs utiles
  };
  company: {
    id: string;
    companyName: string;
    logoUrl?: string;
    // autres champs utiles
  };
  lastMessage?: Record<string, any> & Message;
  unreadCount?: number;
}

export class ConversationRepository {
  /**
   * Crée une nouvelle conversation
   */
  async createConversation(data: Partial<Conversation>): Promise<Conversation> {
    const query = `
      INSERT INTO conversations (
        freelance_id, company_id, application_id, contract_id
      ) VALUES (
        $1, $2, $3, $4
      ) RETURNING *`;
    const values = [
      data.freelanceId,
      data.companyId,
      data.applicationId ?? null,
      data.contractId ?? null,
    ];
    try {
      const result = await db.query(query, values);
      return result.rows[0] as Conversation;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Récupère une conversation par son ID
   */
  async getConversationById(id: string): Promise<Conversation | null> {
    const query = `SELECT * FROM conversations WHERE id = $1`;
    try {
      const result = await db.query(query, [id]);
      return result.rows[0] as Conversation;
    } catch (error) {
      console.error("Error fetching conversation by ID:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Trouve une conversation existante par applicationId
   * et retourne les infos des participants + dernier message
   */
  async findConversationByApplication(
    applicationId: string,
    currentUserId?: string,
  ): Promise<ConversationWithDetails | null> {
    const query = `
       SELECT
         c.id,
         c.freelance_id,
         c.company_id,
         c.application_id,
         c.contract_id,
         c.created_at,
         c.updated_at,
         f.id AS freelance_id, f.firstname, f.lastname, f.photo_url,
         co.id AS company_id, co.company_name, co.logo_url,
         m.id AS last_message_id, m.sender_id AS last_message_sender_id, m.receiver_id AS last_message_receiver_id,
         m.content AS last_message_content, m.is_read AS last_message_is_read,
         m.sent_at AS last_message_sent_at, m.project_id AS last_message_project_id, m.conversation_id AS last_message_conversation_id,
         m.created_at AS last_message_created_at, m.updated_at AS last_message_updated_at,
         COALESCE(unread.count, 0) AS unread_count
       FROM conversations c
       JOIN freelances f ON c.freelance_id = f.id
       JOIN companies co ON c.company_id = co.id
       LEFT JOIN LATERAL (
         SELECT * FROM messages
         WHERE conversation_id = c.id
         AND deleted_at IS NULL
         ORDER BY sent_at DESC
         LIMIT 1
       ) m ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*) as count FROM messages
         WHERE conversation_id = c.id
         AND receiver_id = $2
         AND is_read = false
         AND deleted_at IS NULL
       ) unread ON true
       WHERE c.application_id = $1
       LIMIT 1
     `;
    try {
      const result = await db.query(query, [
        applicationId,
        currentUserId || null,
      ]);
      const row = result.rows[0];
      if (!row) return null;
      return {
        conversation: {
          id: row.id,
          freelanceId: row.freelance_id,
          companyId: row.company_id,
          applicationId: row.application_id,
          contractId: row.contract_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
        freelance: {
          id: row.freelance_id,
          firstname: row.firstname,
          lastname: row.lastname,
          photoUrl: row.photo_url,
        },
        company: {
          id: row.company_id,
          companyName: row.company_name,
          logoUrl: row.logo_url,
        },
        lastMessage: row.last_message_id
          ? {
              id: row.last_message_id,
              senderId: row.last_message_sender_id,
              receiverId: row.last_message_receiver_id,
              content: row.last_message_content,
              isRead: row.last_message_is_read,
              sentAt: row.last_message_sent_at,
              projectId: row.last_message_project_id,
              conversationId: row.last_message_conversation_id,
              createdAt: row.last_message_created_at,
              updatedAt: row.last_message_updated_at,
            }
          : undefined,
        unreadCount: parseInt(row.unread_count) || 0,
      };
    } catch (error) {
      console.error("Error finding conversation by application:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Trouve une conversation existante entre un freelance et une entreprise
   * et retourne les infos des participants + dernier message
   */
  async findConversation(
    freelanceId: string,
    companyId: string,
    currentUserId?: string,
  ): Promise<ConversationWithDetails | null> {
    const query = `
       SELECT
         c.id,
         c.freelance_id,
         c.company_id,
         c.application_id,
         c.contract_id,
         c.created_at,
         c.updated_at,
         f.id AS freelance_id, f.firstname, f.lastname, f.photo_url,
         co.id AS company_id, co.company_name, co.logo_url,
         m.id AS last_message_id, m.sender_id AS last_message_sender_id, m.receiver_id AS last_message_receiver_id,
         m.content AS last_message_content, m.is_read AS last_message_is_read,
         m.sent_at AS last_message_sent_at, m.project_id AS last_message_project_id, m.conversation_id AS last_message_conversation_id,
         m.created_at AS last_message_created_at, m.updated_at AS last_message_updated_at,
         COALESCE(unread.count, 0) AS unread_count
       FROM conversations c
       JOIN freelances f ON c.freelance_id = f.id
       JOIN companies co ON c.company_id = co.id
       LEFT JOIN LATERAL (
         SELECT * FROM messages
         WHERE conversation_id = c.id
         AND deleted_at IS NULL
         ORDER BY sent_at DESC
         LIMIT 1
       ) m ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*) as count FROM messages
         WHERE conversation_id = c.id
         AND receiver_id = $3
         AND is_read = false
         AND deleted_at IS NULL
       ) unread ON true
       WHERE c.freelance_id = $1 AND c.company_id = $2
       LIMIT 1
     `;
    try {
      const result = await db.query(query, [
        freelanceId,
        companyId,
        currentUserId || null,
      ]);
      const row = result.rows[0];
      if (!row) return null;
      return {
        conversation: {
          id: row.id,
          freelanceId: row.freelance_id,
          companyId: row.company_id,
          applicationId: row.application_id,
          contractId: row.contract_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
        freelance: {
          id: row.freelance_id,
          firstname: row.firstname,
          lastname: row.lastname,
          photoUrl: row.photo_url,
        },
        company: {
          id: row.company_id,
          companyName: row.company_name,
          logoUrl: row.logo_url,
        },
        lastMessage: row.last_message_id
          ? {
              id: row.last_message_id,
              senderId: row.last_message_sender_id,
              receiverId: row.last_message_receiver_id,
              content: row.last_message_content,
              isRead: row.last_message_is_read,
              sentAt: row.last_message_sent_at,
              projectId: row.last_message_project_id,
              conversationId: row.last_message_conversation_id,
              createdAt: row.last_message_created_at,
              updatedAt: row.last_message_updated_at,
            }
          : undefined,
        unreadCount: parseInt(row.unread_count) || 0,
      };
    } catch (error) {
      console.error("Error finding conversation:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Récupère toutes les conversations d'un utilisateur (freelance ou entreprise) avec détails et pagination
   */
  async getConversationsForUser(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<ConversationWithDetails[]> {
    const query = `
       SELECT
         c.id,
         c.freelance_id,
         c.company_id,
         c.application_id,
         c.contract_id,
         c.created_at,
         c.updated_at,
         f.id AS freelance_id, f.firstname, f.lastname, f.photo_url,
         co.id AS company_id, co.company_name, co.logo_url,
         m.id AS last_message_id, m.sender_id AS last_message_sender_id, m.receiver_id AS last_message_receiver_id,
         m.content AS last_message_content, m.is_read AS last_message_is_read,
         m.sent_at AS last_message_sent_at, m.project_id AS last_message_project_id, m.conversation_id AS last_message_conversation_id,
         m.created_at AS last_message_created_at, m.updated_at AS last_message_updated_at,
         COALESCE(unread.count, 0) AS unread_count
       FROM conversations c
       JOIN freelances f ON c.freelance_id = f.id
       JOIN companies co ON c.company_id = co.id
       LEFT JOIN LATERAL (
         SELECT * FROM messages
         WHERE conversation_id = c.id
         AND deleted_at IS NULL
         ORDER BY sent_at DESC
         LIMIT 1
       ) m ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*) as count FROM messages
         WHERE conversation_id = c.id
         AND receiver_id = $1
         AND is_read = false
         AND deleted_at IS NULL
       ) unread ON true
       WHERE c.freelance_id = $1 OR c.company_id = $1
       ORDER BY
         COALESCE(m.sent_at, c.created_at) DESC
       LIMIT $2 OFFSET $3
     `;
    try {
      const result = await db.query(query, [userId, limit, offset]);
      return result.rows.map((row) => ({
        conversation: {
          id: row.id,
          freelanceId: row.freelance_id,
          companyId: row.company_id,
          applicationId: row.application_id,
          contractId: row.contract_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
        freelance: {
          id: row.freelance_id,
          firstname: row.firstname,
          lastname: row.lastname,
          photoUrl: row.photo_url,
        },
        company: {
          id: row.company_id,
          companyName: row.company_name,
          logoUrl: row.logo_url,
        },
        lastMessage: row.last_message_id
          ? {
              id: row.last_message_id,
              senderId: row.last_message_sender_id,
              receiverId: row.last_message_receiver_id,
              content:
                decryptMessage(row.last_message_content) ||
                "Erreur de déchiffrement",
              isRead: row.last_message_is_read,
              sentAt: row.last_message_sent_at,
              projectId: row.last_message_project_id,
              conversationId: row.last_message_conversation_id,
              createdAt: row.last_message_created_at,
              updatedAt: row.last_message_updated_at,
            }
          : undefined,
        unreadCount: parseInt(row.unread_count) || 0,
      }));
    } catch (error) {
      console.error("Error fetching conversations for user:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Met à jour le compteur de messages non lus pour une conversation spécifique
   * Cette méthode peut être appelée après qu'un message a été marqué comme lu
   */
  async updateUnreadCount(
    conversationId: string,
    userId: string,
  ): Promise<number> {
    const query = `
      SELECT COUNT(*) as count FROM messages
      WHERE conversation_id = $1
      AND receiver_id = $2
      AND is_read = false
      AND deleted_at IS NULL
    `;
    try {
      const result = await db.query(query, [conversationId, userId]);
      return parseInt(result.rows[0].count) || 0;
    } catch (error) {
      console.error("Error updating unread count:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Récupère le compteur de messages non lus pour toutes les conversations d'un utilisateur
   */
  async getUnreadCountsForUser(userId: string): Promise<Map<string, number>> {
    const query = `
      SELECT
        conversation_id,
        COUNT(*) as count
      FROM messages
      WHERE receiver_id = $1
      AND is_read = false
      AND deleted_at IS NULL
      GROUP BY conversation_id
    `;
    try {
      const result = await db.query(query, [userId]);
      const counts = new Map<string, number>();
      result.rows.forEach((row) => {
        counts.set(row.conversation_id, parseInt(row.count) || 0);
      });
      return counts;
    } catch (error) {
      console.error("Error fetching unread counts for user:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Marque tous les messages non lus d'une conversation comme lus pour un utilisateur
   */
  async markAllMessagesAsReadInConversation(
    conversationId: string,
    userId: string,
  ): Promise<number> {
    const query = `
      UPDATE messages
      SET is_read = true
      WHERE conversation_id = $1
      AND receiver_id = $2
      AND is_read = false
      AND deleted_at IS NULL
      RETURNING id
    `;
    try {
      const result = await db.query(query, [conversationId, userId]);
      return result.rowCount || 0;
    } catch (error) {
      console.error(
        "Error marking all messages as read in conversation:",
        error,
      );
      throw new Error("Database error");
    }
  }
}
