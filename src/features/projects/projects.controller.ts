import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { Request, Response } from "express";
import { z, ZodError } from "zod";
import { Company } from "../company/company.model";
import { Freelance } from "../freelance/freelance.model";
import {
  createProjectSchema,
  getProjectsWithFiltersSchema,
  projectIdSchema,
  updateProjectSchema,
} from "./projects.schema";
import { ProjectsService } from "./projects.service";

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
        page: parsed.page,
        limit: parsed.limit,
        offset: parsed.offset,
        freelanceId: parsed.freelanceId, // Pour vérifier si le freelance a postulé ou a été invité
      });

      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        page: result.page,
        totalPages: result.totalPages,
        message: "Liste des projets récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /projects/my-projects : projets de l'entreprise connectée
  async getMyProjects(req: Request & { company?: Company }, res: Response) {
    try {
      const company = req.company; // Injecté par le middleware AuthCompanyMiddleware
      if (!company) {
        return res.status(401).json({
          success: false,
          message: "Entreprise non authentifiée",
        });
      }

      const parsed = getProjectsWithFiltersSchema.parse(req.query);

      const result = await this.service.listProjects({
        status: parsed.status,
        typeWork: parsed.typeWork,
        companyId: company.id, // Forcer le companyId à celui de l'entreprise connectée
        categoryId: parsed.categoryId,
        search: parsed.search,
        page: parsed.page,
        limit: parsed.limit,
        offset: parsed.offset,
      });

      res.status(200).json({
        success: true,
        data: result.data.map((project) => ({
          ...project,
          applicationsCount: project.applicationsCount ?? 0,
          invitationsCount: project.invitationsCount ?? 0,
        })),
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        page: result.page,
        totalPages: result.totalPages,
        message: "Liste de vos projets récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /projects/my-missions : missions du freelance connecté (projets avec contrats actifs)
  async getMyMissions(req: Request & { freelance?: Freelance }, res: Response) {
    try {
      const freelance = req.freelance; // Injecté par le middleware AuthFreelanceMiddleware
      if (!freelance) {
        return res.status(401).json({
          success: false,
          message: "Freelance non authentifié",
        });
      }

      const parsed = getProjectsWithFiltersSchema.parse(req.query);

      const result = await this.service.getFreelanceMissions(freelance.id, {
        search: parsed.search,
        page: parsed.page,
        limit: parsed.limit,
        offset: parsed.offset,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        page: result.page,
        totalPages: result.totalPages,
        message: "Liste de vos missions récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /projects/:id
  async getProjectById(req: Request, res: Response) {
    try {
      const { id } = projectIdSchema.parse(req.params);
      const freelanceId = req.query.freelanceId as string | undefined;

      const project = await this.service.getProjectById(id, freelanceId);
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
      // const { text } = await generateText({
      //   model: google("gemini-2.5-flash"),
      //   prompt: "Write a vegetarian lasagna recipe for 4 people.",
      // });
      const { object } = await generateObject({
        model: google("gemini-2.5-flash"),
        output: "object",
        schema: z.object({
          isCorrectTitle: z.boolean(),
          isCorrectDescription: z.boolean(),
        }),
        prompt: `
        Tu es un modérateur de contenu. Ta tâche est de vérifier si le titre et la description d'un projet de mission sont appropriés, professionnels et ne contiennent pas de contenu offensant, inapproprié ou interdit.
        Réponds uniquement par les champs demandés : "isCorrectTitle" et "isCorrectDescription" (boolean).
        Soit quand meme flexible par rapport aux titres un peu accrocheurs et description peu detaille.
        ces pour des tests donc pas besoin d'etre trop strict.
        Voici le titre du projet : "${validated.title}"
        Voici la description du projet : "${validated.description}"
        `,
      });
      console.log({
        object,
        // text,
        title: validated.title,
        descrption: validated.description,
      });
      if (!object.isCorrectTitle) {
        return res.status(400).json({
          success: false,
          message: "Le titre du projet n'est pas approprié.",
        });
      }
      if (!object.isCorrectDescription) {
        return res.status(400).json({
          success: false,
          message: "La description du projet n'est pas appropriée.",
        });
      }
      if (!object.isCorrectDescription && !object.isCorrectTitle) {
        console.log("Le titre et la description du projet sont appropriés.");
        return res.status(400).json({
          success: true,
          message: "Le titre et la description du projet sont appropriés.",
        });
      }
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
