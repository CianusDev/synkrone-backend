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
    allowMultipleApplications?: boolean;
    levelExperience?: string;
    tjmProposed?: number;
  }): Promise<Project> {
    const result = await query<Project>(
      `INSERT INTO projects (
        title, description, budget_min, budget_max, deadline, duration_days, status, type_work, category_id, company_id, allow_multiple_applications, level_experience, tjm_proposed
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, title, description, budget_min AS "budgetMin", budget_max AS "budgetMax", deadline, duration_days, status, type_work AS "typeWork", category_id AS "categoryId", company_id AS "companyId", allow_multiple_applications AS "allowMultipleApplications", level_experience AS "levelExperience", tjm_proposed AS "tjmProposed", created_at AS "createdAt", updated_at AS "updatedAt", published_at AS "publishedAt"`,
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
        data.allowMultipleApplications ?? false,
        data.levelExperience ?? null,
        data.tjmProposed ?? null,
      ],
    );
    return result.rows[0];
  }

  /**
   * Récupère un projet par son id avec les informations de l'entreprise
   * Ajoute aussi le nombre total de candidatures et d'invitations
   */
  async getProjectById(id: string): Promise<Project | null> {
    const result = await query<any>(
      `SELECT
        p.id,
        p.title,
        p.description,
        p.budget_min AS "budgetMin",
        p.budget_max AS "budgetMax",
        p.deadline,
        p.duration_days AS "durationDays",
        p.status,
        p.type_work AS "typeWork",
        p.category_id AS "categoryId",
        p.company_id AS "companyId",
        p.allow_multiple_applications AS "allowMultipleApplications",
        p.level_experience AS "levelExperience",
        p.tjm_proposed AS "tjmProposed",
        p.created_at AS "createdAt",
        p.updated_at AS "updatedAt",
        p.published_at AS "publishedAt",
        (
          SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id AND a.status IN ('submitted', 'accepted', 'under_review')
        ) AS "applicationsCount",
        (
          SELECT COUNT(*) FROM project_invitations i WHERE i.project_id = p.id
        ) AS "invitationsCount",
        json_build_object(
          'id', c.id,
          'company_name', c.company_name,
          'company_email', c.company_email,
          'logo_url', c.logo_url,
          'company_description', c.company_description,
          'industry', c.industry,
          'website_url', c.website_url,
          'address', c.address,
          'company_size', c.company_size,
          'is_certified', c.is_certified,
          'is_verified', c.is_verified,
          'country', c.country,
          'city', c.city,
          'company_phone', c.company_phone,
          'created_at', c.created_at,
          'updated_at', c.updated_at
        ) AS company
       FROM projects p
       INNER JOIN companies c ON p.company_id = c.id
       WHERE p.id = $1`,
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
    if (data.publishedAt !== undefined) {
      fields.push(`published_at = $${idx++}`);
      values.push(data.publishedAt);
    }
    if (data.allowMultipleApplications !== undefined) {
      fields.push(`allow_multiple_applications = $${idx++}`);
      values.push(data.allowMultipleApplications);
    }
    if (data.levelExperience !== undefined) {
      fields.push(`level_experience = $${idx++}`);
      values.push(data.levelExperience);
    }
    if (data.tjmProposed !== undefined) {
      fields.push(`tjm_proposed = $${idx++}`);
      values.push(data.tjmProposed);
    }

    if (fields.length === 0) return this.getProjectById(id);

    const queryText = `
       UPDATE projects SET ${fields.join(", ")}
       WHERE id = $1
       RETURNING id, title, description, budget_min AS "budgetMin", budget_max AS "budgetMax", deadline, duration_days, status, type_work AS "typeWork", category_id AS "categoryId", company_id AS "companyId", allow_multiple_applications AS "allowMultipleApplications", level_experience AS "levelExperience", tjm_proposed AS "tjmProposed", published_at AS "publishedAt", created_at AS "createdAt", updated_at AS "updatedAt"
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
    levelExperience?: string;
    allowMultipleApplications?: boolean;
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
        p.allow_multiple_applications AS "allowMultipleApplications",
        p.level_experience AS "levelExperience",
        p.tjm_proposed AS "tjmProposed",
        p.created_at AS "createdAt",
        p.updated_at AS "updatedAt",
        p.published_at AS "publishedAt",
        (
          SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id AND a.status IN ('submitted', 'accepted', 'under_review')
        ) AS "applicationsCount",
        (
          SELECT COUNT(*) FROM project_invitations i WHERE i.project_id = p.id
        ) AS "invitationsCount",
        json_build_object(
          'id', c.id,
          'company_name', c.company_name,
          'company_email', c.company_email,
          'logo_url', c.logo_url,
          'company_description', c.company_description,
          'industry', c.industry,
          'website_url', c.website_url,
          'address', c.address,
          'company_size', c.company_size,
          'is_certified', c.is_certified,
          'is_verified', c.is_verified,
          'country', c.country,
          'city', c.city,
          'company_phone', c.company_phone,
          'created_at', c.created_at,
          'updated_at', c.updated_at
        ) AS company
      FROM projects p
      INNER JOIN companies c ON p.company_id = c.id
    `;
    let countQuery = `SELECT COUNT(*) AS total FROM projects p INNER JOIN companies c ON p.company_id = c.id`;
    const conditions = [];
    const whereValues = [];
    let paramIdx = 1;

    // Construction des conditions WHERE
    if (params?.status) {
      conditions.push(`p.status = $${paramIdx++}`);
      whereValues.push(params.status);
    }
    if (params?.typeWork) {
      conditions.push(`p.type_work = $${paramIdx++}`);
      whereValues.push(params.typeWork);
    }
    if (params?.companyId) {
      conditions.push(`p.company_id = $${paramIdx++}`);
      whereValues.push(params.companyId);
    }
    if (params?.categoryId) {
      conditions.push(`p.category_id = $${paramIdx++}`);
      whereValues.push(params.categoryId);
    }
    if (params?.levelExperience) {
      conditions.push(`p.level_experience = $${paramIdx++}`);
      whereValues.push(params.levelExperience);
    }
    if (params?.allowMultipleApplications !== undefined) {
      conditions.push(`p.allow_multiple_applications = $${paramIdx++}`);
      whereValues.push(params.allowMultipleApplications);
    }
    if (params?.search) {
      conditions.push(
        `(p.title ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx + 1})`,
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
    queryText += " ORDER BY p.created_at DESC";

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
   * Récupère les projets récemment publiés avec les informations de l'entreprise
   */
  async getRecentlyPublishedProjects(limit: number = 5): Promise<Project[]> {
    const result = await query<Project>(
      `SELECT
        p.id,
        p.title,
        p.description,
        p.budget_min AS "budgetMin",
        p.budget_max AS "budgetMax",
        p.deadline,
        p.duration_days AS "durationDays",
        p.status,
        p.type_work AS "typeWork",
        p.category_id AS "categoryId",
        p.company_id AS "companyId",
        p.allow_multiple_applications AS "allowMultipleApplications",
        p.level_experience AS "levelExperience",
        p.tjm_proposed AS "tjmProposed",
        p.created_at AS "createdAt",
        p.updated_at AS "updatedAt",
        json_build_object(
          'id', c.id,
          'company_name', c.company_name,
          'company_email', c.company_email,
          'logo_url', c.logo_url,
          'company_description', c.company_description,
          'industry', c.industry,
          'website_url', c.website_url,
          'address', c.address,
          'company_size', c.company_size,
          'is_certified', c.is_certified,
          'is_verified', c.is_verified,
          'country', c.country,
          'city', c.city,
          'company_phone', c.company_phone,
          'created_at', c.created_at,
          'updated_at', c.updated_at
        ) AS company
      FROM projects p
      INNER JOIN companies c ON p.company_id = c.id
      WHERE p.status = 'published'
      ORDER BY p.created_at DESC
      LIMIT $1`,
      [limit],
    );
    return result.rows;
  }

  /**
   * Récupère les missions (projets avec contrats actifs) d'un freelance
   */
  async getFreelanceMissions(
    freelanceId: string,
    params?: {
      search?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{
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
        p.duration_days AS "durationDays",
        p.status,
        p.type_work AS "typeWork",
        p.category_id AS "categoryId",
        p.company_id AS "companyId",
        p.allow_multiple_applications AS "allowMultipleApplications",
        p.level_experience AS "levelExperience",
        p.tjm_proposed AS "tjmProposed",
        p.created_at AS "createdAt",
        p.updated_at AS "updatedAt",
        p.published_at AS "publishedAt",
        json_build_object(
          'id', c.id,
          'company_name', c.company_name,
          'company_email', c.company_email,
          'logo_url', c.logo_url,
          'company_description', c.company_description,
          'industry', c.industry,
          'website_url', c.website_url,
          'address', c.address,
          'company_size', c.company_size,
          'is_certified', c.is_certified,
          'is_verified', c.is_verified,
          'country', c.country,
          'city', c.city,
          'company_phone', c.company_phone,
          'created_at', c.created_at,
          'updated_at', c.updated_at
        ) AS company,
        json_build_object(
          'id', ct.id,
          'status', ct.status,
          'payment_mode', ct.payment_mode,
          'total_amount', ct.total_amount,
          'tjm', ct.tjm,
          'estimated_days', ct.estimated_days,
          'start_date', ct.start_date,
          'end_date', ct.end_date,
          'created_at', ct.created_at
        ) AS contract
      FROM projects p
      INNER JOIN companies c ON p.company_id = c.id
      INNER JOIN contracts ct ON p.id = ct.project_id
      WHERE ct.freelance_id = $1
      AND ct.status = 'active'
    `;

    let countQuery = `
      SELECT COUNT(*) AS total
      FROM projects p
      INNER JOIN contracts ct ON p.id = ct.project_id
      WHERE ct.freelance_id = $1
      AND ct.status = 'active'
    `;

    const conditions = [];
    const whereValues = [freelanceId];
    let paramIdx = 2;

    // Construction des conditions WHERE supplémentaires
    if (params?.search) {
      conditions.push(
        `(p.title ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx + 1})`,
      );
      whereValues.push(`%${params.search}%`);
      whereValues.push(`%${params.search}%`);
      paramIdx += 2;
    }

    // Ajout des conditions WHERE supplémentaires
    if (conditions.length > 0) {
      const additionalWhere = " AND " + conditions.join(" AND ");
      queryText += additionalWhere;
      countQuery += additionalWhere;
    }

    // Ordre
    queryText += " ORDER BY p.created_at DESC";

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
}
