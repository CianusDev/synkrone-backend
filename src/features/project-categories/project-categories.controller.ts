import { Request, Response } from "express";
import { ProjectCategoriesService } from "./project-categories.service";
import { HTTP_STATUS } from "../../utils/constant";
import {
  createProjectCategorySchema,
  updateProjectCategorySchema,
  projectCategoryIdSchema,
} from "./schema";
import { ZodError } from "zod";

export class ProjectCategoriesController {
  private readonly service: ProjectCategoriesService;

  constructor() {
    this.service = new ProjectCategoriesService();
  }

  private handleError(error: unknown, res: Response) {
    if (error instanceof ZodError) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Erreur de validation",
        errors: error.issues,
      });
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      "message" in error
    ) {
      const statusCode =
        (error as { statusCode?: number }).statusCode ||
        HTTP_STATUS.BAD_REQUEST;
      const message =
        (error as { message?: string }).message || "Une erreur est survenue";
      return res.status(statusCode).json({ success: false, message });
    }
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ success: false, message: "Une erreur est survenue" });
  }

  // CREATE
  async createCategory(req: Request, res: Response) {
    try {
      const validated = createProjectCategorySchema.parse(req.body);
      const category = await this.service.createCategory(validated);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: category,
        message: "Catégorie de projet créée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // READ ALL
  async getAllCategories(req: Request, res: Response) {
    try {
      // Validation des paramètres de pagination et de recherche
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

      // Appel du service avec pagination et recherche
      const categories = await this.service.getAllCategories({
        page,
        limit,
        search,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: categories,
        message: "Liste des catégories de projets récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // READ ONE
  async getCategoryById(req: Request, res: Response) {
    try {
      const { id } = projectCategoryIdSchema.parse(req.params);
      const category = await this.service.getCategoryById(id);
      if (!category) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Catégorie de projet non trouvée",
        });
      }
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: category,
        message: "Catégorie de projet récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // UPDATE
  async updateCategory(req: Request, res: Response) {
    try {
      const { id } = projectCategoryIdSchema.parse(req.params);
      const validated = updateProjectCategorySchema.parse(req.body);
      const updated = await this.service.updateCategory(id, validated);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: updated,
        message: "Catégorie de projet mise à jour avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // DELETE
  async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = projectCategoryIdSchema.parse(req.params);
      await this.service.deleteCategory(id);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error) {
      this.handleError(error, res);
    }
  }
}
