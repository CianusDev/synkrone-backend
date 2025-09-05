import { db } from "../../config/database";
import { Skill } from "./skill.model";

export class SkillRepository {
  async createSkill(skill: Partial<Skill>): Promise<Skill> {
    const { name, description, category_id } = skill;
    const created_at = new Date();
    const updated_at = new Date();

    const result = await db.query(
      "INSERT INTO skills (name, description, category_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, description, category_id, created_at, updated_at],
    );

    return result.rows[0];
  }

  async getSkillById(id: string): Promise<Skill | null> {
    const result = await db.query("SELECT * FROM skills WHERE id = $1", [id]);
    return result.rows[0] || null;
  }

  async getAllSkills(
    filter: { name?: string; category_id?: string },
    pagination: { page?: number; limit?: number },
  ): Promise<{ data: Skill[]; total: number }> {
    let baseQuery = "SELECT * FROM skills";
    let countQuery = "SELECT COUNT(*) FROM skills";
    const where: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (filter.name) {
      where.push(`LOWER(name) LIKE $${paramIdx}`);
      params.push(`%${filter.name.toLowerCase()}%`);
      paramIdx++;
    }
    if (filter.category_id) {
      where.push(`category_id = $${paramIdx}`);
      params.push(filter.category_id);
      paramIdx++;
    }

    let whereClause = "";
    if (where.length > 0) {
      whereClause = " WHERE " + where.join(" AND ");
    }

    // Pagination
    let limit =
      pagination.limit && pagination.limit > 0 ? pagination.limit : 10;
    let page = pagination.page && pagination.page > 0 ? pagination.page : 1;
    let offset = (page - 1) * limit;

    const finalQuery = `${baseQuery}${whereClause} ORDER BY name ASC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    const finalParams = [...params, limit, offset];

    const dataResult = await db.query(finalQuery, finalParams);

    // Count total
    const countResult = await db.query(`${countQuery}${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    return { data: dataResult.rows, total };
  }

  async updateSkill(
    id: string,
    skillData: Partial<Skill>,
  ): Promise<Skill | null> {
    const { name, description, category_id } = skillData;
    const updated_at = new Date();

    const result = await db.query(
      "UPDATE skills SET name = $1, description = $2, category_id = $3, updated_at = $4 WHERE id = $5 RETURNING *",
      [name, description, category_id, updated_at, id],
    );

    return result.rows[0] || null;
  }

  async deleteSkill(id: string): Promise<void> {
    await db.query("DELETE FROM skills WHERE id = $1", [id]);
  }
}
