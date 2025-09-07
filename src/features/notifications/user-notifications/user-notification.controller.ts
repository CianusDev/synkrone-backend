import { Request, Response } from "express";
import { UserNotificationService } from "./user-notification.service";
import { ZodError } from "zod";

export class UserNotificationController {
  private readonly service: UserNotificationService;

  constructor() {
    this.service = new UserNotificationService();
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

  // GET /user-notifications?page=...&limit=...
  async getUserNotifications(req: Request, res: Response) {
    try {
      const user_id = (req as any)?.user.id || "";

      const { page, limit } = req.query;
      if (!user_id || typeof user_id !== "string") {
        return res.status(400).json({
          success: false,
          message: "user_id est requis",
        });
      }
      const result = await this.service.getNotificationsForUser(user_id, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        message: "Notifications utilisateur récupérées avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // PATCH /user-notifications/:id/read
  async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant de la notification utilisateur est requis",
        });
      }
      console.log("Marquage de la notification comme lue :", id);
      const updated = await this.service.markAsRead(id);
      console.log("Notification marquée comme lue :", updated);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Notification utilisateur non trouvée",
        });
      }
      res.status(200).json({
        success: true,
        data: updated,
        message: "Notification utilisateur marquée comme lue",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // DELETE /user-notifications/:id
  async deleteUserNotification(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant de la notification utilisateur est requis",
        });
      }
      const deleted = await this.service.deleteUserNotification(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Notification utilisateur non trouvée",
        });
      }
      res.status(200).json({
        success: true,
        message: "Notification utilisateur supprimée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // PATCH /user-notifications/read-all?user_id=...
  async markAllAsRead(req: Request, res: Response) {
    try {
      const { user_id } = req.query;
      if (!user_id || typeof user_id !== "string") {
        return res.status(400).json({
          success: false,
          message: "user_id est requis",
        });
      }
      const updatedCount = await this.service.markAllAsRead(user_id);
      res.status(200).json({
        success: true,
        updatedCount,
        message:
          "Toutes les notifications utilisateur ont été marquées comme lues",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }
}
