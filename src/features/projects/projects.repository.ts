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
    budgetMin?: number;
    budgetMax?: number;
    location?: string;
    deadline?: string;
    status?: ProjectStatus;
    typeWork?: TypeWork;
    categoryId?: string;
    companyId: string;
    durationDays?: number;
  }): Promise<Project> {
    const result = await query<Project>(
      `INSERT INTO projects (
        title, description, budget_min, budget_max, deadline, duration_days, status, type_work, category_id, company_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, title, description, budget_min AS "budgetMin", budget_max AS "budgetMax", deadline, duration_days, status, type_work AS "typeWork", category_id AS "categoryId", company_id AS "companyId", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        data.title,
        data.description ?? null,
        data.budgetMin ?? null,
        data.budgetMax ?? null,
        data.deadline ?? null,
        data.durationDays ?? null,
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
      `SELECT id, title, description, budget_min AS "budgetMin", budget_max AS "budgetMax", deadline, duration_days AS "durationDays", status, type_work AS "typeWork", category_id AS "categoryId", company_id AS "companyId", created_at AS "createdAt", updated_at AS "updatedAt"
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
    if (data.budgetMin !== undefined) {
      fields.push(`budget_min = $${idx++}`);
      values.push(data.budgetMin);
    }
    if (data.budgetMax !== undefined) {
      fields.push(`budget_max = $${idx++}`);
      values.push(data.budgetMax);
    }
    if (data.deadline !== undefined) {
      fields.push(`deadline = $${idx++}`);
      values.push(data.deadline);
    }
    if (data.durationDays !== undefined) {
      fields.push(`duration_days = $${idx++}`);
      values.push(data.durationDays);
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
      RETURNING id, title, description, budget_min AS "budgetMin", budget_max AS "budgetMax", deadline, duration_days, status, type_work AS "typeWork", category_id AS "categoryId", company_id AS "companyId", created_at AS "createdAt", updated_at AS "updatedAt"
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
    let queryText = `
      SELECT
        p.id,
        p.title,
        p.description,
        p.budget_min AS "budgetMin",
        p.budget_max AS "budgetMax",
        p.deadline,
        p.duration_days,
        p.status,
        p.type_work AS "typeWork",
        p.category_id AS "categoryId",
        p.company_id AS "companyId",
        p.created_at AS "createdAt",
        p.updated_at AS "updatedAt",
        p.published_at AS "publishedAt",
        (
          SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id
        ) AS "applicationsCount",
        (
          SELECT COUNT(*) FROM project_invitations i WHERE i.project_id = p.id
        ) AS "invitationsCount"
      FROM projects p
    `;
    let countQuery = `SELECT COUNT(*) AS total FROM projects`;
    const conditions = [];
    const whereValues = [];
    let paramIdx = 1;

    // Construction des conditions WHERE
    if (params?.status) {
      conditions.push(`status = $${paramIdx++}`);
      whereValues.push(params.status);
    }
    if (params?.typeWork) {
      conditions.push(`type_work = $${paramIdx++}`);
      whereValues.push(params.typeWork);
    }
    if (params?.companyId) {
      conditions.push(`company_id = $${paramIdx++}`);
      whereValues.push(params.companyId);
    }
    if (params?.categoryId) {
      conditions.push(`category_id = $${paramIdx++}`);
      whereValues.push(params.categoryId);
    }
    if (params?.search) {
      conditions.push(
        `(title ILIKE $${paramIdx} OR description ILIKE $${paramIdx + 1})`,
      );
      whereValues.push(`%${params.search}%`);
      whereValues.push(`%${params.search}%`);
      paramIdx += 2;
    }

    // Ajout des conditions WHERE
    let whereClause = "";
    if (conditions.length > 0) {
      whereClause = " WHERE " + conditions.join(" AND ");
      queryText += whereClause;
      countQuery += whereClause;
    }

    // Ordre
    queryText += " ORDER BY created_at DESC";

    // Pagination
    const finalQueryValues = [...whereValues];
    if (params?.limit) {
      queryText += ` LIMIT $${paramIdx++}`;
      finalQueryValues.push(params.limit.toString());
    }
    if (params?.offset) {
      queryText += ` OFFSET $${paramIdx++}`;
      finalQueryValues.push(params.offset.toString());
    }

    // Exécution des requêtes
    const [result, countResult] = await Promise.all([
      query<Project>(queryText, finalQueryValues),
      query(countQuery, whereValues), // Utilise seulement les paramètres WHERE, pas limit/offset
    ]);

    const total = parseInt(countResult.rows[0]?.total ?? "0", 10);

    return {
      data: result.rows,
      total,
      limit: params?.limit ?? 10,
      offset: params?.offset ?? 0,
    };
  }

  /**
   * Récupère les projets récemment publiés
   */
  async getRecentlyPublishedProjects(limit: number = 5): Promise<Project[]> {
    const result = await query<Project>(
      `SELECT
        id,
        title,
        description,
        budget_min AS "budgetMin",
        budget_max AS "budgetMax",
        deadline,
        duration_days AS "durationDays",
        status,
        type_work AS "typeWork",
        category_id AS "categoryId",
        company_id AS "companyId",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM projects
      WHERE status = 'published'
      ORDER BY created_at DESC
      LIMIT $1`,
      [limit],
    );
    return result.rows;
  }
}
