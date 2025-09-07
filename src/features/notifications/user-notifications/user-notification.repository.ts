import { db } from "../../../config/database";
import { UserNotification } from "./user-notification.model";
import { Notification } from "../notification.model";

/**
 * Repository for UserNotification entity.
 * Handles all database operations for user_notifications.
 */
export class UserNotificationRepository {
  /**
   * Crée une liaison entre un utilisateur et une notification.
   * @param userId - UUID de l'utilisateur
   * @param notificationId - UUID de la notification
   * @param isRead - Statut lu/non lu (par défaut false)
   * @returns L'entrée UserNotification créée
   */
  async createUserNotification(
    userId: string,
    notificationId: string,
    isRead: boolean = false,
  ): Promise<UserNotification> {
    const query = `
      INSERT INTO user_notifications (
        user_id, notification_id, is_read
      ) VALUES (
        $1, $2, $3
      ) RETURNING *
    `;
    const values = [userId, notificationId, isRead];

    try {
      const result = await db.query(query, values);
      return result.rows[0] as UserNotification;
    } catch (error) {
      console.error("Error creating user_notification:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Récupère toutes les notifications d'un utilisateur (avec les infos de notification).
   * @param userId - UUID de l'utilisateur
   * @param options - Pagination (page, limit)
   * @returns Liste paginée des notifications
   */
  async getNotificationsForUser(
    userId: string,
    options?: { page?: number; limit?: number },
  ): Promise<{
    data: Array<UserNotification & { notification: Notification }>;
    total: number;
    page: number;
    limit: number;
  }> {
    const page = options?.page && options.page > 0 ? options.page : 1;
    const limit = options?.limit && options.limit > 0 ? options.limit : 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT un.*, n.*
      FROM user_notifications un
      JOIN notifications n ON un.notification_id = n.id
      WHERE un.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM user_notifications
      WHERE user_id = $1
    `;
    try {
      const dataResult = await db.query(query, [userId, limit, offset]);
      const countResult = await db.query(countQuery, [userId]);
      const total = parseInt(countResult.rows[0]?.total ?? "0", 10);

      // Structure: { ...userNotificationFields, notification: { ...notificationFields } }
      const data = dataResult.rows.map((row: any) => {
        // Séparer les champs notification et user_notification
        const {
          id,
          user_id,
          notification_id,
          is_read,
          created_at,
          updated_at,
          // notification fields
          title,
          message,
          type,
          is_global,
          created_at: notif_created_at,
          updated_at: notif_updated_at,
        } = row;

        const notification: Notification = {
          id: notification_id,
          title,
          message,
          type,
          is_global,
          created_at: notif_created_at,
          updated_at: notif_updated_at,
        };

        return {
          id,
          user_id,
          notification_id,
          is_read,
          created_at,
          updated_at,
          notification,
        };
      });

      return {
        data,
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error("Error fetching notifications for user:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Marque une notification comme lue pour un utilisateur.
   * @param userNotificationId - UUID de l'entrée user_notification
   * @returns L'entrée mise à jour ou null si non trouvée
   */
  async markAsRead(
    userNotificationId: string,
  ): Promise<UserNotification | null> {
    const query = `
      UPDATE user_notifications
      SET is_read = TRUE, updated_at = NOW()
      WHERE notification_id = $1
      RETURNING *
    `;
    try {
      const result = await db.query(query, [userNotificationId]);
      return (result.rows[0] as UserNotification) || null;
    } catch (error) {
      console.error("Error marking user_notification as read:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Supprime une liaison user_notification (notification pour un utilisateur).
   * @param userNotificationId - UUID de l'entrée user_notification
   * @returns true si supprimée, false sinon
   */
  async deleteUserNotification(userNotificationId: string): Promise<boolean> {
    const query = `
      DELETE FROM user_notifications
      WHERE notification_id = $1
    `;
    try {
      const result = await db.query(query, [userNotificationId]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting user_notification:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Marque toutes les notifications d'un utilisateur comme lues.
   * @param userId - UUID de l'utilisateur
   * @returns Le nombre de notifications mises à jour
   */
  async markAllAsRead(userId: string): Promise<number> {
    const query = `
      UPDATE user_notifications
      SET is_read = TRUE, updated_at = NOW()
      WHERE user_id = $1 AND is_read = FALSE
    `;
    try {
      const result = await db.query(query, [userId]);
      return result.rowCount ?? 0;
    } catch (error) {
      console.error("Error marking all user_notifications as read:", error);
      throw new Error("Database error");
    }
  }
}
