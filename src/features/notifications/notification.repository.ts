import { Notification } from "./notification.model";
import { db } from "../../config/database";

/**
 * Repository for Notification entity.
 * Handles all database operations for notifications.
 */
export class NotificationRepository {
  /**
   * Create a new notification.
   * @param notification - Partial notification data
   * @returns The created notification
   */
  async createNotification(
    notification: Partial<Notification>,
  ): Promise<Notification> {
    const query = `
      INSERT INTO notifications (
        title, message, type, is_global, metadata
      ) VALUES (
        $1, $2, $3, $4, $5
      ) RETURNING *
    `;
    const values = [
      notification.title,
      notification.message,
      notification.type,
      notification.is_global ?? false,
      notification.metadata ? JSON.stringify(notification.metadata) : null,
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0] as Notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Get a notification by its ID.
   * @param id - Notification UUID
   * @returns The notification or null if not found
   */
  async getNotificationById(id: string): Promise<Notification | null> {
    const query = `SELECT * FROM notifications WHERE id = $1`;
    try {
      const result = await db.query(query, [id]);
      return (result.rows[0] as Notification) || null;
    } catch (error) {
      console.error("Error fetching notification by ID:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Get all notifications (optionally paginated).
   * @param options - Pagination options
   * @returns Array of notifications
   */
  async getNotifications(options?: { page?: number; limit?: number }): Promise<{
    data: Notification[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = options?.page && options.page > 0 ? options.page : 1;
    const limit = options?.limit && options.limit > 0 ? options.limit : 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT * FROM notifications
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const countQuery = `
      SELECT COUNT(*) AS total FROM notifications
    `;
    try {
      const dataResult = await db.query(query, [limit, offset]);
      const countResult = await db.query(countQuery);
      const total = parseInt(countResult.rows[0]?.total ?? "0", 10);

      return {
        data: dataResult.rows,
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Update a notification (e.g., mark as read).
   * Coalesce updates: if multiple updates are requested for the same notification,
   * only the latest update is applied.
   * @param id - Notification UUID
   * @param notificationData - Partial notification data to update
   * @returns The updated notification or null if not found
   */
  async updateNotification(
    id: string,
    notificationData: Partial<Notification>,
  ): Promise<Notification | null> {
    // Coalesce updates: fetch current notification, merge with incoming data
    let currentNotification: Notification | null = null;
    try {
      const result = await db.query(
        `SELECT * FROM notifications WHERE id = $1`,
        [id],
      );
      currentNotification = (result.rows[0] as Notification) || null;
      if (!currentNotification) {
        return null;
      }
    } catch (error) {
      console.error("Error fetching notification for coalesced update:", error);
      throw new Error("Database error");
    }

    // Merge: incoming data overrides current notification fields
    const mergedNotification: Partial<Notification> = {
      ...currentNotification,
      ...notificationData,
      updated_at: notificationData.updated_at ?? undefined,
    };

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (mergedNotification.title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(mergedNotification.title);
    }
    if (mergedNotification.message !== undefined) {
      fields.push(`message = $${idx++}`);
      values.push(mergedNotification.message);
    }
    if (mergedNotification.type !== undefined) {
      fields.push(`type = $${idx++}`);
      values.push(mergedNotification.type);
    }
    if (mergedNotification.is_global !== undefined) {
      fields.push(`is_global = $${idx++}`);
      values.push(mergedNotification.is_global);
    }
    if (mergedNotification.metadata !== undefined) {
      fields.push(`metadata = $${idx++}`);
      values.push(
        mergedNotification.metadata
          ? JSON.stringify(mergedNotification.metadata)
          : null,
      );
    }
    if (mergedNotification.updated_at !== undefined) {
      fields.push(`updated_at = $${idx++}`);
      values.push(mergedNotification.updated_at);
    } else {
      fields.push(`updated_at = NOW()`);
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    const query = `
      UPDATE notifications
      SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING *
    `;
    values.push(id);

    try {
      const result = await db.query(query, values);
      return (result.rows[0] as Notification) || null;
    } catch (error) {
      console.error("Error updating notification:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Delete a notification by its ID.
   * @param id - Notification UUID
   * @returns true if deleted, false otherwise
   */
  async deleteNotification(id: string): Promise<boolean> {
    const query = `DELETE FROM notifications WHERE id = $1`;
    try {
      const result = await db.query(query, [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw new Error("Database error");
    }
  }

  // La gestion du marquage comme lu est maintenant dans user-notifications
}
