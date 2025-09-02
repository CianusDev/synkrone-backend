import { db } from "../../config/database";
import { Skill } from "./skill.model";

export class SkillRepository {
  async createSkill(skill: Partial<Skill>): Promise<Skill> {
    const { name, description, category_id } = skill;
    const created_at = new Date();
    const updated_at = new Date();

    const result = await db.query(
      "INSERT INTO skills (name, description, category_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?) RETURNING *",
      [name, description, category_id, created_at, updated_at],
    );

    return result.rows[0];
  }

  async getSkillById(id: string): Promise<Skill | null> {
    const result = await db.query("SELECT * FROM skills WHERE id = $1", [id]);
    return result.rows[0] || null;
  }

  async updateSkill(
    id: string,
    skillData: Partial<Skill>,
  ): Promise<Skill | null> {
    const { name, description, category_id } = skillData;
    const updated_at = new Date();

    const result = await db.query(
      "UPDATE skills SET name = $1, description = $2, category_id = $3, updated_at = $4 WHERE id = $4 RETURNING *",
      [name, description, category_id, updated_at, id],
    );

    return result.rows[0] || null;
  }

  async deleteSkill(id: string): Promise<void> {
    await db.query("DELETE FROM skills WHERE id = $1", [id]);
  }
}
