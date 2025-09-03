import { Request, Response } from "express";
import { HTTP_STATUS } from "../../utils/constant";
import { FreelanceSkillsService } from "./freelance-skills.service";
import { FreelanceSkillsRepository } from "./freelance-skills.repository";
import { SkillRepository } from "../skills/skill.repository";
import { Freelance } from "../freelance/freelance.model";
// (ajoute ici les schémas de validation si tu en as)

export class FreelanceSkillsController {
  private readonly freelanceSkillsService: FreelanceSkillsService;

  constructor() {
    this.freelanceSkillsService = new FreelanceSkillsService(
      new FreelanceSkillsRepository(),
      new SkillRepository(),
    );
  }

  // Gestion centralisée des erreurs
  private handleError(error: any, res: Response) {
    const statusCode = error.statusCode || HTTP_STATUS.BAD_REQUEST;
    const message = error.message || "Une erreur est survenue";
    return res.status(statusCode).json({ success: false, message });
  }

  /**
   * Associer une compétence à un freelance
   */
  async createFreelanceSkills(req: Request, res: Response) {
    try {
      const { skill_id } = req.body;
      const freelance_id = (req as any).freelance.id;
      // Ajoute ici la validation si tu as un schéma Zod
      const requiredFields = { freelance_id, skill_id };
      for (const [key, value] of Object.entries(requiredFields)) {
        if (!value) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: `Le champ ${key} est requis.`,
          });
        }
      }
      const result = await this.freelanceSkillsService.createFreelanceSkills(
        freelance_id,
        skill_id,
      );
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: result,
        message: "Compétence associée au freelance avec succès",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  /**
   * Récupérer les compétences d'un freelance
   */
  async getFreelanceSkillsByFreelanceId(req: Request, res: Response) {
    try {
      const freelanceId = (req as any).freelance.id;
      // Ajoute ici la validation si tu as un schéma Zod
      const result =
        await this.freelanceSkillsService.getFreelanceSkillsByFreelanceId(
          freelanceId,
        );
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: "Compétences du freelance récupérées avec succès",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  /**
   * Met à jour une compétence d'un freelance
   */
  async updateFreelanceSkills(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { skill_id, level } = req.body;
      // Ajoute ici la validation si tu as un schéma Zod

      if (!skill_id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Le champ skill_id est requis.",
        });
      }

      const updated = await this.freelanceSkillsService.updateFreelanceSkills(
        id,
        skill_id,
        level,
      );
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: updated,
        message: "Compétence mise à jour avec succès",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  /**
   * Supprimer une compétence d'un freelance
   */
  async deleteFreelanceSkills(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // Ajoute ici la validation si tu as un schéma Zod

      await this.freelanceSkillsService.deleteFreelanceSkills(id);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
}
