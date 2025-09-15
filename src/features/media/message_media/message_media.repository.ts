import { db } from "../../../config/database";
import { MessageMedia } from "./message_media.model";

/**
 * Repository pour gérer l'association entre les messages et les médias.
 */
export class MessageMediaRepository {
  /**
   * Ajoute un média à un message.
   * @param messageId - L'ID du message
   * @param mediaId - L'ID du média
   * @returns L'association créée
   */
  async addMediaToMessage(
    messageId: string,
    mediaId: string,
  ): Promise<MessageMedia> {
    const query = `
      INSERT INTO message_media (message_id, media_id)
      VALUES ($1, $2)
      RETURNING message_id, media_id, NOW() as created_at
    `;
    const result = await db.query(query, [messageId, mediaId]);
    return {
      messageId: result.rows[0].message_id,
      mediaId: result.rows[0].media_id,
      createdAt: result.rows[0].created_at,
    };
  }

  /**
   * Vérifie si un message existe
   * @param messageId - L'ID du message
   * @returns true si le message existe, false sinon
   */
  async messageExists(messageId: string): Promise<boolean> {
    const query = `SELECT 1 FROM messages WHERE id = $1 LIMIT 1`;
    const result = await db.query(query, [messageId]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Vérifie si un média existe
   * @param mediaId - L'ID du média
   * @returns true si le média existe, false sinon
   */
  async mediaExists(mediaId: string): Promise<boolean> {
    const query = `SELECT 1 FROM media WHERE id = $1 LIMIT 1`;
    const result = await db.query(query, [mediaId]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Vérifie si l'association message/media existe déjà
   * @param messageId - L'ID du message
   * @param mediaId - L'ID du média
   * @returns true si l'association existe, false sinon
   */
  async isMediaLinkedToMessage(
    messageId: string,
    mediaId: string,
  ): Promise<boolean> {
    const query = `SELECT 1 FROM message_media WHERE message_id = $1 AND media_id = $2 LIMIT 1`;
    const result = await db.query(query, [messageId, mediaId]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Récupère tous les médias associés à un message.
   * @param messageId - L'ID du message
   * @returns Tableau des associations message/media
   */
  async getMediaForMessage(messageId: string): Promise<MessageMedia[]> {
    const query = `
      SELECT message_id, media_id, created_at, deleted_at
      FROM message_media
      WHERE message_id = $1 AND deleted_at IS NULL
    `;
    const result = await db.query(query, [messageId]);
    return result.rows.map((row) => ({
      messageId: row.message_id,
      mediaId: row.media_id,
      createdAt: row.created_at,
      deletedAt: row.deleted_at,
    }));
  }

  /**
   * Supprime logiquement l'association entre un message et un média.
   * @param messageId - L'ID du message
   * @param mediaId - L'ID du média
   * @returns true si suppression réussie, false sinon
   */
  async removeMediaFromMessage(
    messageId: string,
    mediaId: string,
  ): Promise<boolean> {
    const query = `
      UPDATE message_media
      SET deleted_at = NOW()
      WHERE message_id = $1 AND media_id = $2 AND deleted_at IS NULL
      RETURNING *;
    `;
    const result = await db.query(query, [messageId, mediaId]);
    return (result.rowCount ?? 0) > 0;
  }
}
