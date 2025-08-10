import { Request, Response } from "express";
import { HTTP_STATUS } from "../../utils/constant";
import { ProfileService } from "./profile.service";
import {
  updateFreelanceProfileSchema,
  updateCompanyProfileSchema,
  profileIdSchema,
} from "./profile.schema";

export class ProfileController {
  private readonly profileService: ProfileService;

  constructor() {
    this.profileService = new ProfileService();
  }

  // Gestion des erreurs centralisée
  private handleError(error: any, res: Response) {
    const statusCode = error.statusCode || HTTP_STATUS.BAD_REQUEST;
    const message = error.message || "Une erreur est survenue";
    return res.status(statusCode).json({ success: false, error: message });
  }

  /**
   * Compléter le profil d'un freelance
   */
  async completeFreelanceProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;

      // Validation de l'ID
      const idValidation = profileIdSchema.safeParse({ id });
      if (!idValidation.success) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "ID invalide",
          errors: idValidation.error.issues,
        });
      }

      // Validation des données du profil
      const validation = updateFreelanceProfileSchema.safeParse(data);
      if (!validation.success) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Validation error",
          errors: validation.error.issues,
        });
      }

      const updatedProfile = await this.profileService.completeFreelanceProfile(
        id,
        validation.data,
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: updatedProfile,
        message: "Profil freelance mis à jour avec succès",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  /**
   * Compléter le profil d'une entreprise
   */
  async completeCompanyProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;

      // Validation de l'ID
      const idValidation = profileIdSchema.safeParse({ id });
      if (!idValidation.success) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "ID invalide",
          errors: idValidation.error.issues,
        });
      }

      // Validation des données du profil
      const validation = updateCompanyProfileSchema.safeParse(data);
      if (!validation.success) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Validation error",
          errors: validation.error.issues,
        });
      }

      const updatedProfile = await this.profileService.completeCompanyProfile(
        id,
        validation.data,
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: updatedProfile,
        message: "Profil entreprise mis à jour avec succès",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  /**
   * Obtenir le profil d'un freelance
   */
  async getFreelanceProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Validation de l'ID
      const validation = profileIdSchema.safeParse({ id });
      if (!validation.success) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "ID invalide",
          errors: validation.error.issues,
        });
      }

      const profile = await this.profileService.getFreelanceProfile(id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: profile,
        message: "Profil freelance récupéré avec succès",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  /**
   * Obtenir le profil d'une entreprise
   */
  async getCompanyProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Validation de l'ID
      const validation = profileIdSchema.safeParse({ id });
      if (!validation.success) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "ID invalide",
          errors: validation.error.issues,
        });
      }

      const profile = await this.profileService.getCompanyProfile(id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: profile,
        message: "Profil entreprise récupéré avec succès",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  /**
   * Vérifier si le profil d'un freelance est complet
   */
  async isFreelanceProfileComplete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Validation de l'ID
      const validation = profileIdSchema.safeParse({ id });
      if (!validation.success) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "ID invalide",
          errors: validation.error.issues,
        });
      }

      const result = await this.profileService.isFreelanceProfileComplete(id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: result.isComplete
          ? "Le profil freelance est complet"
          : "Le profil freelance est incomplet",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  /**
   * Vérifier si le profil d'une entreprise est complet
   */
  async isCompanyProfileComplete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Validation de l'ID
      const validation = profileIdSchema.safeParse({ id });
      if (!validation.success) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "ID invalide",
          errors: validation.error.issues,
        });
      }

      const result = await this.profileService.isCompanyProfileComplete(id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: result.isComplete
          ? "Le profil entreprise est complet"
          : "Le profil entreprise est incomplet",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
}
