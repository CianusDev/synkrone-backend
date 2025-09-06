import { NotificationRepository } from "./notification.repository";
import { Notification } from "./notification.model";

export class NotificationService {
  private readonly repository: NotificationRepository;

  constructor() {
    this.repository = new NotificationRepository();
  }

  /**
   * Crée une nouvelle notification
   * @param data - Les données de la notification à créer
   * @returns La notification créée
   */
  async createNotification(data: Partial<Notification>): Promise<Notification> {
    return this.repository.createNotification(data);
  }

  /**
   * Récupère une notification par son ID
   * @param id - L'ID de la notification
   * @returns La notification ou null si non trouvée
   */
  async getNotificationById(id: string): Promise<Notification | null> {
    return this.repository.getNotificationById(id);
  }

  /**
   * Récupère toutes les notifications selon les filtres et pagination
   * @param params - Filtres et pagination
   * @returns Liste paginée des notifications
   */
  async getNotifications(params: {
    user_id?: string;
    type?: string;
    is_read?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Notification[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Pour l’instant, on ne filtre que par user_id (comme dans le repository)
    return this.repository.getNotificationsByUserId(params.user_id!, {
      page: params.page,
      limit: params.limit,
    });
  }

  /**
   * Récupère toutes les notifications d'un utilisateur
   * @param userId - L'ID de l'utilisateur
   * @param options - Options de pagination et de filtrage
   * @returns Liste paginée des notifications
   */
  async getNotificationsByUserId(
    userId: string,
    options?: { page?: number; limit?: number; isRead?: boolean },
  ): Promise<{
    data: Notification[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.repository.getNotificationsByUserId(userId, options);
  }

  /**
   * Met à jour une notification (ex: marquer comme lue)
   * @param id - L'ID de la notification
   * @param data - Les champs à mettre à jour
   * @returns La notification mise à jour ou null si non trouvée
   */
  async updateNotification(
    id: string,
    data: Partial<Notification>,
  ): Promise<Notification | null> {
    return this.repository.updateNotification(id, data);
  }

  /**
   * Supprime une notification
   * @param id - L'ID de la notification
   * @returns true si supprimée, false sinon
   */
  async deleteNotification(id: string): Promise<boolean> {
    return this.repository.deleteNotification(id);
  }

  /**
   * Marque une notification comme lue
   * @param id - L'ID de la notification
   * @returns La notification mise à jour ou null si non trouvée
   */
  async markAsRead(id: string): Promise<Notification | null> {
    return this.repository.updateNotification(id, { is_read: true });
  }

  /**
   * Marque toutes les notifications d'un utilisateur comme lues
   * @param userId - L'ID de l'utilisateur
   * @returns Le nombre de notifications mises à jour
   */
  async markAllAsRead(userId: string): Promise<number> {
    return this.repository.markAllAsRead(userId);
  }
}
