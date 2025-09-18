import { Request, Response } from "express";
import { ZodError } from "zod";
import { WorkDaysService } from "./work-days.service";
import { WorkDaysRepository } from "./work-days.repository";
import {
  createWorkDaySchema,
  updateWorkDaySchema,
  validateWorkDaySchema,
  rejectWorkDaySchema,
  submitWorkDaysSchema,
  workDayIdSchema,
  deliverableIdSchema,
  workDayFiltersSchema,
} from "./work-days.schema";

export class WorkDaysController {
  private readonly service: WorkDaysService;

  constructor() {
    const repository = new WorkDaysRepository();
    this.service = new WorkDaysService(repository);
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

  /**
   * POST /work-days/deliverable/:deliverableId
   * Crée un jour de travail pour un livrable
   */
  async createWorkDay(req: Request, res: Response) {
    try {
      const { deliverableId } = deliverableIdSchema.parse(req.params);
      const validated = createWorkDaySchema.parse(req.body);

      // TODO: Récupérer le freelanceId depuis le middleware d'authentification
      // const freelanceId = req.freelance?.id;
      const freelanceId = "temp-freelance-id"; // Temporaire pour les tests

      const workDay = await this.service.createWorkDay({
        deliverableId,
        freelanceId,
        ...validated,
      });

      res.status(201).json({ success: true, data: workDay });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * GET /work-days/:id
   * Récupère un jour de travail par son id
   */
  async getWorkDayById(req: Request, res: Response) {
    try {
      const { id } = workDayIdSchema.parse(req.params);
      const workDay = await this.service.getWorkDayById(id);

      if (!workDay) {
        return res
          .status(404)
          .json({ success: false, error: "Jour de travail non trouvé" });
      }

      res.json({ success: true, data: workDay });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * GET /work-days/deliverable/:deliverableId
   * Récupère tous les jours de travail d'un livrable
   */
  async getWorkDaysByDeliverable(req: Request, res: Response) {
    try {
      const { deliverableId } = deliverableIdSchema.parse(req.params);
      const workDays = await this.service.getWorkDaysByDeliverable(deliverableId);

      res.json({ success: true, data: workDays });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * GET /work-days/freelance/:freelanceId
   * Récupère tous les jours de travail d'un freelance avec filtres
   */
  async getWorkDaysByFreelance(req: Request, res: Response) {
    try {
      // TODO: Vérifier que l'utilisateur connecté est le freelance ou une entreprise autorisée
      const freelanceId = req.params.freelanceId;
      const filters = workDayFiltersSchema.parse(req.query);

      const workDays = await this.service.getWorkDaysByFreelance(freelanceId, filters);

      res.json({ success: true, data: workDays });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * PATCH /work-days/:id
   * Met à jour un jour de travail
   */
  async updateWorkDay(req: Request, res: Response) {
    try {
      const { id } = workDayIdSchema.parse(req.params);
      const validated = updateWorkDaySchema.parse(req.body);

      const updated = await this.service.updateWorkDay(id, validated);

      if (!updated) {
        return res
          .status(404)
          .json({ success: false, error: "Jour de travail non trouvé" });
      }

      res.json({ success: true, data: updated });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * DELETE /work-days/:id
   * Supprime un jour de travail
   */
  async deleteWorkDay(req: Request, res: Response) {
    try {
      const { id } = workDayIdSchema.parse(req.params);
      const deleted = await this.service.deleteWorkDay(id);

      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, error: "Jour de travail non trouvé" });
      }

      res.status(204).send();
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * POST /work-days/submit
   * Soumet des jours de travail pour validation
   */
  async submitWorkDays(req: Request, res: Response) {
    try {
      const { workDayIds } = submitWorkDaysSchema.parse(req.body);
      const submitted = await this.service.submitWorkDays(workDayIds);

      res.json({
        success: true,
        data: submitted,
        message: `${submitted.length} jour(s) de travail soumis pour validation`
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * PATCH /work-days/:id/validate
   * Valide un jour de travail (action entreprise)
   */
  async validateWorkDay(req: Request, res: Response) {
    try {
      const { id } = workDayIdSchema.parse(req.params);
      validateWorkDaySchema.parse(req.body); // Valide que status = "validated"

      const validated = await this.service.validateWorkDay(id);

      if (!validated) {
        return res
          .status(404)
          .json({ success: false, error: "Jour de travail non trouvé ou non validable" });
      }

      res.json({ success: true, data: validated });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * PATCH /work-days/:id/reject
   * Rejette un jour de travail (action entreprise)
   */
  async rejectWorkDay(req: Request, res: Response) {
    try {
      const { id } = workDayIdSchema.parse(req.params);
      const { rejectionReason } = rejectWorkDaySchema.parse(req.body);

      const rejected = await this.service.rejectWorkDay(id, rejectionReason);

      if (!rejected) {
        return res
          .status(404)
          .json({ success: false, error: "Jour de travail non trouvé ou non rejectable" });
      }

      res.json({ success: true, data: rejected });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * GET /work-days/deliverable/:deliverableId/stats
   * Récupère les statistiques des jours de travail pour un livrable
   */
  async getWorkDayStatsByDeliverable(req: Request, res: Response) {
    try {
      const { deliverableId } = deliverableIdSchema.parse(req.params);
      const stats = await this.service.getWorkDayStatsByDeliverable(deliverableId);

      res.json({ success: true, data: stats });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * POST /work-days/bulk-validate
   * Valide plusieurs jours de travail en une fois
   */
  async bulkValidateWorkDays(req: Request, res: Response) {
    try {
      const { workDayIds } = submitWorkDaysSchema.parse(req.body);
      const validated = await this.service.bulkValidateWorkDays(workDayIds);

      res.json({
        success: true,
        data: validated,
        message: `${validated.length} jour(s) de travail validés`
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * POST /work-days/bulk-reject
   * Rejette plusieurs jours de travail en une fois
   */
  async bulkRejectWorkDays(req: Request, res: Response) {
    try {
      const { workDayIds } = submitWorkDaysSchema.parse(req.body);
      const { rejectionReason } = rejectWorkDaySchema.parse(req.body);
      const rejected = await this.service.bulkRejectWorkDays(workDayIds, rejectionReason);

      res.json({
        success: true,
        data: rejected,
        message: `${rejected.length} jour(s) de travail rejetés`
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }
}
