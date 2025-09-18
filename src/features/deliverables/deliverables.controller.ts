import { Request, Response } from "express";
import { ZodError } from "zod";
import { DeliverablesService } from "./deliverables.service";
import { DeliverablesRepository } from "./deliverables.repository";
import {
  createDeliverableSchema,
  updateDeliverableSchema,
  deliverableIdSchema,
  contractIdSchema,
} from "./deliverables.schema";

export class DeliverablesController {
  private readonly service: DeliverablesService;

  constructor() {
    const repository = new DeliverablesRepository();
    this.service = new DeliverablesService(repository);
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
   * POST /deliverables
   * Crée un livrable
   */
  async createDeliverable(req: Request, res: Response) {
    try {
      const validated = createDeliverableSchema.parse(req.body);
      const deliverable = await this.service.createDeliverable(validated);
      res.status(201).json({ success: true, data: deliverable });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * GET /deliverables/:id
   * Récupère un livrable par son id
   */
  async getDeliverableById(req: Request, res: Response) {
    try {
      const { id } = deliverableIdSchema.parse(req.params);
      const deliverable = await this.service.getDeliverableById(id);
      if (!deliverable) {
        return res
          .status(404)
          .json({ success: false, error: "Livrable non trouvé" });
      }
      res.json({ success: true, data: deliverable });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * GET /deliverables/contract/:contractId
   * Récupère tous les livrables d'un contrat
   */
  async getDeliverablesByContract(req: Request, res: Response) {
    try {
      const { contractId } = contractIdSchema.parse(req.params);
      const deliverables = await this.service.getDeliverablesByContract(
        contractId
      );
      res.json({ success: true, data: deliverables });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * PATCH /deliverables/:id
   * Met à jour un livrable
   */
  async updateDeliverable(req: Request, res: Response) {
    try {
      const { id } = deliverableIdSchema.parse(req.params);
      const validated = updateDeliverableSchema.parse(req.body);
      const updated = await this.service.updateDeliverable(id, validated);
      if (!updated) {
        return res
          .status(404)
          .json({ success: false, error: "Livrable non trouvé" });
      }
      res.json({ success: true, data: updated });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * DELETE /deliverables/:id
   * Supprime un livrable
   */
  async deleteDeliverable(req: Request, res: Response) {
    try {
      const { id } = deliverableIdSchema.parse(req.params);
      const deleted = await this.service.deleteDeliverable(id);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, error: "Livrable non trouvé" });
      }
      res.status(204).send();
    } catch (error) {
      this.handleError(error, res);
    }
  }
}
