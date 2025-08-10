import { db } from "../../config/database";
import { AdminSession } from "./admin-session.model";

export class AdminSessionRepository {
  /**
   * Crée une session admin dans la base de données
   * @param sessionData - Les données de la session à créer
   * @returns La session créée
   */
  async createSession(
    sessionData: Partial<AdminSession>,
  ): Promise<AdminSession> {
    const query = `
        INSERT INTO admin_sessions (
            admin_id,
            ip_address,
            user_agent,
            expires_at,
            is_active
        ) VALUES (
            $1, $2, $3, $4, $5
        ) RETURNING *`;

    const values = [
      sessionData.admin_id,
      sessionData.ip_address,
      sessionData.userAgent,
      sessionData.expiresAt,
      sessionData.is_active,
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error creating admin session:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Récupère une session admin par son ID
   * @param id - L'ID de l'utilisateur à qui appartient la session
   * @returns La session correspondante ou null si non trouvée
   */
  async getSessionsByAdminId(id: string): Promise<AdminSession[] | null> {
    const query = `SELECT * FROM admin_sessions WHERE admin_id = $1`;
    try {
      const result = await db.query(query, [id]);
      return result.rows as AdminSession[] | null;
    } catch (error) {
      console.error("Error fetching admin session by ID:", error);
      throw new Error("Database error");
    }
  }

  async getSessionById(id: string): Promise<AdminSession | null> {
    const query = `
        SELECT * FROM admin_sessions
        WHERE  id = $1`;

    try {
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error fetching admin session by userId and ID:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Met à jour une session utilisateur
   * @param id - L'ID de la session à mettre à jour
   * @param sessionData - Les nouvelles données de la session
   * @returns La session mise à jour
   */
  async updateSession(
    id: string,
    sessionData: Partial<AdminSession>,
  ): Promise<AdminSession | null> {
    const query = `
        UPDATE admin_sessions SET
            ip_address = $1,
            user_agent = $2,
            expires_at = $3,
            is_active = $4
        WHERE id = $5
        RETURNING *`;

    const values = [
      sessionData.ip_address,
      sessionData.userAgent,
      sessionData.expiresAt,
      sessionData.is_active,
      id,
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error updating admin session:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Met à jour l'heure de la dernière activité d'une session utilisateur
   * @param id - L'ID de l'utilisateur dont la session doit être mise à jour
   * @returns La session mise à jour ou null si non trouvée
   */
  async updateLastActivityByUser(id: string): Promise<AdminSession | null> {
    const query = `
        UPDATE admin_sessions SET last_activity_at = NOW()
        WHERE admin_id = $1
        RETURNING *`;

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error("Error updating last active admin session:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Supprime une session utilisateur par son ID
   * @param id - L'ID de la session à supprimer
   * @returns True si la session a été supprimée, sinon false
   */
  async deleteSessionById(id: string): Promise<boolean> {
    const query = `DELETE FROM admin_sessions WHERE id = $1`;
    try {
      const result = await db.query(query, [id]);
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting admin session:", error);
      throw new Error("Database error");
    }
  }

  async revokeAllAdminSessions(adminId: string): Promise<number | null> {
    const query = `
        UPDATE admin_sessions
        SET is_active = false, revoked_at = NOW()
        WHERE admin_id = $1 AND is_active = true
        RETURNING *`;

    try {
      const result = await db.query(query, [adminId]);
      return result.rowCount;
    } catch (error) {
      console.error("Error revoking all admin sessions:", error);
      throw new Error("Database error");
    }
  }

  async revokeSessionById(id: string): Promise<AdminSession | null> {
    const query = `
        UPDATE admin_sessions
        SET is_active = false, revoked_at = NOW()
        WHERE id = $1
        RETURNING *`;

    try {
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error revoking admin session by ID:", error);
      throw new Error("Database error");
    }
  }
}
