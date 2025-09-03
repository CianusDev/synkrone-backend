import { Request, Response } from "express";
import { SkillService } from "./skill.service";
import { HTTP_STATUS } from "../../utils/constant";

export class SkillController {
  private readonly skillService: SkillService;

  constructor() {
    this.skillService = new SkillService();
  }

  // Gestion centralisée des erreurs
  private handleError(error: any, res: Response) {
    const statusCode = error.statusCode || HTTP_STATUS.BAD_REQUEST;
    const message = error.message || "Une erreur est survenue";
    return res.status(statusCode).json({ success: false, message });
  }

  /**
   * Créer une nouvelle compétence
   */
  async createSkill(req: Request, res: Response) {
    try {
      const { name, description, category_id } = req.body;
      if (!name || !category_id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Le nom et la catégorie sont requis.",
        });
      }
      const skill = await this.skillService.createSkill({
        name,
        description,
        category_id,
      });
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: skill,
        message: "Compétence créée avec succès",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  /**
   * Récupérer toutes les compétences (filtre par name et pagination)
   */
  async getAllSkills(req: Request, res: Response) {
    try {
      const { name, page, limit } = req.query;
      const filter: { name?: string } = {};
      if (typeof name === "string" && name.trim() !== "") {
        filter.name = name.trim();
      }
      const pagination: { page?: number; limit?: number } = {};
      if (page && !isNaN(Number(page))) pagination.page = Number(page);
      if (limit && !isNaN(Number(limit))) pagination.limit = Number(limit);

      const { data, total } = await this.skillService.getAllSkills(
        filter,
        pagination,
      );
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data,
        total,
        message: "Liste des compétences récupérée avec succès",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  /**
   * Récupérer une compétence par son ID
   */
  async getSkillById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const skill = await this.skillService.getSkillById(id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: skill,
        message: "Compétence récupérée avec succès",
      });
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  /**
   * Mettre à jour une compétence
   */
  async updateSkill(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, category_id } = req.body;
      const updated = await this.skillService.updateSkill(id, {
        name,
        description,
        category_id,
      });
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
   * Supprimer une compétence
   */
  async deleteSkill(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.skillService.deleteSkill(id);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
}
