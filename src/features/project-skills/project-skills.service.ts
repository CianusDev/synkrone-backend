import { ProjectSkillsRepository } from "./project-skills.repository";
import { ProjectSkill, ProjectSkillWithDetails } from "./project-skills.model";

export class ProjectSkillsService {
  private readonly repository: ProjectSkillsRepository;

  constructor() {
    this.repository = new ProjectSkillsRepository();
  }

  /**
   * Ajoute une compétence à un projet
   */
  async addSkillToProject(
    projectId: string,
    skillId: string,
  ): Promise<ProjectSkill> {
    // Vérifier si l'association existe déjà
    const exists = await this.repository.existsProjectSkill(projectId, skillId);
    if (exists) {
      throw new Error("Cette compétence est déjà associée à ce projet");
    }

    return this.repository.addSkillToProject(projectId, skillId);
  }

  /**
   * Supprime une compétence d'un projet
   */
  async removeSkillFromProject(
    projectId: string,
    skillId: string,
  ): Promise<boolean> {
    const removed = await this.repository.removeSkillFromProject(
      projectId,
      skillId,
    );
    if (!removed) {
      throw new Error("Association projet-compétence non trouvée");
    }
    return removed;
  }

  /**
   * Récupère toutes les compétences d'un projet
   */
  async getSkillsByProjectId(
    projectId: string,
  ): Promise<ProjectSkillWithDetails[]> {
    return this.repository.getSkillsByProjectId(projectId);
  }

  /**
   * Récupère tous les projets utilisant une compétence
   */
  async getProjectsBySkillId(skillId: string): Promise<ProjectSkill[]> {
    return this.repository.getProjectsBySkillId(skillId);
  }

  /**
   * Met à jour toutes les compétences d'un projet
   */
  async updateProjectSkills(
    projectId: string,
    skillIds: string[],
  ): Promise<ProjectSkillWithDetails[]> {
    // Supprimer les doublons
    const uniqueSkillIds = [...new Set(skillIds)];

    return this.repository.replaceProjectSkills(projectId, uniqueSkillIds);
  }

  /**
   * Supprime toutes les compétences d'un projet
   */
  async removeAllSkillsFromProject(projectId: string): Promise<boolean> {
    return this.repository.removeAllSkillsFromProject(projectId);
  }

  /**
   * Vérifie si une association projet-compétence existe
   */
  async existsProjectSkill(
    projectId: string,
    skillId: string,
  ): Promise<boolean> {
    return this.repository.existsProjectSkill(projectId, skillId);
  }
}
