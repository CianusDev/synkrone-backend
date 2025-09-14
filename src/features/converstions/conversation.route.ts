import { Router } from "express";
import { ConversationController } from "./conversation.controller";
import { AuthMiddleware } from "../../middlewares/auth.middleware";
import { AuthAdminMiddleware } from "../../middlewares/auth-admin.middleware";

const router = Router();
const controller = new ConversationController();

// Crée ou récupère une conversation (évite les doublons)
router.post("/", AuthAdminMiddleware, (req, res) =>
  controller.createOrGetConversation(req, res),
);

// // // Récupère une conversation par son ID
// router.get("/:id", AuthAdminMiddleware, (req, res) =>
//   controller.getConversationById(req, res),
// );

// Récupère toutes les conversations d'un utilisateur (freelance ou entreprise)
router.get("/user", AuthMiddleware, (req, res) =>
  controller.getConversationsForUser(req, res),
);

// Trouve une conversation existante entre un freelance et une entreprise
router.get("/find", AuthAdminMiddleware, (req, res) =>
  controller.findConversation(req, res),
);

export default router;
