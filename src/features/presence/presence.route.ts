import { Router } from "express";
import { PresenceController } from "./presence.controller";
import { AuthMiddleware } from "../../middlewares/auth.middleware";

const router = Router();
const controller = new PresenceController();

// Récupère tous les utilisateurs en ligne
router.get("/online", AuthMiddleware, (req, res) =>
  controller.getOnlineUsers(req, res),
);

// Récupère les statistiques de présence
router.get("/stats", AuthMiddleware, (req, res) =>
  controller.getPresenceStats(req, res),
);

// Récupère les utilisateurs qui tapent dans une conversation
router.get("/typing/:conversationId", AuthMiddleware, (req, res) =>
  controller.getTypingUsers(req, res),
);

// Vérifie si un utilisateur est en ligne
router.get("/:userId/online", AuthMiddleware, (req, res) =>
  controller.isUserOnline(req, res),
);

// Récupère le statut de présence d'un utilisateur
router.get("/:userId", AuthMiddleware, (req, res) =>
  controller.getUserPresence(req, res),
);

// Force la déconnexion d'un utilisateur
router.post("/:userId/disconnect", AuthMiddleware, (req, res) =>
  controller.disconnectUser(req, res),
);

export default router;
