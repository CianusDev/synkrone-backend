import { Request, Response } from "express";
import { ApplicationsService } from "./applications.service";
import {
  createApplicationSchema,
  updateApplicationStatusSchema,
  applicationIdSchema,
  freelanceIdParamSchema,
  projectIdParamSchema,
  filterApplicationsSchema,
} from "./applications.schema";
import { ZodError } from "zod";
import { ApplicationStatus } from "./applications.model";
import { Freelance } from "../freelance/freelance.model";

export class ApplicationsController {
  private readonly service: ApplicationsService;

  constructor() {
    this.service = new ApplicationsService();
  }

  private handleError(error: unknown, res: Response) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Erreur de validation",
        erreurs: error.issues,
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

  // POST /applications : créer une candidature
  async createApplication(
    req: Request & { freelance?: Freelance },
    res: Response,
  ) {
    try {
      const freelance_id = req.freelance?.id;
      // Utilisation de safeParse pour une gestion plus robuste
      const result = createApplicationSchema.safeParse({
        ...req.body,
        freelance_id,
      });
      console.log({ freelance_id });
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Erreur de validation",
          erreurs: result.error.issues,
        });
      }
      const data = result.data;
      console.log("Creating application with data:", data);
      const application = await this.service.createApplication({
        ...data,
        cover_letter: data.cover_letter ?? undefined,
      });
      res.status(201).json({
        success: true,
        data: application,
        message: "Candidature créée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /applications/:id : récupérer une candidature par ID
  async getApplicationById(req: Request, res: Response) {
    try {
      const { id } = applicationIdSchema.parse(req.params);
      const application = await this.service.getApplicationById(id);
      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Candidature non trouvée",
        });
      }
      res.status(200).json({
        success: true,
        data: application,
        message: "Candidature récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /applications/freelance/:freelanceId : candidatures d'un freelance avec filtres et pagination
  async getApplicationsByFreelanceId(req: Request, res: Response) {
    try {
      const { freelanceId } = freelanceIdParamSchema.parse(req.params);
      // On merge les query params avec le freelanceId
      const filters = filterApplicationsSchema.parse({
        ...req.query,
        freelanceId,
      });
      const result = await this.service.getApplicationsWithFilters(filters);
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        message: "Liste des candidatures du freelance récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // PATCH /applications/:id/withdraw : retirer une candidature
  async withdrawApplication(
    req: Request & { freelance?: Freelance },
    res: Response,
  ) {
    try {
      const { id } = applicationIdSchema.parse(req.params);
      const freelanceId = req.freelance?.id;
      if (!freelanceId) {
        return res.status(401).json({
          success: false,
          message: "Freelance non authentifié",
        });
      }

      const result = await this.service.withdrawApplication(id, freelanceId);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Candidature non trouvée ou non autorisée",
        });
      }
      res.status(200).json({
        success: true,
        data: result,
        message: "Candidature retirée avec succès",
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        error.message ===
          "Impossible de retirer une candidature déjà acceptée ou rejetée."
      ) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }
      this.handleError(error, res);
    }
  }

  // GET /applications/project/:projectId : candidatures d'un projet avec filtres et pagination
  async getApplicationsByProjectId(req: Request, res: Response) {
    try {
      const { projectId } = projectIdParamSchema.parse(req.params);
      // On merge les query params avec le projectId
      const filters = filterApplicationsSchema.parse({
        ...req.query,
        projectId,
      });
      const result = await this.service.getApplicationsWithFilters(filters);
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        message: "Liste des candidatures du projet récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // PATCH /applications/:id/status : mettre à jour le statut d'une candidature
  async updateApplicationStatus(req: Request, res: Response) {
    try {
      const { id } = applicationIdSchema.parse(req.params);
      const { status, response_date } = updateApplicationStatusSchema.parse(
        req.body,
      );
      const updated = await this.service.updateApplicationStatus(
        id,
        status as ApplicationStatus,
        response_date ?? undefined,
      );
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Candidature non trouvée ou statut non mis à jour",
        });
      }
      res.status(200).json({
        success: true,
        data: updated,
        message: "Statut de la candidature mis à jour avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // PATCH /applications/:id/accept : accepter une candidature
  async acceptApplication(req: Request, res: Response) {
    try {
      const { id } = applicationIdSchema.parse(req.params);
      const updated = await this.service.updateApplicationStatus(
        id,
        ApplicationStatus.ACCEPTED,
        new Date(),
      );
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Candidature non trouvée ou statut non mis à jour",
        });
      }
      res.status(200).json({
        success: true,
        data: updated,
        message: "Candidature acceptée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // PATCH /applications/:id/reject : rejeter une candidature
  async rejectApplication(req: Request, res: Response) {
    try {
      const { id } = applicationIdSchema.parse(req.params);
      const updated = await this.service.updateApplicationStatus(
        id,
        ApplicationStatus.REJECTED,
        new Date(),
      );
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Candidature non trouvée ou statut non mis à jour",
        });
      }
      res.status(200).json({
        success: true,
        data: updated,
        message: "Candidature rejetée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // DELETE /applications/:id : supprimer une candidature
  async deleteApplication(req: Request, res: Response) {
    try {
      const { id } = applicationIdSchema.parse(req.params);
      const deleted = await this.service.deleteApplication(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Candidature non trouvée ou déjà supprimée",
        });
      }
      res.status(200).json({
        success: true,
        message: "Candidature supprimée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // POST /applications/filter : filtrer les candidatures
  async filterApplications(req: Request, res: Response) {
    try {
      const params = filterApplicationsSchema.parse(req.body);
      const result = await this.service.getApplicationsWithFilters(params);
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        message: "Liste des candidatures filtrée récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }
}
