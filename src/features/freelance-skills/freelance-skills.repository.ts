import { db } from "../../config/database";
import { FreelanceSkills } from "./freelance-skills.model";

export class FreelanceSkillsRepository {
  /**
   * Crée une nouvelle compétence pour un freelance dans la base de données
   * @param freelanceSkills - Les données de la compétence à créer
   * @returns La compétence créée
   */
  async createFreelanceSkills(
    freelanceSkills: Partial<FreelanceSkills>,
  ): Promise<FreelanceSkills> {
    const query = `
        INSERT INTO freelance_skills (
            freelance_id, skill_id
        ) VALUES (
            $1, $2
        ) RETURNING *`;

    const values = [freelanceSkills.freelance_id, freelanceSkills.skill_id];

    try {
      const result = await db.query(query, values);
      return result.rows[0] as FreelanceSkills;
    } catch (error) {
      console.error("Error creating freelance skills:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Récupère les compétences d'un freelance par son ID
   * @param freelanceId - L'ID du freelance dont on veut récupérer les compétences
   * @returns Un tableau de compétences du freelance ou un tableau vide si aucune compétence trouvée
   */
  async getFreelanceSkillsByFreelanceId(
    freelance_id: string,
  ): Promise<FreelanceSkills[]> {
    const query = `
        SELECT * FROM freelance_skills WHERE freelance_id = $1`;

    try {
      const result = await db.query(query, [freelance_id]);
      return result.rows as FreelanceSkills[];
    } catch (error) {
      console.error("Error fetching freelance skills by ID:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Récupère une compétence d'un freelance par son ID
   * @param id - L'ID de la compétence à récupérer
   * @returns La compétence du freelance ou un tableau vide si non trouvée
   */
  async getFreelanceSkillsById(id: string): Promise<FreelanceSkills[]> {
    const query = `
      SELECT * FROM freelance_skills WHERE skill_id = $1`;

    try {
      const result = await db.query(query, [id]);
      return result.rows as FreelanceSkills[];
    } catch (error) {
      console.error("Error fetching freelance skills by ID:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Met à jour une compétence d'un freelance
   * @param id - L'ID de la compétence à mettre à jour
   * @param freelanceSkillsData - Les données de la compétence à mettre à jour
   * @returns La compétence mise à jour ou null si non trouvée
   */
  async updateFreelanceSkills(
    id: string,
    freelanceSkillsData: Partial<FreelanceSkills>,
  ): Promise<FreelanceSkills | null> {
    const query = `
        UPDATE freelance_skills
        SET skill_id = $1, level = $2, created_at = $3
        WHERE id = $4
        RETURNING *`;

    const values = [
      freelanceSkillsData.skill_id,
      freelanceSkillsData.level,
      new Date(),
      id,
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0] as FreelanceSkills;
    } catch (error) {
      console.error("Error updating freelance skills:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Supprime une compétence d'un freelance
   * @param id - L'ID de la compétence à supprimer
   * @returns true si la compétence a été supprimée, false si non trouvée
   */
  async deleteFreelanceSkills(id: string): Promise<boolean> {
    const query = `
        DELETE FROM freelance_skills WHERE skill_id = $1 RETURNING *`;

    try {
      const result = await db.query(query, [id]);
      // Handle possible null value for result.rowCount
      if (result.rowCount === null) {
        return false;
      }
      return result.rowCount > 0; // Retourne true si une ligne a été supprimée
    } catch (error) {
      console.error("Error deleting freelance skills:", error);
      throw new Error("Database error");
    }
  }
}
