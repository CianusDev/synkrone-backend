import { HTTP_STATUS } from "../../utils/constant";
import {
  registerCompanySchema,
  registerFreelanceSchema,
  verifyEmailSchema,
} from "./auth.schema";
import { AuthService } from "./auth.service";
import { Request, Response } from "express";

export class AuthController {
  private readonly authService: AuthService;
  constructor() {
    this.authService = new AuthService();
  }

  // Gestion des erreurs centralisée
  private handleError(error: any, res: Response) {
    const statusCode = error.statusCode || HTTP_STATUS.BAD_REQUEST;
    const message = error.message || "Une erreur est survenue";
    return res.status(statusCode).json({ success: false, error: message });
  }

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
      res.status(HTTP_STATUS.BAD_REQUEST).json({ error: error.message });
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
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: error.message });
    }
  }

  async verifyEmailFreelance(req: Request, res: Response) {
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
      const result = await this.authService.verifyEmailFreelance(
        validation.data,
      );
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: "Email verified successfully",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  async resendEmailVerificationOTPFreelance(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Email is required",
        });
      }
      const result =
        await this.authService.resendEmailVerificationOTPFreelance(email);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: "Email verification OTP resent successfully",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  async resendResetPasswordOTPFreelance(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Email is required",
        });
      }
      const result =
        await this.authService.resendResetPasswordOTPFreelance(email);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: "Password reset OTP resent successfully",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  async forgotPasswordFreelance(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Email is required",
        });
      }
      const result = await this.authService.forgotPasswordFreelance(email);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: "Password reset link sent successfully",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  async resetPasswordFreelance(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Token, and new password are required",
        });
      }

      const result = await this.authService.resetPasswordFreelance(
        token,
        newPassword,
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: "Password reset successfully",
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

  async verifyEmailCompany(req: Request, res: Response) {
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
      const result = await this.authService.verifyEmailCompany(validation.data);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: "Email verified successfully",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  async resendEmailVerificationOTPCompany(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Email is required",
        });
      }
      const result =
        await this.authService.resendEmailVerificationOTPCompany(email);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: "Email verification OTP resent successfully",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  async resendResetPasswordOTPCompany(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Email is required",
        });
      }
      const result =
        await this.authService.resendResetPasswordOTPCompany(email);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: "Password reset OTP resent successfully",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  async forgotPasswordCompany(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Email is required",
        });
      }
      const result = await this.authService.forgotPasswordCompany(email);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: "Password reset link sent successfully",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  async resetPasswordCompany(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Token and new password are required",
        });
      }
      const result = await this.authService.resetPasswordCompany(
        token,
        newPassword,
      );
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: "Password reset successfully",
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
          message: "session ID are required",
        });
      }
      const result = await this.authService.logout(sessionId);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: "Logout successful",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
}
