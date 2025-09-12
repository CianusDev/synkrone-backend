import { Conversation } from "./conversation.model";
import { Message } from "../messages/message.model";
import { db } from "../../config/database";

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
  lastMessage?: Message;
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
   * Trouve une conversation existante entre un freelance et une entreprise
   * et retourne les infos des participants + dernier message
   */
  async findConversation(
    freelanceId: string,
    companyId: string,
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
         m.created_at AS last_message_created_at, m.updated_at AS last_message_updated_at
       FROM conversations c
       JOIN freelances f ON c.freelance_id = f.id
       JOIN companies co ON c.company_id = co.id
       LEFT JOIN LATERAL (
         SELECT * FROM messages
         WHERE conversation_id = c.id
         ORDER BY sent_at DESC
         LIMIT 1
       ) m ON true
       WHERE c.freelance_id = $1 AND c.company_id = $2
       LIMIT 1
     `;
    try {
      const result = await db.query(query, [freelanceId, companyId]);
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
      };
    } catch (error) {
      console.error("Error finding conversation:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Récupère toutes les conversations d'un utilisateur (freelance ou entreprise) avec détails
   */
  async getConversationsForUser(
    userId: string,
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
         m.created_at AS last_message_created_at, m.updated_at AS last_message_updated_at
       FROM conversations c
       JOIN freelances f ON c.freelance_id = f.id
       JOIN companies co ON c.company_id = co.id
       LEFT JOIN LATERAL (
         SELECT * FROM messages
         WHERE conversation_id = c.id
         ORDER BY sent_at DESC
         LIMIT 1
       ) m ON true
       WHERE c.freelance_id = $1 OR c.company_id = $1
       ORDER BY
         COALESCE(m.sent_at, c.created_at) DESC
     `;
    try {
      const result = await db.query(query, [userId]);
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
              content: row.last_message_content,
              isRead: row.last_message_is_read,
              sentAt: row.last_message_sent_at,
              projectId: row.last_message_project_id,
              conversationId: row.last_message_conversation_id,
              createdAt: row.last_message_created_at,
              updatedAt: row.last_message_updated_at,
            }
          : undefined,
      }));
    } catch (error) {
      console.error("Error fetching conversations for user:", error);
      throw new Error("Database error");
    }
  }
}
