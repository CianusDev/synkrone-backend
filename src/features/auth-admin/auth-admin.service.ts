import z from "zod";
import { AdminRepository } from "../admin/admin.repository";
import { AdminSessionRepository } from "../admin-session/admin-session.repository";
import { Request } from "express";
import {
  comparePassword,
  createUserToken,
  hashPassword,
} from "../../utils/utils";
import { loginAdminSchema } from "./auth-admin.schema";

// Définir des types d'erreur personnalisés
class AdminAuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

class NotFoundError extends AdminAuthError {
  constructor(message: string) {
    super(message, 404);
  }
}

class UnauthorizedError extends AdminAuthError {
  constructor(message: string) {
    super(message, 401);
  }
}

class ValidationError extends AdminAuthError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthAdminService {
  private readonly adminRepository: AdminRepository;
  private readonly adminSessionRepository: AdminSessionRepository;

  // Session validity period in milliseconds (2 hours - shorter for admin security)
  private readonly SESSION_VALIDITY_PERIOD = 2 * 60 * 60 * 1000;

  constructor() {
    this.adminRepository = new AdminRepository();
    this.adminSessionRepository = new AdminSessionRepository();
  }

  /**
   * Méthode pour gérer la création ou mise à jour de session administrateur
   * @param adminId ID de l'administrateur
   * @param req Requête Express
   * @param existingSessionId ID de session existante (optionnel)
   * @returns ID de la session
   */
  private async handleAdminSession(
    adminId: string,
    req: Request,
    existingSessionId?: string,
  ): Promise<string> {
    try {
      console.log({
        adminId,
        existingSessionId,
      });
      const existingSession = existingSessionId
        ? await this.adminSessionRepository.getSessionById(existingSessionId)
        : null;

      // Vérification de l'existence de la session
      const isSessionValid = existingSession && existingSession.is_active;

      if (!isSessionValid) {
        console.log("pas bon du tout");
        // Création d'une nouvelle session
        const session = await this.adminSessionRepository.createSession({
          admin_id: adminId,
          ip_address: req.ip || "unknown",
          userAgent: req.headers["user-agent"] || "unknown",
          expiresAt: new Date(Date.now() + this.SESSION_VALIDITY_PERIOD),
          is_active: true,
        });

        return session.id;
      } else {
        // Mise à jour de la session existante
        await this.adminSessionRepository.updateSession(existingSession.id, {
          ip_address: req.ip || "unknown",
          userAgent: req.headers["user-agent"] || "unknown",
          expiresAt: new Date(Date.now() + this.SESSION_VALIDITY_PERIOD),
          is_active: true,
        });

        return existingSession.id;
      }
    } catch (error) {
      console.error("Erreur lors de la gestion de la session admin:", error);
      throw new AdminAuthError("Erreur lors de la gestion de la session");
    }
  }

  /**
   * Connexion d'un administrateur
   * @param data Données de connexion (username, mot de passe)
   * @param req Requête Express
   * @returns Informations de session et administrateur
   */
  async loginAdmin(data: z.infer<typeof loginAdminSchema>, req: Request) {
    try {
      // Vérification de l'existence de l'admin par username
      const admin = await this.adminRepository.getAdminByUsername(
        data.username,
      );

      // Si l'admin n'existe pas, message d'erreur générique (sécurité)
      if (!admin) {
        throw new UnauthorizedError("Identifiants incorrects");
      }

      // Vérification du mot de passe avec timing constant pour éviter les timing attacks
      const isPasswordValid = await comparePassword(
        data.password,
        admin.password_hashed,
      );

      // Si le mot de passe n'est pas valide
      if (!isPasswordValid) {
        throw new UnauthorizedError("Identifiants incorrects");
      }

      // Gestion de la session administrateur
      const newSessionId = await this.handleAdminSession(
        admin.id,
        req,
        data.sessionId,
      );

      // Création du token JWT pour l'authentification
      const token = createUserToken(admin, "admin");

      // Retourne les informations de connexion
      return {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          level: admin.level,
          // Ne pas retourner le mot de passe hashé ou d'autres informations sensibles
        },
        sessionId: newSessionId,
      };
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof AdminAuthError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error("Erreur lors de la connexion admin:", error);
      throw new UnauthorizedError(
        "Erreur lors de la connexion. Veuillez réessayer.",
      );
    }
  }

  /**
   * Déconnexion d'un administrateur
   * @param sessionId ID de la session à déconnecter
   */
  async logoutAdmin(sessionId: string): Promise<void> {
    try {
      // Vérification de l'existence de la session
      const session =
        await this.adminSessionRepository.getSessionById(sessionId);

      // Si la session n'existe pas, on lance une erreur
      if (!session) {
        throw new NotFoundError("Session non trouvée");
      }

      // Désactivation de la session
      await this.adminSessionRepository.updateSession(sessionId, {
        is_active: false,
        expiresAt: new Date(Date.now() - 1000), // Expire immédiatement
        revokedAt: new Date(), // Marquer comme révoquée
      });
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof AdminAuthError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error("Erreur lors de la déconnexion admin:", error);
      throw new AdminAuthError("Erreur lors de la déconnexion");
    }
  }

  /**
   * Valider une session administrateur
   * @param sessionId ID de la session à valider
   * @returns true si la session est valide, false sinon
   */
  async validateAdminSession(sessionId: string): Promise<boolean> {
    try {
      const session =
        await this.adminSessionRepository.getSessionById(sessionId);

      if (!session) {
        return false;
      }

      // Vérifier si la session est active et non expirée
      const isValid =
        session.is_active &&
        new Date(session.expiresAt) > new Date() &&
        !session.revokedAt;

      return isValid;
    } catch (error) {
      console.error("Erreur lors de la validation de la session admin:", error);
      return false;
    }
  }

  /**
   * Révoquer toutes les autres sessions d'un administrateur
   * @param adminId ID de l'administrateur
   * @param currentSessionId ID de la session courante à préserver
   * @returns Nombre de sessions révoquées
   */
  async revokeOtherAdminSessions(
    adminId: string,
    currentSessionId: string,
  ): Promise<number> {
    try {
      const sessions =
        await this.adminSessionRepository.getSessionsByAdminId(adminId);
      let revokedCount = 0;

      if (!sessions || sessions.length === 0) {
        return revokedCount; // Aucune session à révoquer
      }

      for (const session of sessions) {
        // Ne pas révoquer la session courante
        if (session.id === currentSessionId) {
          continue;
        }

        // Révoquer la session
        if (session.is_active) {
          await this.adminSessionRepository.updateSession(session.id, {
            is_active: false,
            expiresAt: new Date(Date.now() - 1000),
            revokedAt: new Date(),
          });
          revokedCount++;
        }
      }

      return revokedCount;
    } catch (error) {
      console.error(
        "Erreur lors de la révocation des autres sessions admin:",
        error,
      );
      throw new AdminAuthError("Erreur lors de la révocation des sessions");
    }
  }

  /**
   * Changer le mot de passe d'un administrateur
   * @param adminId ID de l'administrateur
   * @param currentPassword Mot de passe actuel
   * @param newPassword Nouveau mot de passe
   * @returns true si le changement est réussi
   */
  async changeAdminPassword(
    adminId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    try {
      // Récupérer l'admin
      const admin = await this.adminRepository.getAdminById(adminId);
      if (!admin) {
        throw new NotFoundError("Administrateur non trouvé");
      }

      // Vérifier le mot de passe actuel
      const isPasswordValid = await comparePassword(
        currentPassword,
        admin.password_hashed,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedError("Mot de passe actuel incorrect");
      }

      // Hasher le nouveau mot de passe
      const newPasswordHashed = await hashPassword(newPassword);

      // Mettre à jour le mot de passe
      await this.adminRepository.updateAdminPassword(
        adminId,
        newPasswordHashed,
      );

      // Révoquer toutes les sessions de l'admin pour des raisons de sécurité
      await this.adminSessionRepository.revokeAllAdminSessions(adminId);

      return true;
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof AdminAuthError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error("Erreur lors du changement de mot de passe admin:", error);
      throw new AdminAuthError("Erreur lors du changement de mot de passe");
    }
  }
}
