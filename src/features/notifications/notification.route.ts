import { Router } from "express";
import { NotificationController } from "./notification.controller";
import { AuthAdminMiddleware } from "../../middlewares/auth-admin.middleware";

const router = Router();
const controller = new NotificationController();
router.use(AuthAdminMiddleware);

// Créer une notification
router.post("/", (req, res) => controller.createNotification(req, res));

// Récupérer toutes les notifications de l'utilisateur connecté
router.get("/", (req, res) => controller.getNotifications(req, res));

// Récupérer une notification par ID
router.get("/:id", (req, res) => controller.getNotificationById(req, res));

// (La logique de marquage comme lue est désormais dans user-notifications)

// Mettre à jour une notification
router.patch("/:id", (req, res) => controller.updateNotification(req, res));

// Supprimer une notification
router.delete("/:id", (req, res) => controller.deleteNotification(req, res));

export default router;
