import { HTTP_STATUS } from "../../utils/constant";
import {
  registerCompanySchema,
  registerFreelanceSchema,
  verifyEmailSchema,
} from "./auth.schema";
import { AuthUnifiedService } from "./auth-unified.service";
import { Request, Response } from "express";

export class AuthUnifiedController {
  private readonly authService: AuthUnifiedService;
  constructor() {
    this.authService = new AuthUnifiedService();
  }

  // Gestion des erreurs centralisée
  private handleError(error: any, res: Response) {
    const statusCode = error.statusCode || HTTP_STATUS.BAD_REQUEST;
    const message = error.message || "Une erreur est survenue";
    return res.status(statusCode).json({ success: false, error: message });
  }

  // ===========================================
  // ENDPOINTS UNIFIÉS
  // ===========================================

  /**
   * Connexion unifiée (auto-détection freelance/company)
   * Fonctionne pour freelances et entreprises
   */
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Email and password are required",
        });
      }

      const data = await this.authService.login({ email, password }, req);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: data,
        message: "Login successful",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  /**
   * Demande de réinitialisation de mot de passe unifiée
   * Fonctionne pour freelances et entreprises
   */
  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Email is required",
        });
      }

      await this.authService.forgotPassword(email);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Password reset link sent successfully",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  /**
   * Réinitialisation de mot de passe unifiée
   * Fonctionne pour freelances et entreprises
   */
  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Token and new password are required",
        });
      }

      await this.authService.resetPassword(token, newPassword);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  /**
   * Vérification d'email unifiée
   * Fonctionne pour freelances et entreprises
   */
  async verifyEmail(req: Request, res: Response) {
    try {
      const data = req.body;
      const validation = verifyEmailSchema.safeParse(data);
      if (!validation.success) {
        console.log(`Validation error: ${validation.error.message}`);
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Validation error",
          errors: validation.error.issues,
        });
      }

      const result = await this.authService.verifyEmail(validation.data);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: "Email verified successfully",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  /**
   * Renvoi du code de vérification d'email unifié
   * Fonctionne pour freelances et entreprises
   */
  async resendEmailVerificationOTP(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Email is required",
        });
      }

      await this.authService.resendEmailVerificationOTP(email);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Email verification OTP resent successfully",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  /**
   * Renvoi du code de réinitialisation de mot de passe unifié
   * Fonctionne pour freelances et entreprises
   */
  async resendResetPasswordOTP(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Email is required",
        });
      }

      await this.authService.resendResetPasswordOTP(email);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Password reset OTP resent successfully",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  // ===========================================
  // ENDPOINTS SPÉCIFIQUES (RESTENT SÉPARÉS)
  // ===========================================

  // AUTH FREELANCE
  async registerFreelance(req: Request, res: Response) {
    try {
      const data = req.body;
      const validation = registerFreelanceSchema.safeParse(data);
      if (!validation.success) {
        console.log(`Validation error: ${validation.error.message}`);
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: validation.error.issues,
        });
      }

      const freelance = await this.authService.registerFreelance(
        validation.data,
      );
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: freelance,
        message: "Freelance registered successfully",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  async loginFreelance(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Email and password are required",
        });
      }

      const data = await this.authService.loginFreelance(
        { email, password },
        req,
      );
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: data,
        message: "Login successful",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  // AUTH COMPANY
  async registerCompany(req: Request, res: Response) {
    try {
      const data = req.body;
      const validation = registerCompanySchema.safeParse(data);
      if (!validation.success) {
        console.log(`Validation error: ${validation.error.message}`);
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Validation error",
          errors: validation.error.issues,
        });
      }

      const company = await this.authService.registerCompany(validation.data);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: company,
        message: "Company registered successfully",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  async loginCompany(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Email and password are required",
        });
      }

      const data = await this.authService.loginCompany(
        { email, password },
        req,
      );
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: data,
        message: "Login successful",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  // COMMON AUTH
  async logout(req: Request, res: Response) {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Session ID is required",
        });
      }

      await this.authService.logout(sessionId);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
}
