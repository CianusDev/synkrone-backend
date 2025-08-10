import { Request, Response } from "express";
import { HTTP_STATUS } from "../../utils/constant";
import { AuthAdminService } from "./auth-admin.service";
import {
  loginAdminSchema,
  changePasswordAdminSchema,
} from "./auth-admin.schema";

export class AuthAdminController {
  private readonly authAdminService: AuthAdminService;

  constructor() {
    this.authAdminService = new AuthAdminService();
  }

  // Gestion des erreurs centralisée
  private handleError(error: any, res: Response) {
    const statusCode = error.statusCode || HTTP_STATUS.BAD_REQUEST;
    const message = error.message || "Une erreur est survenue";
    return res.status(statusCode).json({ success: false, error: message });
  }

  /**
   * Connexion d'un administrateur
   */
  async loginAdmin(req: Request, res: Response) {
    try {
      const data = req.body;
      const validation = loginAdminSchema.safeParse(data);

      if (!validation.success) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Validation error",
          errors: validation.error.issues,
        });
      }

      const result = await this.authAdminService.loginAdmin(
        validation.data,
        req,
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: "Connexion administrateur réussie",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  /**
   * Déconnexion d'un administrateur
   */
  async logoutAdmin(req: Request, res: Response) {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "L'ID de session est requis",
        });
      }

      await this.authAdminService.logoutAdmin(sessionId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Déconnexion administrateur réussie",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  /**
   * Valider une session administrateur
   */
  async validateSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "L'ID de session est requis",
        });
      }

      const isValid =
        await this.authAdminService.validateAdminSession(sessionId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { isValid },
        message: isValid ? "Session valide" : "Session invalide",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  /**
   * Révoquer toutes les autres sessions d'un administrateur
   */
  async revokeOtherSessions(req: Request, res: Response) {
    try {
      const { adminId, currentSessionId } = req.body;

      if (!adminId || !currentSessionId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "L'ID admin et l'ID de session courante sont requis",
        });
      }

      const revokedCount = await this.authAdminService.revokeOtherAdminSessions(
        adminId,
        currentSessionId,
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { revokedCount },
        message: `${revokedCount} sessions révoquées avec succès`,
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  /**
   * Changer le mot de passe d'un administrateur
   */
  async changePassword(req: Request, res: Response) {
    try {
      const { adminId } = req.params;
      const data = req.body;
      const validation = changePasswordAdminSchema.safeParse(data);

      if (!validation.success) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Validation error",
          errors: validation.error.issues,
        });
      }

      if (!adminId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "L'ID admin est requis",
        });
      }

      await this.authAdminService.changeAdminPassword(
        adminId,
        validation.data.currentPassword,
        validation.data.newPassword,
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Mot de passe administrateur modifié avec succès",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
}
