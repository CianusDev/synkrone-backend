import { Contract, ContractStatus, PaymentMode } from "./contracts.model";
import { db } from "../../config/database";

export class ContractsRepository {
  /**
   * Crée un nouveau contrat
   * @param contract - Données du contrat
   * @returns Le contrat créé
   */
  async createContract(contract: Partial<Contract>): Promise<Contract> {
    const query = `
      INSERT INTO contracts (
        application_id,
        project_id,
        freelance_id,
        company_id,
        agreed_rate,
        payment_mode,
        terms,
        start_date,
        end_date,
        status,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
      ) RETURNING *;
    `;
    const values = [
      contract.application_id,
      contract.project_id,
      contract.freelance_id,
      contract.company_id,
      contract.agreed_rate,
      contract.payment_mode,
      contract.terms,
      contract.start_date ?? null,
      contract.end_date ?? null,
      contract.status || ContractStatus.DRAFT,
    ];
    try {
      const result = await db.query(query, values);
      return result.rows[0] as Contract;
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
    const query = `SELECT * FROM contracts WHERE id = $1;`;
    try {
      const result = await db.query(query, [id]);
      return (result.rows[0] as Contract) || null;
    } catch (error) {
      console.error("Erreur lors de la récupération du contrat par ID :", error);
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Récupère tous les contrats d'un freelance avec pagination
   */
  async getContractsByFreelanceId(
    freelanceId: string,
    page?: number,
    limit?: number
  ): Promise<{ data: Contract[]; total: number; page: number; limit: number; totalPages: number }> {
    const _page = page && page > 0 ? page : 1;
    const _limit = limit && limit > 0 ? limit : 10;
    const offset = (_page - 1) * _limit;

    const query = `SELECT * FROM contracts WHERE freelance_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3;`;
    const countQuery = `SELECT COUNT(*) AS total FROM contracts WHERE freelance_id = $1;`;
    try {
      const dataResult = await db.query(query, [freelanceId, _limit, offset]);
      const countResult = await db.query(countQuery, [freelanceId]);
      const total = parseInt(countResult.rows[0]?.total ?? "0", 10);
      const totalPages = Math.ceil(total / _limit);
      return {
        data: dataResult.rows as Contract[],
        total,
        page: _page,
        limit: _limit,
        totalPages,
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des contrats par freelance :", error);
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Récupère tous les contrats d'une entreprise avec pagination
   */
  async getContractsByCompanyId(
    companyId: string,
    page?: number,
    limit?: number
  ): Promise<{ data: Contract[]; total: number; page: number; limit: number; totalPages: number }> {
    const _page = page && page > 0 ? page : 1;
    const _limit = limit && limit > 0 ? limit : 10;
    const offset = (_page - 1) * _limit;

    const query = `SELECT * FROM contracts WHERE company_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3;`;
    const countQuery = `SELECT COUNT(*) AS total FROM contracts WHERE company_id = $1;`;
    try {
      const dataResult = await db.query(query, [companyId, _limit, offset]);
      const countResult = await db.query(countQuery, [companyId]);
      const total = parseInt(countResult.rows[0]?.total ?? "0", 10);
      const totalPages = Math.ceil(total / _limit);
      return {
        data: dataResult.rows as Contract[],
        total,
        page: _page,
        limit: _limit,
        totalPages,
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des contrats par entreprise :", error);
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Récupère tous les contrats d'un projet avec pagination
   */
  async getContractsByProjectId(
    projectId: string,
    page?: number,
    limit?: number
  ): Promise<{ data: Contract[]; total: number; page: number; limit: number; totalPages: number }> {
    const _page = page && page > 0 ? page : 1;
    const _limit = limit && limit > 0 ? limit : 10;
    const offset = (_page - 1) * _limit;

    const query = `SELECT * FROM contracts WHERE project_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3;`;
    const countQuery = `SELECT COUNT(*) AS total FROM contracts WHERE project_id = $1;`;
    try {
      const dataResult = await db.query(query, [projectId, _limit, offset]);
      const countResult = await db.query(countQuery, [projectId]);
      const total = parseInt(countResult.rows[0]?.total ?? "0", 10);
      const totalPages = Math.ceil(total / _limit);
      return {
        data: dataResult.rows as Contract[],
        total,
        page: _page,
        limit: _limit,
        totalPages,
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des contrats par projet :", error);
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Met à jour le statut d'un contrat
   */
  async updateContractStatus(
    id: string,
    status: ContractStatus
  ): Promise<Contract | null> {
    const query = `
      UPDATE contracts
      SET status = $1
      WHERE id = $2
      RETURNING *;
    `;
    const values = [status, id];
    try {
      const result = await db.query(query, values);
      return (result.rows[0] as Contract) || null;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut du contrat :", error);
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Supprime un contrat par son ID
   */
  async deleteContract(id: string): Promise<boolean> {
    const query = `DELETE FROM contracts WHERE id = $1;`;
    try {
      const result = await db.query(query, [id]);
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
  }): Promise<{ data: Contract[]; total: number; page: number; limit: number }> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 10;
    const offset = (page - 1) * limit;

    let whereClauses: string[] = [];
    let values: (string | number)[] = [];
    let idx = 1;

    if (params.status) {
      whereClauses.push(`status = $${idx++}`);
      values.push(params.status);
    }
    if (params.freelanceId) {
      whereClauses.push(`freelance_id = $${idx++}`);
      values.push(params.freelanceId);
    }
    if (params.companyId) {
      whereClauses.push(`company_id = $${idx++}`);
      values.push(params.companyId);
    }
    if (params.projectId) {
      whereClauses.push(`project_id = $${idx++}`);
      values.push(params.projectId);
    }
    if (params.paymentMode) {
      whereClauses.push(`payment_mode = $${idx++}`);
      values.push(params.paymentMode);
    }

    let where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Requête principale paginée
    const dataQuery = `
      SELECT * FROM contracts
      ${where}
      ORDER BY created_at DESC
      LIMIT $${idx++}
      OFFSET $${idx++}
    `;
    const dataValues = [...values, limit, offset];

    // Requête de comptage total
    const countQuery = `
      SELECT COUNT(*) AS total FROM contracts
      ${where}
    `;
    const countValues = values;

    try {
      const dataResult = await db.query(dataQuery, dataValues);
      const countResult = await db.query(countQuery, countValues);
      const total = parseInt(countResult.rows[0]?.total ?? "0", 10);

      return {
        data: dataResult.rows,
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des contrats avec filtres :", error);
      throw new Error("Erreur de base de données");
    }
  }
}
