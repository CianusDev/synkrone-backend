import { db } from "../../config/database";
import { UserSession } from "./user-session.model";

export class UserSessionRepository {
  /**
   * Crée une session utilisateur dans la base de données
   * @param sessionData - Les données de la session à créer
   * @returns La session créée
   */
  async createSession(sessionData: Partial<UserSession>): Promise<UserSession> {
    const query = `
        INSERT INTO user_sessions (
            user_id,
            ip_address,
            user_agent,
            expires_at,
            is_active
        ) VALUES (
            $1, $2, $3, $4, $5
        ) RETURNING *`;

    const values = [
      sessionData.userId,
      sessionData.ipAddress,
      sessionData.userAgent,
      sessionData.expiresAt,
      sessionData.isActive,
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error creating user session:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Récupère une session utilisateur par son ID
   * @param id - L'ID de l'utilisateur à qui appartient la session
   * @returns La session correspondante ou null si non trouvée
   */
  async getSessionByUserId(id: string): Promise<UserSession | null> {
    const query = `SELECT * FROM user_sessions WHERE user_id = $1`;
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error("Error fetching user session by ID:", error);
      throw new Error("Database error");
    }
  }

  async getSessionById(id: string): Promise<UserSession | null> {
    const query = `
        SELECT * FROM user_sessions
        WHERE  id = $1`;

    try {
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error fetching user session by userId and ID:", error);
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
    sessionData: Partial<UserSession>,
  ): Promise<UserSession | null> {
    const query = `
        UPDATE user_sessions SET
            ip_address = $1,
            user_agent = $2,
            expires_at = $3,
            is_active = $4
        WHERE id = $5
        RETURNING *`;

    const values = [
      sessionData.ipAddress,
      sessionData.userAgent,
      sessionData.expiresAt,
      sessionData.isActive,
      id,
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error updating user session:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Met à jour l'heure de la dernière activité d'une session utilisateur
   * @param id - L'ID de l'utilisateur dont la session doit être mise à jour
   * @returns La session mise à jour ou null si non trouvée
   */
  async updateLastActivityByUser(id: string): Promise<UserSession | null> {
    const query = `
        UPDATE user_sessions SET last_activity_at = NOW()
        WHERE user_id = $1
        RETURNING *`;

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error("Error updating last active user session:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Supprime une session utilisateur par son ID
   * @param id - L'ID de la session à supprimer
   * @returns True si la session a été supprimée, sinon false
   */
  async deleteSessionById(id: string): Promise<boolean> {
    const query = `DELETE FROM user_sessions WHERE id = $1`;
    try {
      const result = await db.query(query, [id]);
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting user session:", error);
      throw new Error("Database error");
    }
  }
}
