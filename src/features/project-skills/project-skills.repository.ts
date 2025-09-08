import { query } from "../../config/database";
import { ProjectSkill, ProjectSkillWithDetails } from "./project-skills.model";

export class ProjectSkillsRepository {
  /**
   * Ajoute une compétence à un projet
   */
  async addSkillToProject(
    projectId: string,
    skillId: string,
  ): Promise<ProjectSkill> {
    const result = await query<ProjectSkill>(
      `INSERT INTO project_skills (project_id, skill_id)
       VALUES ($1, $2)
       RETURNING id, project_id AS "projectId", skill_id AS "skillId"`,
      [projectId, skillId],
    );
    return result.rows[0];
  }

  /**
   * Supprime une compétence d'un projet
   */
  async removeSkillFromProject(
    projectId: string,
    skillId: string,
  ): Promise<boolean> {
    const result = await query(
      `DELETE FROM project_skills WHERE project_id = $1 AND skill_id = $2`,
      [projectId, skillId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Récupère toutes les compétences d'un projet
   */
  async getSkillsByProjectId(
    projectId: string,
  ): Promise<ProjectSkillWithDetails[]> {
    const result = await query<ProjectSkillWithDetails>(
      `SELECT
        ps.id,
        ps.project_id AS "projectId",
        ps.skill_id AS "skillId",
        json_build_object(
          'id', s.id,
          'name', s.name,
          'description', s.description,
          'categoryId', s.category_id
        ) AS skill
       FROM project_skills ps
       INNER JOIN skills s ON ps.skill_id = s.id
       WHERE ps.project_id = $1
       ORDER BY s.name ASC`,
      [projectId],
    );
    return result.rows;
  }

  /**
   * Récupère tous les projets utilisant une compétence
   */
  async getProjectsBySkillId(skillId: string): Promise<ProjectSkill[]> {
    const result = await query<ProjectSkill>(
      `SELECT id, project_id AS "projectId", skill_id AS "skillId"
       FROM project_skills
       WHERE skill_id = $1`,
      [skillId],
    );
    return result.rows;
  }

  /**
   * Vérifie si une association projet-compétence existe
   */
  async existsProjectSkill(
    projectId: string,
    skillId: string,
  ): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM project_skills WHERE project_id = $1 AND skill_id = $2 LIMIT 1`,
      [projectId, skillId],
    );
    return result.rows.length > 0;
  }

  /**
   * Remplace toutes les compétences d'un projet
   */
  async replaceProjectSkills(
    projectId: string,
    skillIds: string[],
  ): Promise<ProjectSkillWithDetails[]> {
    // Commence une transaction
    await query("BEGIN");

    try {
      // Supprime toutes les compétences existantes du projet
      await query(`DELETE FROM project_skills WHERE project_id = $1`, [
        projectId,
      ]);

      // Ajoute les nouvelles compétences
      if (skillIds.length > 0) {
        // Génère les paramètres ($1, $2), ($3, $4), ...
        const values = skillIds
          .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
          .join(", ");

        // Construit le tableau des valeurs [projectId, skillId, projectId, skillId, ...]
        const params = skillIds.flatMap((skillId) => [projectId, skillId]);

        await query(
          `INSERT INTO project_skills (project_id, skill_id) VALUES ${values}`,
          params,
        );
      }

      // Valide la transaction
      await query("COMMIT");

      // Retourne les compétences mises à jour
      return this.getSkillsByProjectId(projectId);
    } catch (error) {
      // Annule la transaction en cas d'erreur
      await query("ROLLBACK");
      throw error;
    }
  }

  /**
   * Supprime toutes les compétences d'un projet
   */
  async removeAllSkillsFromProject(projectId: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM project_skills WHERE project_id = $1`,
      [projectId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
