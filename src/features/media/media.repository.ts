import { query } from "../../config/database";
import { Media, MediaType } from "./media.model";

export class MediaRepository {
  /**
   * Crée un média
   */
  async createMedia(data: {
    url: string;
    type: MediaType;
    uploadedBy?: string;
    description?: string;
    size?: number;
  }): Promise<Media> {
    const result = await query<Media>(
      `INSERT INTO media (url, type, uploaded_by, description, size)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, url, type, uploaded_by AS "uploadedBy", uploaded_at AS "uploadedAt", description`,
      [
        data.url,
        data.type,
        data.uploadedBy ?? null,
        data.description ?? null,
        data.size ?? null,
      ],
    );
    return result.rows[0];
  }

  /**
   * Récupère un média par son id
   */
  async getMediaById(id: string): Promise<Media | null> {
    const result = await query<Media>(
      `SELECT id, url, type, uploaded_by AS "uploadedBy", uploaded_at AS "uploadedAt", description, size
       FROM media WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  /**
   * Met à jour un média
   */
  async updateMedia(
    id: string,
    data: Partial<Omit<Media, "id" | "uploadedAt">>,
  ): Promise<Media | null> {
    const fields = [];
    const values = [];
    let idx = 2;

    if (data.url !== undefined) {
      fields.push(`url = $${idx++}`);
      values.push(data.url);
    }
    if (data.type !== undefined) {
      fields.push(`type = $${idx++}`);
      values.push(data.type);
    }
    if (data.uploadedBy !== undefined) {
      fields.push(`uploaded_by = $${idx++}`);
      values.push(data.uploadedBy);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(data.description);
    }

    if (data.size !== undefined) {
      fields.push(`size = $${idx++}`);
      values.push(data.size);
    }
    if (fields.length === 0) return this.getMediaById(id);

    const queryText = `
      UPDATE media SET ${fields.join(", ")}
      WHERE id = $1
      RETURNING id, url, type, uploaded_by AS "uploadedBy", uploaded_at AS "uploadedAt", description, size
    `;
    const result = await query<Media>(queryText, [id, ...values]);
    return result.rows[0] ?? null;
  }

  /**
   * Supprime un média
   */
  async deleteMedia(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM media WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Liste les médias (optionnel: filtrer par type ou uploader)
   */
  async listMedia(params?: {
    type?: MediaType;
    uploadedBy?: string;
  }): Promise<Media[]> {
    let queryText = `SELECT id, url, type, uploaded_by AS "uploadedBy", uploaded_at AS "uploadedAt", description, size FROM media`;
    const conditions = [];
    const values = [];
    let idx = 1;

    if (params?.type) {
      conditions.push(`type = $${idx++}`);
      values.push(params.type);
    }
    if (params?.uploadedBy) {
      conditions.push(`uploaded_by = $${idx++}`);
      values.push(params.uploadedBy);
    }
    if (conditions.length) {
      queryText += " WHERE " + conditions.join(" AND ");
    }
    queryText += " ORDER BY uploaded_at DESC";

    const result = await query<Media>(queryText, values);
    return result.rows;
  }
}
