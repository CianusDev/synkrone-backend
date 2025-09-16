import { Request, Response } from "express";
import { ConversationService } from "./conversation.service";
import {
  createConversationSchema,
  findConversationSchema,
  findConversationByApplicationSchema,
} from "./conversation.schema";

export class ConversationController {
  private readonly service: ConversationService;

  constructor() {
    this.service = new ConversationService();
  }

  /**
   * Gestion centralisée des erreurs
   */
  private handleError(error: unknown, res: Response) {
    // ZodError import dynamique pour éviter le cycle
    const isZodError = error && typeof error === "object" && "issues" in error;
    if (isZodError) {
      return res.status(400).json({
        success: false,
        message: "Erreur de validation",
        errors: (error as any).issues,
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

  /**
   * Crée ou récupère une conversation (évite les doublons)
   * POST /conversations
   */
  async createOrGetConversation(
    req: Request & { user?: { id: string } },
    res: Response,
  ) {
    try {
      const parsed = createConversationSchema.safeParse(req.body);
      if (!parsed.success) {
        return this.handleError(parsed.error, res);
      }
      const currentUserId = req?.user?.id;
      const conversation = await this.service.createOrGetConversation(
        parsed.data,
        currentUserId,
      );
      return res.status(201).json(conversation);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  /**
   * Récupère une conversation par son ID
   * GET /conversations/:id
   */
  async getConversationById(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const conversation = await this.service.getConversationById(id);
      if (!conversation)
        return res.status(404).json({ error: "Conversation not found" });
      return res.json(conversation);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  /**
   * Récupère toutes les conversations d'un utilisateur (freelance ou entreprise)
   * GET /conversations/user/:userId
   */
  async getConversationsForUser(
    req: Request & { user?: { id: string } },
    res: Response,
  ) {
    const userId = req?.user?.id || "null";
    // Lecture et validation des paramètres de pagination
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 20;
    const offset = req.query.offset
      ? parseInt(req.query.offset as string, 10)
      : 0;
    if (
      (req.query.limit && isNaN(limit)) ||
      (req.query.offset && isNaN(offset))
    ) {
      return res.status(400).json({
        success: false,
        message: "Les paramètres de pagination doivent être des entiers.",
      });
    }
    try {
      const conversations = await this.service.getConversationsForUser(
        userId,
        limit,
        offset,
      );
      return res.json(conversations);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  /**
   * Trouve une conversation existante entre un freelance et une entreprise
   * GET /conversations/find?freelanceId=...&companyId=...
   */
  async findConversation(
    req: Request & { user?: { id: string } },
    res: Response,
  ) {
    try {
      const parsed = findConversationSchema.safeParse(req.query);
      if (!parsed.success) {
        return this.handleError(parsed.error, res);
      }
      const currentUserId = req?.user?.id;
      const conversation = await this.service.findConversation(
        parsed.data.freelanceId,
        parsed.data.companyId,
        currentUserId,
      );
      if (!conversation)
        return res.status(404).json({ error: "Conversation not found" });
      return res.json(conversation);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  /**
   * Trouve une conversation existante par applicationId
   * GET /conversations/find-by-application?applicationId=...
   */
  async findConversationByApplication(
    req: Request & { user?: { id: string } },
    res: Response,
  ) {
    try {
      const parsed = findConversationByApplicationSchema.safeParse(req.query);
      if (!parsed.success) {
        return this.handleError(parsed.error, res);
      }
      const currentUserId = req?.user?.id;
      const conversation = await this.service.findConversationByApplication(
        parsed.data.applicationId,
        currentUserId,
      );
      if (!conversation)
        return res.status(404).json({ error: "Conversation not found" });
      return res.json(conversation);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  /**
   * Marque tous les messages non lus d'une conversation comme lus
   * POST /conversations/:id/mark-all-read
   */
  async markAllMessagesAsRead(
    req: Request & { user?: { id: string } },
    res: Response,
  ) {
    const { id: conversationId } = req.params;
    const userId = req?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    try {
      const markedCount =
        await this.service.markAllMessagesAsReadInConversation(
          conversationId,
          userId,
        );

      return res.json({
        success: true,
        message: `${markedCount} messages marqués comme lus`,
        markedCount,
      });
    } catch (error) {
      return this.handleError(error, res);
    }
  }
}
