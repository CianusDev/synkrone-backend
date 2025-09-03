import { db } from "../../config/database";
import { CategorySkill } from "./category-skill.model";

export class CategorySkillRepository {
  async createCategorySkill(
    data: Partial<CategorySkill>,
  ): Promise<CategorySkill> {
    const query = `
      INSERT INTO category_skills (name, slug, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [data.name, data.slug, data.description ?? null];
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error creating category skill:", error);
      throw new Error("Database error while creating category skill");
    }
  }

  async updateCategorySkill(
    categoryId: string,
    data: Partial<CategorySkill>,
  ): Promise<void> {
    const query = `
      UPDATE category_skills
      SET name = $1, slug = $2, description = $3, updated_at = NOW()
      WHERE id = $4
    `;
    const values = [data.name, data.slug, data.description ?? null, categoryId];
    try {
      await db.query(query, values);
    } catch (error) {
      console.error("Error updating category skill:", error);
      throw new Error("Database error while updating category skill");
    }
  }

  async getCategorySkillById(
    categoryId: string,
  ): Promise<CategorySkill | null> {
    const query = `
      SELECT * FROM category_skills
      WHERE id = $1
    `;
    const values = [categoryId];
    try {
      const result = await db.query(query, values);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error("Error retrieving category skill by ID:", error);
      throw new Error("Database error while retrieving category skill");
    }
  }

  /**
   * Récupère les catégories de compétences avec pagination et recherche par nom.
   * @param params { limit, offset, search }
   * @returns [CategorySkill[], total]
   */
  async getAllCategorySkills(params?: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<[CategorySkill[], number]> {
    const limit = typeof params?.limit === "number" ? params.limit : 10;
    const offset = typeof params?.offset === "number" ? params.offset : 0;
    const search = typeof params?.search === "string" ? params.search : "";

    let whereClause = "";
    const values: (string | number)[] = [];

    if (search) {
      whereClause = "WHERE LOWER(name) LIKE $1";
      values.push(`%${search.toLowerCase()}%`);
    }

    // Query for data
    const dataQuery = `
      SELECT * FROM category_skills
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;
    values.push(limit, offset);

    try {
      const dataResult = await db.query(dataQuery, values);

      // Query for total count
      let countQuery = "SELECT COUNT(*) FROM category_skills";
      const countValues: string[] = [];
      if (search) {
        countQuery += " WHERE LOWER(name) LIKE $1";
        countValues.push(`%${search.toLowerCase()}%`);
      }
      const countResult = await db.query(countQuery, countValues);
      const total = parseInt(countResult.rows[0].count, 10);

      return [dataResult.rows, total];
    } catch (error) {
      console.error("Error retrieving all category skills:", error);
      throw new Error("Database error while retrieving category skills");
    }
  }

  async getCategorySkillBySlug(slug: string): Promise<CategorySkill | null> {
    const query = `
      SELECT * FROM category_skills
      WHERE slug = $1
    `;
    const values = [slug];
    try {
      const result = await db.query(query, values);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error("Error retrieving category skill by slug:", error);
      throw new Error("Database error while retrieving category skill by slug");
    }
  }

  async deleteCategorySkill(categoryId: string): Promise<void> {
    const query = `
      DELETE FROM category_skills
      WHERE id = $1
    `;
    const values = [categoryId];
    try {
      await db.query(query, values);
    } catch (error) {
      console.error("Error deleting category skill:", error);
      throw new Error("Database error while deleting category skill");
    }
  }
}
