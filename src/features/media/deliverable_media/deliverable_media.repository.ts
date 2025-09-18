import { db } from "../../../config/database";
import { DeliverableMedia } from "./deliverable_media.model";

export class DeliverableMediaRepository {
  private readonly table = "deliverable_media";

  /**
   * Crée une liaison entre un livrable et un média.
   */
  async createDeliverableMedia(
    data: DeliverableMedia,
  ): Promise<DeliverableMedia> {
    const query = `
      INSERT INTO ${this.table} (deliverable_id, media_id, deleted_at, created_at)
      VALUES ($1, $2, $3, $4)
      RETURNING deliverable_id, media_id, deleted_at, created_at
    `;
    const values = [
      data.deliverableId,
      data.mediaId,
      data.deletedAt ?? null,
      data.createdAt,
    ];
    const result = await db.query(query, values);
    return this.mapRowToDeliverableMedia(result.rows[0]);
  }

  /**
   * Récupère une liaison livrable-média par ses deux IDs.
   */
  async getDeliverableMedia(
    deliverableId: string,
    mediaId: string,
  ): Promise<DeliverableMedia | null> {
    const query = `
      SELECT deliverable_id, media_id, deleted_at, created_at
      FROM ${this.table}
      WHERE deliverable_id = $1 AND media_id = $2 AND deleted_at IS NULL
      LIMIT 1
    `;
    const result = await db.query(query, [deliverableId, mediaId]);
    if (result.rows.length === 0) return null;
    return this.mapRowToDeliverableMedia(result.rows[0]);
  }

  /**
   * Récupère tous les médias associés à un livrable (non supprimés).
   */
  async getAllByDeliverable(
    deliverableId: string,
  ): Promise<DeliverableMedia[]> {
    const query = `
      SELECT deliverable_id, media_id, deleted_at, created_at
      FROM ${this.table}
      WHERE deliverable_id = $1 AND deleted_at IS NULL
    `;
    const result = await db.query(query, [deliverableId]);
    return result.rows.map(this.mapRowToDeliverableMedia);
  }

  /**
   * Soft delete : marque la liaison comme supprimée (deleted_at).
   */
  async deleteDeliverableMedia(
    deliverableId: string,
    mediaId: string,
  ): Promise<boolean> {
    const query = `
      UPDATE ${this.table}
      SET deleted_at = NOW()
      WHERE deliverable_id = $1 AND media_id = $2 AND deleted_at IS NULL
    `;
    const result = await db.query(query, [deliverableId, mediaId]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Helper pour transformer une ligne SQL en objet DeliverableMedia.
   */
  private mapRowToDeliverableMedia(row: any): DeliverableMedia {
    return {
      deliverableId: row.deliverable_id,
      mediaId: row.media_id,
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    };
  }
}
