import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  addSkillToProjectSchema,
  removeSkillFromProjectSchema,
  updateProjectSkillsSchema,
  projectIdParamSchema,
  skillIdParamSchema,
  projectSkillParamsSchema,
} from "./project-skills.schema";
import { ProjectSkillsService } from "./project-skills.service";

export class ProjectSkillsController {
  private readonly service: ProjectSkillsService;

  constructor() {
    this.service = new ProjectSkillsService();
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

  // POST /projects/:projectId/skills : ajouter une compétence à un projet
  async addSkillToProject(req: Request, res: Response) {
    try {
      const { projectId } = projectIdParamSchema.parse(req.params);
      const { skillId } = addSkillToProjectSchema.parse(req.body);

      const projectSkill = await this.service.addSkillToProject(
        projectId,
        skillId,
      );

      res.status(201).json({
        success: true,
        data: projectSkill,
        message: "Compétence ajoutée au projet avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // DELETE /projects/:projectId/skills/:skillId : supprimer une compétence d'un projet
  async removeSkillFromProject(req: Request, res: Response) {
    try {
      const { projectId, skillId } = projectSkillParamsSchema.parse(req.params);

      await this.service.removeSkillFromProject(projectId, skillId);

      res.status(200).json({
        success: true,
        message: "Compétence supprimée du projet avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /projects/:projectId/skills : récupérer toutes les compétences d'un projet
  async getSkillsByProjectId(req: Request, res: Response) {
    try {
      const { projectId } = projectIdParamSchema.parse(req.params);

      const skills = await this.service.getSkillsByProjectId(projectId);

      res.status(200).json({
        success: true,
        data: skills,
        message: "Compétences du projet récupérées avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /skills/:skillId/projects : récupérer tous les projets utilisant une compétence
  async getProjectsBySkillId(req: Request, res: Response) {
    try {
      const { skillId } = skillIdParamSchema.parse(req.params);

      const projects = await this.service.getProjectsBySkillId(skillId);

      res.status(200).json({
        success: true,
        data: projects,
        message: "Projets utilisant cette compétence récupérés avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // PUT /projects/:projectId/skills : mettre à jour toutes les compétences d'un projet
  async updateProjectSkills(req: Request, res: Response) {
    try {
      const { projectId } = projectIdParamSchema.parse(req.params);
      const { skillIds } = updateProjectSkillsSchema.parse(req.body);

      const updatedSkills = await this.service.updateProjectSkills(
        projectId,
        skillIds,
      );

      res.status(200).json({
        success: true,
        data: updatedSkills,
        message: "Compétences du projet mises à jour avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // DELETE /projects/:projectId/skills : supprimer toutes les compétences d'un projet
  async removeAllSkillsFromProject(req: Request, res: Response) {
    try {
      const { projectId } = projectIdParamSchema.parse(req.params);

      await this.service.removeAllSkillsFromProject(projectId);

      res.status(200).json({
        success: true,
        message: "Toutes les compétences ont été supprimées du projet",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }
}
