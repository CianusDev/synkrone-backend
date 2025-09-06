import { Router } from "express";
import { AuthCompanyMiddleware } from "../../../middlewares/auth-company.middleware";
import { AuthFreelanceMiddleware } from "../../../middlewares/auth-freelance.middleware";
import { UserNotificationController } from "./user-notification.controller";
import {
  getUserNotificationsQuerySchema,
  markAllAsReadQuerySchema,
  userNotificationIdSchema,
} from "./user-notification.schema";

const router = Router();
const controller = new UserNotificationController();
router.use(AuthFreelanceMiddleware, AuthCompanyMiddleware);
// GET /user-notifications?user_id=...&page=...&limit=...
router.get("/", async (req, res) => {
  // Validation de la query
  try {
    getUserNotificationsQuerySchema.parse(req.query);
    await controller.getUserNotifications(req, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Paramètres de requête invalides",
      error,
    });
  }
});

// PATCH /user-notifications/:id/read
router.patch("/:id/read", async (req, res) => {
  // Validation de l'id
  try {
    userNotificationIdSchema.parse(req.params);
    await controller.markAsRead(req, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "ID de notification utilisateur invalide",
      error,
    });
  }
});

// DELETE /user-notifications/:id
router.delete("/:id", async (req, res) => {
  // Validation de l'id
  try {
    userNotificationIdSchema.parse(req.params);
    await controller.deleteUserNotification(req, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "ID de notification utilisateur invalide",
      error,
    });
  }
});

// PATCH /user-notifications/read-all?user_id=...
router.patch("/read-all", async (req, res) => {
  // Validation de la query
  try {
    markAllAsReadQuerySchema.parse(req.query);
    await controller.markAllAsRead(req, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Paramètre user_id invalide",
      error,
    });
  }
});

export default router;
