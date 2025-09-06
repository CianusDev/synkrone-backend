import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  createProjectSchema,
  getProjectsWithFiltersSchema,
  projectIdSchema,
  updateProjectSchema,
} from "./projects.schema";
import { ProjectsService } from "./projects.service";
import { Company } from "../company/company.model";

export class ProjectsController {
  private readonly service: ProjectsService;

  constructor() {
    this.service = new ProjectsService();
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

  // GET /projects : liste paginée, recherche, filtres
  async getProjects(req: Request, res: Response) {
    try {
      const parsed = getProjectsWithFiltersSchema.parse(req.query);

      const result = await this.service.listProjects({
        status: parsed.status,
        typeWork: parsed.typeWork,
        companyId: parsed.companyId,
        categoryId: parsed.categoryId,
        search: parsed.search,
        limit: parsed.limit,
        offset: parsed.offset,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        totalPages: result.totalPages,
        message: "Liste des projets récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /projects/:id
  async getProjectById(req: Request, res: Response) {
    try {
      const { id } = projectIdSchema.parse(req.params);
      const project = await this.service.getProjectById(id);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Projet non trouvé",
        });
      }
      res.status(200).json({
        success: true,
        data: project,
        message: "Projet récupéré avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // POST /projects : création d'un projet
  async createProject(req: Request & { company?: Company }, res: Response) {
    const company = req.company; // Injecté par le middleware AuthCompanyMiddleware
    const data = {
      companyId: company?.id,
      ...req.body,
    };
    try {
      const validated = createProjectSchema.parse(data);
      const project = await this.service.createProject(validated);
      res.status(201).json({
        success: true,
        data: project,
        message: "Projet créé avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // PUT /projects/:id : mise à jour d'un projet
  async updateProject(req: Request, res: Response) {
    try {
      const { id } = projectIdSchema.parse(req.params);
      const validated = updateProjectSchema.parse(req.body);
      const updated = await this.service.updateProject(id, validated);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Projet non trouvé",
        });
      }
      res.status(200).json({
        success: true,
        data: updated,
        message: "Projet mis à jour avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // PATCH /projects/:id/publish : publier un projet
  async publishProject(req: Request, res: Response) {
    try {
      const { id } = projectIdSchema.parse(req.params);
      const published = await this.service.publishProject(id);
      if (!published) {
        return res.status(404).json({
          success: false,
          message: "Projet non trouvé",
        });
      }
      res.status(200).json({
        success: true,
        data: published,
        message: "Projet publié avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // DELETE /projects/:id : suppression d'un projet
  async deleteProject(req: Request, res: Response) {
    try {
      const { id } = projectIdSchema.parse(req.params);
      const deleted = await this.service.deleteProject(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Projet non trouvé",
        });
      }
      res.status(204).send();
    } catch (error) {
      this.handleError(error, res);
    }
  }
}
