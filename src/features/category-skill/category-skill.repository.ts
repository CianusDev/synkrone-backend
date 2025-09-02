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

  async getAllCategorySkills(): Promise<CategorySkill[]> {
    const query = `
      SELECT * FROM category_skills
      ORDER BY created_at DESC
    `;
    try {
      const result = await db.query(query);
      return result.rows;
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
