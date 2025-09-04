import { Request, Response } from "express";
import { FreelanceService } from "./freelance.service";
import {
  createFreelanceSchema,
  updateFreelanceProfileSchema,
  freelanceIdSchema,
  verifyEmailSchema,
  updatePasswordSchema,
  getFreelancesWithFiltersSchema,
} from "./freelance.schema";
import { ZodError } from "zod";
import { Freelance } from "./freelance.model";

export class FreelanceController {
  private readonly service: FreelanceService;

  constructor() {
    this.service = new FreelanceService();
  }

  private handleError(error: unknown, res: Response) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Erreur de validation",
        errors: error.issues,
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

  // GET /freelances : liste paginée, recherche, filtres
  async getFreelances(req: Request, res: Response) {
    try {
      // On valide les query params avec Zod
      const parsed = getFreelancesWithFiltersSchema.parse(req.query);

      // skills et experience peuvent être string ou array (selon querystring)
      const skills =
        parsed.skills && Array.isArray(parsed.skills)
          ? parsed.skills
          : parsed.skills
            ? [parsed.skills]
            : undefined;
      const experience =
        parsed.experience && Array.isArray(parsed.experience)
          ? parsed.experience
          : parsed.experience
            ? [parsed.experience]
            : undefined;

      const result = await this.service.getFreelancesWithFilters({
        page: parsed.page,
        limit: parsed.limit,
        search: parsed.search,
        skills,
        experience,
        tjmMin: parsed.tjmMin,
        tjmMax: parsed.tjmMax,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: "Liste des freelances récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // POST /freelances : création d'un freelance
  async createFreelance(req: Request, res: Response) {
    try {
      const validated = createFreelanceSchema.parse(req.body);
      // Hash du mot de passe à faire ici si besoin
      // validated.password_hashed = hash(validated.password)
      // validated.password = undefined;
      const freelance = await this.service.createFreelance(validated);
      res.status(201).json({
        success: true,
        data: freelance,
        message: "Freelance créé avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /freelances/:id
  async getFreelanceById(req: Request, res: Response) {
    try {
      const { id } = freelanceIdSchema.parse(req.params);
      const freelance = await this.service.getFreelanceById(id);
      if (!freelance) {
        return res.status(404).json({
          success: false,
          message: "Freelance non trouvé",
        });
      }
      res.status(200).json({
        success: true,
        data: freelance,
        message: "Freelance récupéré avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // PATCH /freelances/:id
  async updateFreelanceProfile(req: Request, res: Response) {
    try {
      const { id } = freelanceIdSchema.parse(req.params);
      const validated = updateFreelanceProfileSchema.parse(req.body);
      const updated = await this.service.updateFreelanceProfile(
        id,
        validated as Partial<Freelance>,
      );
      res.status(200).json({
        success: true,
        data: updated,
        message: "Profil freelance mis à jour avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // POST /freelances/verify-email
  async verifyEmail(req: Request, res: Response) {
    try {
      const { email } = verifyEmailSchema.parse(req.body);
      const freelance = await this.service.verifyEmail(email);
      if (!freelance) {
        return res.status(404).json({
          success: false,
          message: "Freelance non trouvé",
        });
      }
      res.status(200).json({
        success: true,
        data: freelance,
        message: "Email vérifié avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // PATCH /freelances/password
  async updateFreelancePassword(req: Request, res: Response) {
    try {
      const { email, password } = updatePasswordSchema.parse(req.body);
      // Hash du mot de passe à faire ici si besoin
      // const password_hashed = hash(password)
      const updated = await this.service.updateFreelancePassword(
        email,
        password,
      );
      res.status(200).json({
        success: true,
        data: updated,
        message: "Mot de passe mis à jour avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }
}
