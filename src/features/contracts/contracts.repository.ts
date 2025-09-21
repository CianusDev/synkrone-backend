import {
  Contract,
  ContractStatus,
  PaymentMode,
  CreateContractData,
} from "./contracts.model";
import { query } from "../../config/database";

export class ContractsRepository {
  /**
   * Crée un nouveau contrat
   * @param contract - Données du contrat
   * @returns Le contrat créé
   */
  async createContract(contract: CreateContractData): Promise<Contract> {
    const sql = `
      INSERT INTO contracts (
        application_id,
        project_id,
        freelance_id,
        company_id,
        payment_mode,
        total_amount,
        tjm,
        estimated_days,
        terms,
        start_date,
        end_date,
        status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING
        id,
        application_id,
        project_id,
        freelance_id,
        company_id,
        payment_mode,
        total_amount,
        tjm,
        estimated_days,
        terms,
        start_date,
        end_date,
        status,
        created_at;
    `;
    const values = [
      contract.application_id,
      contract.project_id,
      contract.freelance_id,
      contract.company_id,
      contract.payment_mode,
      contract.total_amount ?? null,
      contract.tjm ?? null,
      contract.estimated_days ?? null,
      contract.terms ?? null,
      contract.start_date ?? null,
      contract.end_date ?? null,
      contract.status || ContractStatus.DRAFT,
    ];
    try {
      const result = await query<Contract>(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error("Erreur lors de la création du contrat :", error);
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Récupère un contrat par son ID
   * @param id - UUID du contrat
   * @returns Le contrat ou null si non trouvé
   */
  async getContractById(id: string): Promise<Contract | null> {
    const sql = `
      SELECT
        c.id,
        c.application_id,
        c.project_id,
        c.freelance_id,
        c.company_id,
        c.payment_mode,
        c.total_amount,
        c.tjm,
        c.estimated_days,
        c.terms,
        c.start_date,
        c.end_date,
        c.status,
        c.created_at,
        json_build_object(
          'id', p.id,
          'title', p.title,
          'description', p.description,
          'budgetMin', p.budget_min,
          'budgetMax', p.budget_max,
          'deadline', p.deadline,
          'durationDays', p.duration_days,
          'status', p.status,
          'typeWork', p.type_work,
          'categoryId', p.category_id,
          'companyId', p.company_id,
          'allowMultipleApplications', p.allow_multiple_applications,
          'levelExperience', p.level_experience,
          'tjmProposed', p.tjm_proposed,
          'createdAt', p.created_at,
          'updatedAt', p.updated_at,
          'publishedAt', p.published_at
        ) AS project,
        json_build_object(
          'id', f.id,
          'firstname', f.firstname,
          'lastname', f.lastname,
          'email', f.email,
          'photo_url', f.photo_url,
          'job_title', f.job_title,
          'experience', f.experience,
          'description', f.description,
          'cover_url', f.cover_url,
          'linkedin_url', f.linkedin_url,
          'tjm', f.tjm,
          'availability', f.availability,
          'location', f.location,
          'is_verified', f.is_verified,
          'country', f.country,
          'city', f.city,
          'phone', f.phone,
          'created_at', f.created_at,
          'updated_at', f.updated_at
        ) AS freelance
      FROM contracts c
      LEFT JOIN projects p ON c.project_id = p.id
      LEFT JOIN freelances f ON c.freelance_id = f.id
      WHERE c.id = $1;
    `;
    try {
      const result = await query<Contract>(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du contrat par ID :",
        error,
      );
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Récupère tous les contrats d'un freelance avec pagination
   */
  async getContractsByFreelanceId(
    freelanceId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: Contract[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const _page = page && page > 0 ? page : 1;
    const _limit = limit && limit > 0 ? limit : 10;
    const offset = (_page - 1) * _limit;

    const sql = `
      SELECT
        c.id,
        c.application_id,
        c.project_id,
        c.freelance_id,
        c.company_id,
        c.payment_mode,
        c.total_amount,
        c.tjm,
        c.estimated_days,
        c.terms,
        c.start_date,
        c.end_date,
        c.status,
        c.created_at,
        json_build_object(
          'id', p.id,
          'title', p.title,
          'description', p.description,
          'budgetMin', p.budget_min,
          'budgetMax', p.budget_max,
          'deadline', p.deadline,
          'durationDays', p.duration_days,
          'status', p.status,
          'typeWork', p.type_work,
          'categoryId', p.category_id,
          'companyId', p.company_id,
          'allowMultipleApplications', p.allow_multiple_applications,
          'levelExperience', p.level_experience,
          'tjmProposed', p.tjm_proposed,
          'createdAt', p.created_at,
          'updatedAt', p.updated_at,
          'publishedAt', p.published_at
        ) AS project,
        json_build_object(
          'id', f.id,
          'firstname', f.firstname,
          'lastname', f.lastname,
          'email', f.email,
          'photo_url', f.photo_url,
          'job_title', f.job_title,
          'experience', f.experience,
          'description', f.description,
          'cover_url', f.cover_url,
          'linkedin_url', f.linkedin_url,
          'tjm', f.tjm,
          'availability', f.availability,
          'location', f.location,
          'is_verified', f.is_verified,
          'country', f.country,
          'city', f.city,
          'phone', f.phone,
          'created_at', f.created_at,
          'updated_at', f.updated_at
        ) AS freelance
      FROM contracts c
      LEFT JOIN projects p ON c.project_id = p.id
      LEFT JOIN freelances f ON c.freelance_id = f.id
      WHERE c.freelance_id = $1
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    const countQuery = `SELECT COUNT(*) AS total FROM contracts c WHERE c.freelance_id = $1;`;
    try {
      const dataResult = await query<Contract>(sql, [
        freelanceId,
        _limit,
        offset,
      ]);
      const countResult = await query(countQuery, [freelanceId]);
      const total = parseInt(countResult.rows[0]?.total ?? "0", 10);
      const totalPages = Math.ceil(total / _limit);
      return {
        data: dataResult.rows,
        total,
        page: _page,
        limit: _limit,
        totalPages,
      };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des contrats par freelance :",
        error,
      );
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Récupère tous les contrats d'une entreprise avec pagination
   */
  async getContractsByCompanyId(
    companyId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: Contract[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const _page = page && page > 0 ? page : 1;
    const _limit = limit && limit > 0 ? limit : 10;
    const offset = (_page - 1) * _limit;

    const sql = `
      SELECT
        c.id,
        c.application_id,
        c.project_id,
        c.freelance_id,
        c.company_id,
        c.payment_mode,
        c.total_amount,
        c.tjm,
        c.estimated_days,
        c.terms,
        c.start_date,
        c.end_date,
        c.status,
        c.created_at,
        json_build_object(
          'id', p.id,
          'title', p.title,
          'description', p.description,
          'budgetMin', p.budget_min,
          'budgetMax', p.budget_max,
          'deadline', p.deadline,
          'durationDays', p.duration_days,
          'status', p.status,
          'typeWork', p.type_work,
          'categoryId', p.category_id,
          'companyId', p.company_id,
          'allowMultipleApplications', p.allow_multiple_applications,
          'levelExperience', p.level_experience,
          'tjmProposed', p.tjm_proposed,
          'createdAt', p.created_at,
          'updatedAt', p.updated_at,
          'publishedAt', p.published_at
        ) AS project,
        json_build_object(
          'id', f.id,
          'firstname', f.firstname,
          'lastname', f.lastname,
          'email', f.email,
          'photo_url', f.photo_url,
          'job_title', f.job_title,
          'experience', f.experience,
          'description', f.description,
          'cover_url', f.cover_url,
          'linkedin_url', f.linkedin_url,
          'tjm', f.tjm,
          'availability', f.availability,
          'location', f.location,
          'is_verified', f.is_verified,
          'country', f.country,
          'city', f.city,
          'phone', f.phone,
          'created_at', f.created_at,
          'updated_at', f.updated_at
        ) AS freelance
      FROM contracts c
      LEFT JOIN projects p ON c.project_id = p.id
      LEFT JOIN freelances f ON c.freelance_id = f.id
      WHERE c.company_id = $1
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    const countQuery = `SELECT COUNT(*) AS total FROM contracts c WHERE c.company_id = $1;`;
    try {
      const dataResult = await query<Contract>(sql, [
        companyId,
        _limit,
        offset,
      ]);
      const countResult = await query(countQuery, [companyId]);
      const total = parseInt(countResult.rows[0]?.total ?? "0", 10);
      const totalPages = Math.ceil(total / _limit);
      return {
        data: dataResult.rows,
        total,
        page: _page,
        limit: _limit,
        totalPages,
      };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des contrats par entreprise :",
        error,
      );
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Récupère tous les contrats d'un projet avec pagination
   */
  async getContractsByProjectId(
    projectId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: Contract[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const _page = page && page > 0 ? page : 1;
    const _limit = limit && limit > 0 ? limit : 10;
    const offset = (_page - 1) * _limit;

    const sql = `
      SELECT
        c.id,
        c.application_id,
        c.project_id,
        c.freelance_id,
        c.company_id,
        c.payment_mode,
        c.total_amount,
        c.tjm,
        c.estimated_days,
        c.terms,
        c.start_date,
        c.end_date,
        c.status,
        c.created_at,
        json_build_object(
          'id', p.id,
          'title', p.title,
          'description', p.description,
          'budgetMin', p.budget_min,
          'budgetMax', p.budget_max,
          'deadline', p.deadline,
          'durationDays', p.duration_days,
          'status', p.status,
          'typeWork', p.type_work,
          'categoryId', p.category_id,
          'companyId', p.company_id,
          'allowMultipleApplications', p.allow_multiple_applications,
          'levelExperience', p.level_experience,
          'tjmProposed', p.tjm_proposed,
          'createdAt', p.created_at,
          'updatedAt', p.updated_at,
          'publishedAt', p.published_at
        ) AS project,
        json_build_object(
          'id', f.id,
          'firstname', f.firstname,
          'lastname', f.lastname,
          'email', f.email,
          'photo_url', f.photo_url,
          'job_title', f.job_title,
          'experience', f.experience,
          'description', f.description,
          'cover_url', f.cover_url,
          'linkedin_url', f.linkedin_url,
          'tjm', f.tjm,
          'availability', f.availability,
          'location', f.location,
          'is_verified', f.is_verified,
          'country', f.country,
          'city', f.city,
          'phone', f.phone,
          'created_at', f.created_at,
          'updated_at', f.updated_at
        ) AS freelance
      FROM contracts c
      LEFT JOIN projects p ON c.project_id = p.id
      LEFT JOIN freelances f ON c.freelance_id = f.id
      WHERE c.project_id = $1
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    const countQuery = `SELECT COUNT(*) AS total FROM contracts c WHERE c.project_id = $1;`;
    try {
      const dataResult = await query<Contract>(sql, [
        projectId,
        _limit,
        offset,
      ]);
      const countResult = await query(countQuery, [projectId]);
      const total = parseInt(countResult.rows[0]?.total ?? "0", 10);
      const totalPages = Math.ceil(total / _limit);
      return {
        data: dataResult.rows,
        total,
        page: _page,
        limit: _limit,
        totalPages,
      };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des contrats par projet :",
        error,
      );
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Met à jour le statut d'un contrat
   */
  async updateContractStatus(
    id: string,
    status: ContractStatus,
  ): Promise<Contract | null> {
    const updateSql = `
      UPDATE contracts
      SET status = $1
      WHERE id = $2
      RETURNING id;
    `;
    const values = [status, id];
    try {
      const updateResult = await query(updateSql, values);
      if (updateResult.rows.length === 0) {
        return null;
      }

      // Récupérer le contrat mis à jour avec les données enrichies
      return this.getContractById(id);
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour du statut du contrat :",
        error,
      );
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Supprime un contrat par son ID
   */
  async deleteContract(id: string): Promise<boolean> {
    const sql = `DELETE FROM contracts WHERE id = $1;`;
    try {
      const result = await query(sql, [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Erreur lors de la suppression du contrat :", error);
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Récupère les contrats avec filtres et pagination
   */
  async getContractsWithFilters(params: {
    status?: ContractStatus;
    freelanceId?: string;
    companyId?: string;
    projectId?: string;
    paymentMode?: PaymentMode;
    limit?: number;
    page?: number;
  }): Promise<{
    data: Contract[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 10;
    const offset = (page - 1) * limit;

    let whereClauses: string[] = [];
    let values: (string | number)[] = [];
    let idx = 1;

    if (params.status) {
      whereClauses.push(`c.status = $${idx++}`);
      values.push(params.status);
    }
    if (params.freelanceId) {
      whereClauses.push(`c.freelance_id = $${idx++}`);
      values.push(params.freelanceId);
    }
    if (params.companyId) {
      whereClauses.push(`c.company_id = $${idx++}`);
      values.push(params.companyId);
    }
    if (params.projectId) {
      whereClauses.push(`c.project_id = $${idx++}`);
      values.push(params.projectId);
    }
    if (params.paymentMode) {
      whereClauses.push(`c.payment_mode = $${idx++}`);
      values.push(params.paymentMode);
    }

    let where =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Requête principale paginée
    const dataQuery = `
      SELECT
        c.id,
        c.application_id,
        c.project_id,
        c.freelance_id,
        c.company_id,
        c.payment_mode,
        c.total_amount,
        c.tjm,
        c.estimated_days,
        c.terms,
        c.start_date,
        c.end_date,
        c.status,
        c.created_at,
        json_build_object(
          'id', p.id,
          'title', p.title,
          'description', p.description,
          'budgetMin', p.budget_min,
          'budgetMax', p.budget_max,
          'deadline', p.deadline,
          'durationDays', p.duration_days,
          'status', p.status,
          'typeWork', p.type_work,
          'categoryId', p.category_id,
          'companyId', p.company_id,
          'allowMultipleApplications', p.allow_multiple_applications,
          'levelExperience', p.level_experience,
          'tjmProposed', p.tjm_proposed,
          'createdAt', p.created_at,
          'updatedAt', p.updated_at,
          'publishedAt', p.published_at
        ) AS project,
        json_build_object(
          'id', f.id,
          'firstname', f.firstname,
          'lastname', f.lastname,
          'email', f.email,
          'photo_url', f.photo_url,
          'job_title', f.job_title,
          'experience', f.experience,
          'description', f.description,
          'cover_url', f.cover_url,
          'linkedin_url', f.linkedin_url,
          'tjm', f.tjm,
          'availability', f.availability,
          'location', f.location,
          'is_verified', f.is_verified,
          'country', f.country,
          'city', f.city,
          'phone', f.phone,
          'created_at', f.created_at,
          'updated_at', f.updated_at
        ) AS freelance
      FROM contracts c
      LEFT JOIN projects p ON c.project_id = p.id
      LEFT JOIN freelances f ON c.freelance_id = f.id
      ${where}
      ORDER BY c.created_at DESC
      LIMIT $${idx++}
      OFFSET $${idx++}
    `;
    const dataValues = [...values, limit, offset];

    // Requête de comptage total
    const countQuery = `
      SELECT COUNT(*) AS total FROM contracts c
      LEFT JOIN projects p ON c.project_id = p.id
      LEFT JOIN freelances f ON c.freelance_id = f.id
      ${where}
    `;
    const countValues = values;

    try {
      const dataResult = await query<Contract>(dataQuery, dataValues);
      const countResult = await query(countQuery, countValues);
      const total = parseInt(countResult.rows[0]?.total ?? "0", 10);

      return {
        data: dataResult.rows,
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des contrats avec filtres :",
        error,
      );
      throw new Error("Erreur de base de données");
    }
  }

  async getContractByApplicationId(
    applicationId: string,
  ): Promise<Contract | null> {
    const sql = `
       SELECT
         c.id,
         c.application_id,
         c.project_id,
         c.freelance_id,
         c.company_id,
         c.payment_mode,
         c.total_amount,
         c.tjm,
         c.estimated_days,
         c.terms,
         c.start_date,
         c.end_date,
         c.status,
         c.created_at,
         json_build_object(
           'id', p.id,
           'title', p.title,
           'description', p.description,
           'budgetMin', p.budget_min,
           'budgetMax', p.budget_max,
           'deadline', p.deadline,
           'durationDays', p.duration_days,
           'status', p.status,
           'typeWork', p.type_work,
           'categoryId', p.category_id,
           'companyId', p.company_id,
           'allowMultipleApplications', p.allow_multiple_applications,
           'levelExperience', p.level_experience,
           'tjmProposed', p.tjm_proposed,
           'createdAt', p.created_at,
           'updatedAt', p.updated_at,
           'publishedAt', p.published_at
         ) AS project,
         json_build_object(
           'id', f.id,
           'firstname', f.firstname,
           'lastname', f.lastname,
           'email', f.email,
           'photo_url', f.photo_url,
           'job_title', f.job_title,
           'experience', f.experience,
           'description', f.description,
           'cover_url', f.cover_url,
           'linkedin_url', f.linkedin_url,
           'tjm', f.tjm,
           'availability', f.availability,
           'location', f.location,
           'is_verified', f.is_verified,
           'country', f.country,
           'city', f.city,
           'phone', f.phone,
           'created_at', f.created_at,
           'updated_at', f.updated_at
         ) AS freelance
       FROM contracts c
       LEFT JOIN projects p ON c.project_id = p.id
       LEFT JOIN freelances f ON c.freelance_id = f.id
       WHERE c.application_id = $1 LIMIT 1;
     `;
    const result = await query<Contract>(sql, [applicationId]);
    return result.rows[0] || null;
  }

  /**
   * Met à jour un contrat complet
   */
  async updateContract(
    id: string,
    data: Partial<Omit<Contract, "id" | "created_at">>,
  ): Promise<Contract | null> {
    const fields = [];
    const values = [];
    let idx = 2;

    if (data.application_id !== undefined) {
      fields.push(`application_id = $${idx++}`);
      values.push(data.application_id);
    }
    if (data.project_id !== undefined) {
      fields.push(`project_id = $${idx++}`);
      values.push(data.project_id);
    }
    if (data.freelance_id !== undefined) {
      fields.push(`freelance_id = $${idx++}`);
      values.push(data.freelance_id);
    }
    if (data.company_id !== undefined) {
      fields.push(`company_id = $${idx++}`);
      values.push(data.company_id);
    }
    if (data.payment_mode !== undefined) {
      fields.push(`payment_mode = $${idx++}`);
      values.push(data.payment_mode);
    }
    if (data.total_amount !== undefined) {
      fields.push(`total_amount = $${idx++}`);
      values.push(data.total_amount);
    }
    if (data.tjm !== undefined) {
      fields.push(`tjm = $${idx++}`);
      values.push(data.tjm);
    }
    if (data.estimated_days !== undefined) {
      fields.push(`estimated_days = $${idx++}`);
      values.push(data.estimated_days);
    }
    if (data.terms !== undefined) {
      fields.push(`terms = $${idx++}`);
      values.push(data.terms);
    }
    if (data.start_date !== undefined) {
      fields.push(`start_date = $${idx++}`);
      values.push(data.start_date);
    }
    if (data.end_date !== undefined) {
      fields.push(`end_date = $${idx++}`);
      values.push(data.end_date);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }

    if (fields.length === 0) return this.getContractById(id);

    const updateSql = `
      UPDATE contracts SET ${fields.join(", ")}
      WHERE id = $1
      RETURNING id;
    `;

    try {
      const updateResult = await query(updateSql, [id, ...values]);
      if (updateResult.rows.length === 0) {
        return null;
      }

      // Récupérer le contrat mis à jour avec les données enrichies
      return this.getContractById(id);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du contrat :", error);
      throw new Error("Erreur de base de données");
    }
  }
}
