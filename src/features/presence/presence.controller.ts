import { Request, Response } from "express";
import { presenceService } from "./presence.service";

export class PresenceController {
  /**
   * Récupère le statut de présence d'un utilisateur
   * GET /presence/:userId
   */
  async getUserPresence(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId is required",
        });
      }

      const presence = presenceService.getUserPresence(userId);

      if (!presence) {
        return res.status(404).json({
          success: false,
          message: "User presence not found",
        });
      }

      return res.json({
        success: true,
        data: presence,
      });
    } catch (error) {
      console.error("Error getting user presence:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Récupère tous les utilisateurs en ligne
   * GET /presence/online
   */
  async getOnlineUsers(req: Request, res: Response) {
    try {
      const onlineUsers = presenceService.getAllOnlineUsers();

      return res.json({
        success: true,
        data: onlineUsers,
      });
    } catch (error) {
      console.error("Error getting online users:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Récupère les utilisateurs qui tapent dans une conversation
   * GET /presence/typing/:conversationId
   */
  async getTypingUsers(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message: "conversationId is required",
        });
      }

      const typingUsers = presenceService.getTypingUsersInConversation(conversationId);

      return res.json({
        success: true,
        data: typingUsers,
      });
    } catch (error) {
      console.error("Error getting typing users:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Récupère les statistiques de présence
   * GET /presence/stats
   */
  async getPresenceStats(req: Request, res: Response) {
    try {
      const stats = presenceService.getPresenceStats();

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error getting presence stats:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Vérifie si un utilisateur est en ligne
   * GET /presence/:userId/online
   */
  async isUserOnline(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId is required",
        });
      }

      const isOnline = presenceService.isUserOnline(userId);

      return res.json({
        success: true,
        data: {
          userId,
          isOnline,
        },
      });
    } catch (error) {
      console.error("Error checking if user is online:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Force la déconnexion d'un utilisateur (admin only)
   * POST /presence/:userId/disconnect
   */
  async disconnectUser(
    req: Request & { user?: { id: string } },
    res: Response
  ) {
    try {
      const { userId } = req.params;
      const currentUserId = req?.user?.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId is required",
        });
      }

      // Vérifier si c'est le même utilisateur ou un admin
      if (currentUserId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized to disconnect this user",
        });
      }

      const presence = presenceService.setUserOffline(userId);

      return res.json({
        success: true,
        message: "User disconnected successfully",
        data: presence,
      });
    } catch (error) {
      console.error("Error disconnecting user:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
