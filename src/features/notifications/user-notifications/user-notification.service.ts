import { UserNotificationRepository } from "./user-notification.repository";
import { UserNotification } from "./user-notification.model";
import { Notification } from "../notification.model";
import { io } from "../../../server";
import { NotificationRepository } from "../notification.repository";

export class UserNotificationService {
  private readonly repository: UserNotificationRepository;

  constructor() {
    this.repository = new UserNotificationRepository();
  }

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
    const userNotification = await this.repository.createUserNotification(
      userId,
      notificationId,
      isRead,
    );

    // Récupère la notification complète pour l'envoyer au front
    const notificationRepo = new NotificationRepository();
    const notification =
      await notificationRepo.getNotificationById(notificationId);

    // Émet la notification temps réel à l'utilisateur concerné
    if (notification) {
      io.to(userId).emit("notification:new", {
        ...userNotification,
        notification,
      });
    }

    return userNotification;
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
    return this.repository.getNotificationsForUser(userId, options);
  }

  /**
   * Marque une notification comme lue pour un utilisateur.
   * @param userNotificationId - UUID de l'entrée user_notification
   * @returns L'entrée mise à jour ou null si non trouvée
   */
  async markAsRead(
    userNotificationId: string,
  ): Promise<UserNotification | null> {
    return this.repository.markAsRead(userNotificationId);
  }

  /**
   * Supprime une liaison user_notification (notification pour un utilisateur).
   * @param userNotificationId - UUID de l'entrée user_notification
   * @returns true si supprimée, false sinon
   */
  async deleteUserNotification(userNotificationId: string): Promise<boolean> {
    return this.repository.deleteUserNotification(userNotificationId);
  }

  /**
   * Marque toutes les notifications d'un utilisateur comme lues.
   * @param userId - UUID de l'utilisateur
   * @returns Le nombre de notifications mises à jour
   */
  async markAllAsRead(userId: string): Promise<number> {
    return this.repository.markAllAsRead(userId);
  }
}
