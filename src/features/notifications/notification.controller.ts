import { Request, Response } from "express";
import { NotificationService } from "./notification.service";
import {
  createNotificationSchema,
  updateNotificationSchema,
  notificationIdSchema,
  getNotificationsSchema,
} from "./notification.schema";
import { ZodError } from "zod";
import { Notification } from "./notification.model";

export class NotificationController {
  private readonly service: NotificationService;

  constructor() {
    this.service = new NotificationService();
  }

  private handleError(error: unknown, res: Response) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Erreur de validation",
        errors: error.issues,
      });
    }
    if (typeof error === "object" && error !== null && "message" in error) {
      return res.status(400).json({
        success: false,
        message:
          (error as { message?: string }).message || "Une erreur est survenue",
      });
    }
    return res.status(400).json({
      success: false,
      message: "Une erreur est survenue",
    });
  }

  // GET /notifications : liste paginée, filtres
  async getNotifications(req: Request, res: Response) {
    try {
      const parsed = getNotificationsSchema.parse(req.query);
      const result = await this.service.getNotifications(parsed);
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        message: "Liste des notifications récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /notifications/:id
  async getNotificationById(req: Request, res: Response) {
    try {
      const { id } = notificationIdSchema.parse(req.params);
      const notification = await this.service.getNotificationById(id);
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification non trouvée",
        });
      }
      res.status(200).json({
        success: true,
        data: notification,
        message: "Notification récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // POST /notifications
  async createNotification(req: Request, res: Response) {
    try {
      const validated = createNotificationSchema.parse(req.body);
      // Convertir le type string en enum
      const notification = await this.service.createNotification(validated);
      res.status(201).json({
        success: true,
        data: notification,
        message: "Notification créée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // PATCH /notifications/:id
  async updateNotification(req: Request, res: Response) {
    try {
      const { id } = notificationIdSchema.parse(req.params);
      const validated = updateNotificationSchema.parse(req.body);
      const updated = await this.service.updateNotification(id, validated);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Notification non trouvée",
        });
      }
      res.status(200).json({
        success: true,
        data: updated,
        message: "Notification mise à jour avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // La logique de marquage comme lu est désormais dans user-notifications

  // DELETE /notifications/:id
  async deleteNotification(req: Request, res: Response) {
    try {
      const { id } = notificationIdSchema.parse(req.params);
      const deleted = await this.service.deleteNotification(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Notification non trouvée",
        });
      }
      res.status(200).json({
        success: true,
        message: "Notification supprimée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }
}
