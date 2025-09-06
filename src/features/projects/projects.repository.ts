import { query } from "../../config/database";
import { Project, ProjectStatus, TypeWork } from "./projects.model";

export class ProjectsRepository {
  /**
   * Vérifie si une catégorie existe
   */
  async categoryExists(categoryId: string): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM project_categories WHERE id = $1 LIMIT 1`,
      [categoryId],
    );
    return result.rows.length > 0;
  }

  /**
   * Vérifie si une entreprise existe
   */
  async companyExists(companyId: string): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM companies WHERE id = $1 LIMIT 1`,
      [companyId],
    );
    return result.rows.length > 0;
  }
  /**
   * Crée un projet
   */
  async createProject(data: {
    title: string;
    description?: string;
    budget?: number;
    deadline?: string;
    status?: ProjectStatus;
    typeWork?: TypeWork;
    categoryId?: string;
    companyId: string;
  }): Promise<Project> {
    const result = await query<Project>(
      `INSERT INTO projects (
        title, description, budget, deadline, status, type_work, category_id, company_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, title, description, budget, deadline, status, type_work AS "typeWork", category_id AS "categoryId", company_id AS "companyId", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        data.title,
        data.description ?? null,
        data.budget ?? null,
        data.deadline ?? null,
        data.status ?? ProjectStatus.DRAFT,
        data.typeWork ?? null,
        data.categoryId ?? null,
        data.companyId,
      ],
    );
    return result.rows[0];
  }

  /**
   * Récupère un projet par son id
   */
  async getProjectById(id: string): Promise<Project | null> {
    const result = await query<Project>(
      `SELECT id, title, description, budget, deadline, status, type_work AS "typeWork", category_id AS "categoryId", company_id AS "companyId", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM projects WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  /**
   * Met à jour un projet
   */
  async updateProject(
    id: string,
    data: Partial<Omit<Project, "id" | "createdAt" | "updatedAt">>,
  ): Promise<Project | null> {
    const fields = [];
    const values = [];
    let idx = 2;

    if (data.title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(data.title);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(data.description);
    }
    if (data.budget !== undefined) {
      fields.push(`budget = $${idx++}`);
      values.push(data.budget);
    }
    if (data.deadline !== undefined) {
      fields.push(`deadline = $${idx++}`);
      values.push(data.deadline);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }
    if (data.typeWork !== undefined) {
      fields.push(`type_work = $${idx++}`);
      values.push(data.typeWork);
    }
    if (data.categoryId !== undefined) {
      fields.push(`category_id = $${idx++}`);
      values.push(data.categoryId);
    }
    if (data.companyId !== undefined) {
      fields.push(`company_id = $${idx++}`);
      values.push(data.companyId);
    }

    if (fields.length === 0) return this.getProjectById(id);

    const queryText = `
      UPDATE projects SET ${fields.join(", ")}
      WHERE id = $1
      RETURNING id, title, description, budget, deadline, status, type_work AS "typeWork", category_id AS "categoryId", company_id AS "companyId", created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    const result = await query<Project>(queryText, [id, ...values]);
    return result.rows[0] ?? null;
  }

  /**
   * Supprime un projet
   */
  async deleteProject(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM projects WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Liste les projets (optionnel: filtrer par status, typeWork, companyId, categoryId)
   */
  async listProjects(params?: {
    status?: ProjectStatus;
    typeWork?: TypeWork;
    companyId?: string;
    categoryId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    data: Project[];
    total: number;
    limit: number;
    offset: number;
  }> {
    let queryText = `SELECT id, title, description, budget, deadline, status, type_work AS "typeWork", category_id AS "categoryId", company_id AS "companyId", created_at AS "createdAt", updated_at AS "updatedAt" FROM projects`;
    let countQuery = `SELECT COUNT(*) AS total FROM projects`;
    const conditions = [];
    const values = [];
    let idx = 1;

    if (params?.status) {
      conditions.push(`status = $${idx++}`);
      values.push(params.status);
    }
    if (params?.typeWork) {
      conditions.push(`type_work = $${idx++}`);
      values.push(params.typeWork);
    }
    if (params?.companyId) {
      conditions.push(`company_id = $${idx++}`);
      values.push(params.companyId);
    }
    if (params?.categoryId) {
      conditions.push(`category_id = $${idx++}`);
      values.push(params.categoryId);
    }
    if (params?.search) {
      conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`);
      values.push(`%${params.search}%`);
      idx++;
    }
    if (conditions.length) {
      queryText += " WHERE " + conditions.join(" AND ");
      countQuery += " WHERE " + conditions.join(" AND ");
    }
    queryText += " ORDER BY created_at DESC";

    if (params?.limit) {
      queryText += ` LIMIT $${idx++}`;
      values.push(params.limit);
    }
    if (params?.offset) {
      queryText += ` OFFSET $${idx++}`;
      values.push(params.offset);
    }

    const result = await query<Project>(queryText, values);
    // Pour le count, on retire limit/offset
    const countValues = values.slice(
      0,
      idx - (params?.limit ? 1 : 0) - (params?.offset ? 1 : 0),
    );
    const countResult = await query(countQuery, countValues);
    const total = parseInt(countResult.rows[0]?.total ?? "0", 10);

    return {
      data: result.rows,
      total,
      limit: params?.limit ?? 10,
      offset: params?.offset ?? 0,
    };
  }
}
