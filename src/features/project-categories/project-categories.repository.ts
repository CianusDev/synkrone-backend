import { db } from "../../config/database";
import { ProjectCategory } from "./project-categories.model";

export class ProjectCategoriesRepository {
  async createCategory(
    data: Partial<ProjectCategory>,
  ): Promise<ProjectCategory> {
    const query = `
      INSERT INTO project_categories (name, description, icon, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [
      data.name,
      data.description ?? null,
      data.icon ?? null,
      data.is_active ?? true,
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  async getCategoryById(id: string): Promise<ProjectCategory | null> {
    const query = `SELECT * FROM project_categories WHERE id = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Récupère les catégories avec pagination et recherche par nom.
   * @param params { limit, offset, search }
   * @returns [ProjectCategory[], total]
   */
  async getAllCategories(params?: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<[ProjectCategory[], number]> {
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
     SELECT * FROM project_categories
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${values.length + 1}
     OFFSET $${values.length + 2}
   `;
    values.push(limit, offset);

    const dataResult = await db.query(dataQuery, values);

    // Query for total count
    let countQuery = "SELECT COUNT(*) FROM project_categories";
    const countValues: string[] = [];
    if (search) {
      countQuery += " WHERE LOWER(name) LIKE $1";
      countValues.push(`%${search.toLowerCase()}%`);
    }
    const countResult = await db.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count, 10);

    return [dataResult.rows, total];
  }

  async updateCategory(
    id: string,
    data: Partial<ProjectCategory>,
  ): Promise<ProjectCategory | null> {
    const query = `
      UPDATE project_categories
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        icon = COALESCE($3, icon),
        is_active = COALESCE($4, is_active),
        updated_at = NOW()
      WHERE id = $5
      RETURNING *;
    `;
    const values = [
      data.name,
      data.description ?? null,
      data.icon ?? null,
      data.is_active,
      id,
    ];
    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const query = `DELETE FROM project_categories WHERE id = $1`;
    const result = await db.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getCategoryByName(name: string): Promise<ProjectCategory | null> {
    const query = `SELECT * FROM project_categories WHERE name = $1`;
    const result = await db.query(query, [name]);
    return result.rows[0] || null;
  }
}
