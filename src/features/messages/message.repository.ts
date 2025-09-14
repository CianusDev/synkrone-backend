import { Message, MessageWithUserInfo, UserInfo } from "./message.model";
import { db } from "../../config/database";

export class MessageRepository {
  /**
   * Crée un nouveau message dans la base de données
   * @param message - Les données du message à créer
   * @returns Le message créé
   */
  async createMessage(message: Partial<Message>): Promise<Message> {
    const query = `
      INSERT INTO messages (
        sender_id, receiver_id, content, is_read, sent_at, project_id, reply_to_message_id, conversation_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      ) RETURNING
        id,
        sender_id AS "senderId",
        receiver_id AS "receiverId",
        content,
        is_read AS "isRead",
        sent_at AS "sentAt",
        project_id AS "projectId",
        reply_to_message_id AS "replyToMessageId",
        conversation_id AS "conversationId",
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        deleted_at AS "deletedAt"
    `;
    const values = [
      message.senderId,
      message.receiverId,
      message.content,
      message.isRead ?? false,
      message.sentAt ?? new Date(),
      message.projectId ?? null,
      message.replyToMessageId ?? null,
      message.conversationId ?? null,
    ];
    try {
      const result = await db.query(query, values);
      return result.rows[0] as Message;
    } catch (error) {
      console.error("Error creating message:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Récupère un message par son ID
   * @param id - L'ID du message à récupérer
   * @returns Le message correspondant ou null si non trouvé
   */
  async getMessageById(id: string): Promise<Message | null> {
    const query = `
      SELECT
        id,
        sender_id AS "senderId",
        receiver_id AS "receiverId",
        content,
        is_read AS "isRead",
        sent_at AS "sentAt",
        project_id AS "projectId",
        reply_to_message_id AS "replyToMessageId",
        conversation_id AS "conversationId",
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        deleted_at AS "deletedAt"
      FROM messages
      WHERE id = $1
    `;
    try {
      const result = await db.query(query, [id]);
      return result.rows[0] as Message;
    } catch (error) {
      console.error("Error fetching message by ID:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Récupère les messages d'une conversation avec pagination
   * @param conversationId - L'ID de la conversation
   * @param limit - Nombre de messages à récupérer (défaut 20)
   * @param offset - Décalage pour la pagination (défaut 0)
   * @returns Tableau de messages
   */
  async getMessagesForConversation(
    conversationId: string,
    limit = 20,
    offset = 0,
  ): Promise<MessageWithUserInfo[]> {
    // Pagination alignée frontend/backend : offset = nombre de messages déjà chargés
    const query = `
      SELECT
        m.id,
        m.sender_id AS "senderId",
        m.receiver_id AS "receiverId",
        m.content,
        m.is_read AS "isRead",
        m.sent_at AS "sentAt",
        m.project_id AS "projectId",
        m.reply_to_message_id AS "replyToMessageId",
        m.conversation_id AS "conversationId",
        m.created_at AS "createdAt",
        m.updated_at AS "updatedAt",
        m.deleted_at AS "deletedAt",
        -- Infos sender
        fs.id AS sender_freelance_id, fs.firstname AS sender_firstname, fs.lastname AS sender_lastname, fs.photo_url AS sender_photo_url,
        cs.id AS sender_company_id, cs.company_name AS sender_company_name, cs.logo_url AS sender_logo_url,
        -- Infos receiver
        fr.id AS receiver_freelance_id, fr.firstname AS receiver_firstname, fr.lastname AS receiver_lastname, fr.photo_url AS receiver_photo_url,
        cr.id AS receiver_company_id, cr.company_name AS receiver_company_name, cr.logo_url AS receiver_logo_url
      FROM messages m
      LEFT JOIN freelances fs ON m.sender_id = fs.id
      LEFT JOIN companies cs ON m.sender_id = cs.id
      LEFT JOIN freelances fr ON m.receiver_id = fr.id
      LEFT JOIN companies cr ON m.receiver_id = cr.id
      WHERE m.conversation_id = $1
      AND m.deleted_at IS NULL
      ORDER BY m.sent_at DESC
      LIMIT $2 OFFSET $3
    `;
    try {
      const result = await db.query(query, [
        conversationId,
        limit,
        offset, // offset = nombre de messages déjà chargés
      ]);
      // On reverse le tableau pour afficher du plus ancien au plus récent
      const rows = result.rows.reverse();
      return Promise.all(
        rows.map(async (row) => {
          // Build sender UserInfo
          let sender: UserInfo;
          if (row.sender_freelance_id) {
            sender = {
              id: row.sender_freelance_id,
              firstname: row.sender_firstname,
              lastname: row.sender_lastname,
              photoUrl: row.sender_photo_url,
              role: "freelance",
            };
          } else if (row.sender_company_id) {
            sender = {
              id: row.sender_company_id,
              companyName: row.sender_company_name,
              logoUrl: row.sender_logo_url,
              role: "company",
            };
          } else {
            // fallback: minimal UserInfo if not found
            sender = {
              id: row.senderId,
              role: "freelance", // default role, adjust if needed
            };
          }

          // Build receiver UserInfo
          let receiver: UserInfo;
          if (row.receiver_freelance_id) {
            receiver = {
              id: row.receiver_freelance_id,
              firstname: row.receiver_firstname,
              lastname: row.receiver_lastname,
              photoUrl: row.receiver_photo_url,
              role: "freelance",
            };
          } else if (row.receiver_company_id) {
            receiver = {
              id: row.receiver_company_id,
              companyName: row.receiver_company_name,
              logoUrl: row.receiver_logo_url,
              role: "company",
            };
          } else {
            receiver = {
              id: row.receiverId,
              role: "freelance", // default role, adjust if needed
            };
          }

          // Enrichir avec le contenu du message parent si replyToMessageId présent
          let replyToMessage = undefined;
          if (row.replyToMessageId) {
            try {
              const parentQuery = `
                SELECT
                  id,
                  content,
                  sender_id AS "senderId",
                  created_at AS "createdAt"
                FROM messages
                WHERE id = $1
              `;
              const parentResult = await db.query(parentQuery, [
                row.replyToMessageId,
              ]);
              if (parentResult.rows.length > 0) {
                replyToMessage = {
                  id: parentResult.rows[0].id,
                  content: parentResult.rows[0].content,
                  senderId: parentResult.rows[0].senderId,
                  createdAt: parentResult.rows[0].createdAt,
                };
              }
            } catch (err) {
              // Ignore error, replyToMessage stays undefined
            }
          }

          // Media: If you want to fetch media, you need a separate query or join. Here, we leave it undefined.
          return {
            id: row.id,
            senderId: row.senderId,
            receiverId: row.receiverId,
            content: row.content,
            isRead: row.isRead,
            sentAt: row.sentAt,
            projectId: row.projectId,
            replyToMessageId: row.replyToMessageId,
            replyToMessage, // <-- Ajouté : contenu du message parent
            conversationId: row.conversationId,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            sender,
            receiver,
            media: undefined,
          };
        }),
      );
    } catch (error) {
      console.error("Error fetching messages for conversation:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Récupère les infos utilisateur pour un id (freelance ou company)
   */
  async getUserInfo(userId: string): Promise<UserInfo | null> {
    // Vérifie d'abord dans freelances
    const freelanceQuery = `SELECT id, firstname, lastname, photo_url FROM freelances WHERE id = $1`;
    const freelanceResult = await db.query(freelanceQuery, [userId]);
    if (freelanceResult.rows.length > 0) {
      const f = freelanceResult.rows[0];
      return {
        id: f.id,
        firstname: f.firstname,
        lastname: f.lastname,
        photoUrl: f.photo_url,
        role: "freelance",
      };
    }
    // Sinon, cherche dans companies
    const companyQuery = `SELECT id, company_name, logo_url FROM companies WHERE id = $1`;
    const companyResult = await db.query(companyQuery, [userId]);
    if (companyResult.rows.length > 0) {
      const c = companyResult.rows[0];
      return {
        id: c.id,
        companyName: c.company_name,
        logoUrl: c.logo_url,
        role: "company",
      };
    }
    return null;
  }

  /**
   * Marque un message comme lu
   * @param messageId - L'ID du message à marquer comme lu
   * @param userId - L'ID du destinataire (sécurité)
   * @returns true si succès, false sinon
   */
  async markAsRead(messageId: string, userId: string): Promise<boolean> {
    const query = `
      UPDATE messages SET is_read = true, updated_at = NOW()
      WHERE id = $1 AND receiver_id = $2 RETURNING *`;
    try {
      const result = await db.query(query, [messageId, userId]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error marking message as read:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Modifie le contenu d'un message (soft update)
   * @param messageId - L'ID du message à modifier
   * @param newContent - Le nouveau contenu du message
   * @returns true si modification réussie, false sinon
   */
  async updateMessageContent(
    messageId: string,
    newContent: string,
  ): Promise<boolean> {
    const query = `
       UPDATE messages
       SET content = $2, updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *;
     `;
    try {
      const result = await db.query(query, [messageId, newContent]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error updating message content:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Supprime logiquement un message (soft delete)
   * @param messageId - L'ID du message à supprimer
   * @returns true si suppression réussie, false sinon
   */
  async softDeleteMessage(messageId: string): Promise<boolean> {
    const query = `
       UPDATE messages
       SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *;
     `;
    try {
      const result = await db.query(query, [messageId]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error soft deleting message:", error);
      throw new Error("Database error");
    }
  }
}
