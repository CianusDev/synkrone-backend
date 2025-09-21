import { Request, Response } from "express";
import { ProjectInvitationsService } from "./project-invitations.service";
import {
  createProjectInvitationSchema,
  updateInvitationStatusSchema,
  invitationIdSchema,
  freelanceIdParamSchema,
  companyIdParamSchema,
  projectIdParamSchema,
  filterInvitationsSchema,
} from "./project-invitations.schema";
import { ZodError } from "zod";
import { InvitationStatus } from "./project-invitations.model";
import { Freelance } from "../freelance/freelance.model";

export class ProjectInvitationsController {
  private readonly service: ProjectInvitationsService;

  constructor() {
    this.service = new ProjectInvitationsService();
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

  // POST /project-invitations : créer une invitation
  async createInvitation(req: Request, res: Response) {
    try {
      const result = createProjectInvitationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Erreur de validation",
          erreurs: result.error.issues,
        });
      }
      const data = result.data;
      const invitation = await this.service.createInvitation({
        ...data,
        message: data.message ?? undefined,
        expires_at: data.expires_at ?? undefined,
      });
      res.status(201).json({
        success: true,
        data: invitation,
        message: "Invitation créée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /project-invitations/:id : récupérer une invitation par ID
  async getInvitationById(req: Request, res: Response) {
    try {
      const { id } = invitationIdSchema.parse(req.params);
      const invitation = await this.service.getInvitationById(id);
      if (!invitation) {
        return res.status(404).json({
          success: false,
          message: "Invitation non trouvée",
        });
      }
      res.status(200).json({
        success: true,
        data: invitation,
        message: "Invitation récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /project-invitations/freelance/:freelanceId : invitations reçues par un freelance (avec pagination et filtres)
  async getInvitationsByFreelanceId(req: Request, res: Response) {
    try {
      const { freelanceId } = freelanceIdParamSchema.parse(req.params);
      const filters = filterInvitationsSchema.parse({
        ...req.query,
        freelanceId,
      });
      const result = await this.service.getInvitationsByFreelanceId(
        filters.freelanceId!,
        filters.page,
        filters.limit,
      );
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        message:
          "Liste des invitations reçues par le freelance récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /project-invitations/company/:companyId : invitations envoyées par une entreprise (avec pagination et filtres)
  async getInvitationsByCompanyId(req: Request, res: Response) {
    try {
      const { companyId } = companyIdParamSchema.parse(req.params);
      const filters = filterInvitationsSchema.parse({
        ...req.query,
        companyId,
      });
      const result = await this.service.getInvitationsByCompanyId(
        filters.companyId!,
        filters.page,
        filters.limit,
      );
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        message:
          "Liste des invitations envoyées par l'entreprise récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /project-invitations/project/:projectId : invitations pour un projet (avec pagination et filtres)
  async getInvitationsByProjectId(req: Request, res: Response) {
    try {
      const { projectId } = projectIdParamSchema.parse(req.params);
      const filters = filterInvitationsSchema.parse({
        ...req.query,
        projectId,
      });
      const result = await this.service.getInvitationsByProjectId(
        filters.projectId!,
        filters.page,
        filters.limit,
      );
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        message: "Liste des invitations pour le projet récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // PATCH /project-invitations/:id/status : mettre à jour le statut d'une invitation
  async updateInvitationStatus(req: Request, res: Response) {
    try {
      const { id } = invitationIdSchema.parse(req.params);
      const { status, responded_at } = updateInvitationStatusSchema.parse(
        req.body,
      );
      const updated = await this.service.updateInvitationStatus(
        id,
        status as InvitationStatus,
        responded_at ?? undefined,
      );
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Invitation non trouvée ou statut non mis à jour",
        });
      }
      res.status(200).json({
        success: true,
        data: updated,
        message: "Statut de l'invitation mis à jour avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // DELETE /project-invitations/:id : supprimer une invitation
  async deleteInvitation(req: Request, res: Response) {
    try {
      const { id } = invitationIdSchema.parse(req.params);
      const deleted = await this.service.deleteInvitation(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Invitation non trouvée ou déjà supprimée",
        });
      }
      res.status(200).json({
        success: true,
        message: "Invitation supprimée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // POST /project-invitations/filter : filtrer les invitations (avec pagination et filtres dans le body)
  async filterInvitations(req: Request, res: Response) {
    try {
      const params = filterInvitationsSchema.parse(req.body);
      const result = await this.service.getInvitationsWithFilters(params);
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        message: "Liste des invitations filtrée récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // PATCH /project-invitations/:id/accept : accepter une invitation (freelance)
  async acceptInvitation(
    req: Request & { freelance?: Freelance },
    res: Response,
  ) {
    try {
      const { id } = invitationIdSchema.parse(req.params);
      const freelanceId = req.freelance?.id;

      if (!freelanceId) {
        return res.status(401).json({
          success: false,
          message: "Freelance non authentifié",
        });
      }

      const result = await this.service.acceptInvitation(id, freelanceId);

      res.status(200).json({
        success: true,
        data: result,
        message:
          "Invitation acceptée avec succès. Une candidature a été créée automatiquement.",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // PATCH /project-invitations/:id/decline : décliner une invitation (freelance)
  async declineInvitation(
    req: Request & { freelance?: Freelance },
    res: Response,
  ) {
    try {
      const { id } = invitationIdSchema.parse(req.params);
      const freelanceId = req.freelance?.id;

      if (!freelanceId) {
        return res.status(401).json({
          success: false,
          message: "Freelance non authentifié",
        });
      }

      const result = await this.service.declineInvitation(id, freelanceId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Invitation non trouvée ou non autorisée",
        });
      }

      res.status(200).json({
        success: true,
        data: result,
        message: "Invitation déclinée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }
}
