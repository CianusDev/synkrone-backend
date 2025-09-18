import { Router } from "express";
import { MessageController } from "./message.controller";
import { AuthMiddleware } from "../../middlewares/auth.middleware";

const router = Router();
const controller = new MessageController();

// Créer un message
router.post("/", AuthMiddleware, (req, res) =>
  controller.sendMessage(req, res),
);

// Récupérer les messages d'une conversation (avec pagination)
router.get("/:conversationId", AuthMiddleware, (req, res) =>
  controller.getMessagesForConversation(req, res),
);

// Marquer un message comme lu
router.post("/read", AuthMiddleware, (req, res) =>
  controller.markAsRead(req, res),
);

// Modifier le contenu d'un message
router.patch("/:messageId", AuthMiddleware, (req, res) =>
  controller.updateMessage(req, res),
);

// Supprimer logiquement un message
router.delete("/:messageId", AuthMiddleware, (req, res) =>
  controller.deleteMessage(req, res),
);

// Créer un message système
router.post("/system", AuthMiddleware, (req, res) =>
  controller.createSystemMessage(req, res),
);

export default router;
