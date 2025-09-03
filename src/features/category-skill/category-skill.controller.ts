import { Request, Response } from "express";
import { CategorySkillService } from "./category-skill.service";
import {
  createCategorySkillSchema,
  updateCategorySkillSchema,
  categorySkillIdSchema,
} from "./category-skill.schema";
import { ZodError } from "zod";

export class CategorySkillController {
  private readonly service: CategorySkillService;

  constructor() {
    this.service = new CategorySkillService();
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

  // CREATE
  async createCategorySkill(req: Request, res: Response) {
    try {
      const validated = createCategorySkillSchema.parse(req.body);
      const categorySkill = await this.service.createCategorySkill(validated);
      res.status(201).json({
        success: true,
        data: categorySkill,
        message: "Catégorie de compétence créée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // READ ALL
  async getAllCategorySkills(req: Request, res: Response) {
    try {
      // Pagination et recherche
      const pageRaw = req.query.page;
      const limitRaw = req.query.limit;
      const searchRaw = req.query.search;

      const page =
        typeof pageRaw === "string" && !isNaN(Number(pageRaw))
          ? Number(pageRaw)
          : 1;
      const limit =
        typeof limitRaw === "string" && !isNaN(Number(limitRaw))
          ? Number(limitRaw)
          : 10;
      const search = typeof searchRaw === "string" ? searchRaw.trim() : "";

      const result = await this.service.getAllCategorySkills({
        page,
        limit,
        search,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: "Liste des catégories de compétences récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // READ ONE BY ID
  async getCategorySkillById(req: Request, res: Response) {
    try {
      const { id } = categorySkillIdSchema.parse(req.params);
      const categorySkill = await this.service.getCategorySkillById(id);
      if (!categorySkill) {
        return res.status(404).json({
          success: false,
          message: "Catégorie de compétence non trouvée",
        });
      }
      res.status(200).json({
        success: true,
        data: categorySkill,
        message: "Catégorie de compétence récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // READ ONE BY SLUG
  async getCategorySkillBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      if (!slug || typeof slug !== "string") {
        return res.status(400).json({
          success: false,
          message: "Le slug est requis.",
        });
      }
      const categorySkill = await this.service.getCategorySkillBySlug(slug);
      if (!categorySkill) {
        return res.status(404).json({
          success: false,
          message: "Catégorie de compétence non trouvée",
        });
      }
      res.status(200).json({
        success: true,
        data: categorySkill,
        message: "Catégorie de compétence récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // UPDATE
  async updateCategorySkill(req: Request, res: Response) {
    try {
      const { id } = categorySkillIdSchema.parse(req.params);
      const validated = updateCategorySkillSchema.parse(req.body);
      await this.service.updateCategorySkill(id, validated);
      res.status(200).json({
        success: true,
        message: "Catégorie de compétence mise à jour avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // DELETE
  async deleteCategorySkill(req: Request, res: Response) {
    try {
      const { id } = categorySkillIdSchema.parse(req.params);
      await this.service.deleteCategorySkill(id);
      res.status(204).send();
    } catch (error) {
      this.handleError(error, res);
    }
  }
}
