import {
  ProjectInvitation,
  InvitationStatus,
} from "./project-invitations.model";
import { db } from "../../config/database";

export class ProjectInvitationsRepository {
  /**
   * Crée une nouvelle invitation de projet
   * @param invitation - Données de l'invitation
   * @returns L'invitation créée
   */
  async createInvitation(
    invitation: Partial<ProjectInvitation>,
  ): Promise<ProjectInvitation> {
    const query = `
      INSERT INTO project_invitations (
        project_id,
        freelance_id,
        company_id,
        message,
        status,
        sent_at,
        responded_at,
        expires_at
      ) VALUES (
        $1, $2, $3, $4, $5, NOW(), $6, $7
      ) RETURNING *;
    `;
    const values = [
      invitation.project_id,
      invitation.freelance_id,
      invitation.company_id,
      invitation.message,
      invitation.status || InvitationStatus.SENT,
      invitation.responded_at ?? null,
      invitation.expires_at ?? null,
    ];
    try {
      const result = await db.query(query, values);
      return result.rows[0] as ProjectInvitation;
    } catch (error) {
      console.error("Erreur lors de la création de l'invitation :", error);
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Récupère une invitation par son ID
   * @param id - UUID de l'invitation
   * @returns L'invitation ou null si non trouvée
   */
  async getInvitationById(id: string): Promise<ProjectInvitation | null> {
    const query = `SELECT * FROM project_invitations WHERE id = $1;`;
    try {
      const result = await db.query(query, [id]);
      return (result.rows[0] as ProjectInvitation) || null;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de l'invitation par ID :",
        error,
      );
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Récupère toutes les invitations envoyées à un freelance
   * @param freelanceId - UUID du freelance
   * @returns Tableau d'invitations
   */
  async getInvitationsByFreelanceId(
    freelanceId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: ProjectInvitation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const _page = page && page > 0 ? page : 1;
    const _limit = limit && limit > 0 ? limit : 10;
    const offset = (_page - 1) * _limit;

    const query = `SELECT * FROM project_invitations WHERE freelance_id = $1 ORDER BY sent_at DESC LIMIT $2 OFFSET $3;`;
    const countQuery = `SELECT COUNT(*) AS total FROM project_invitations WHERE freelance_id = $1;`;
    try {
      const dataResult = await db.query(query, [freelanceId, _limit, offset]);
      const countResult = await db.query(countQuery, [freelanceId]);
      const total = parseInt(countResult.rows[0]?.total ?? "0", 10);
      const totalPages = Math.ceil(total / _limit);
      return {
        data: dataResult.rows as ProjectInvitation[],
        total,
        page: _page,
        limit: _limit,
        totalPages,
      };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des invitations par freelance :",
        error,
      );
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Récupère toutes les invitations envoyées par une entreprise
   * @param companyId - UUID de l'entreprise
   * @returns Tableau d'invitations
   */
  async getInvitationsByCompanyId(
    companyId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: ProjectInvitation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const _page = page && page > 0 ? page : 1;
    const _limit = limit && limit > 0 ? limit : 10;
    const offset = (_page - 1) * _limit;

    const query = `SELECT * FROM project_invitations WHERE company_id = $1 ORDER BY sent_at DESC LIMIT $2 OFFSET $3;`;
    const countQuery = `SELECT COUNT(*) AS total FROM project_invitations WHERE company_id = $1;`;
    try {
      const dataResult = await db.query(query, [companyId, _limit, offset]);
      const countResult = await db.query(countQuery, [companyId]);
      const total = parseInt(countResult.rows[0]?.total ?? "0", 10);
      const totalPages = Math.ceil(total / _limit);
      return {
        data: dataResult.rows as ProjectInvitation[],
        total,
        page: _page,
        limit: _limit,
        totalPages,
      };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des invitations par entreprise :",
        error,
      );
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Récupère toutes les invitations pour un projet donné
   * @param projectId - UUID du projet
   * @returns Tableau d'invitations
   */
  async getInvitationsByProjectId(
    projectId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: ProjectInvitation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const _page = page && page > 0 ? page : 1;
    const _limit = limit && limit > 0 ? limit : 10;
    const offset = (_page - 1) * _limit;

    const query = `SELECT * FROM project_invitations WHERE project_id = $1 ORDER BY sent_at DESC LIMIT $2 OFFSET $3;`;
    const countQuery = `SELECT COUNT(*) AS total FROM project_invitations WHERE project_id = $1;`;
    try {
      const dataResult = await db.query(query, [projectId, _limit, offset]);
      const countResult = await db.query(countQuery, [projectId]);
      const total = parseInt(countResult.rows[0]?.total ?? "0", 10);
      const totalPages = Math.ceil(total / _limit);
      return {
        data: dataResult.rows as ProjectInvitation[],
        total,
        page: _page,
        limit: _limit,
        totalPages,
      };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des invitations par projet :",
        error,
      );
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Met à jour le statut d'une invitation
   * @param id - UUID de l'invitation
   * @param status - Nouveau statut
   * @param respondedAt - Date de réponse optionnelle
   * @returns L'invitation mise à jour ou null si non trouvée
   */
  async updateInvitationStatus(
    id: string,
    status: InvitationStatus,
    respondedAt?: Date,
  ): Promise<ProjectInvitation | null> {
    const query = `
      UPDATE project_invitations
      SET status = $1,
          responded_at = $2
      WHERE id = $3
      RETURNING *;
    `;
    const values = [status, respondedAt ?? null, id];
    try {
      const result = await db.query(query, values);
      return (result.rows[0] as ProjectInvitation) || null;
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour du statut de l'invitation :",
        error,
      );
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Supprime une invitation par son ID
   * @param id - UUID de l'invitation
   * @returns true si supprimée, false sinon
   */
  async deleteInvitation(id: string): Promise<boolean> {
    const query = `DELETE FROM project_invitations WHERE id = $1;`;
    try {
      const result = await db.query(query, [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Erreur lors de la suppression de l'invitation :", error);
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Récupère les invitations avec filtres basiques (statut, freelance, projet, entreprise)
   * @param params - Filtres
   * @returns Tableau d'invitations
   */
  async getInvitationsWithFilters(params: {
    status?: InvitationStatus;
    freelanceId?: string;
    companyId?: string;
    projectId?: string;
    limit?: number;
    page?: number;
  }): Promise<{
    data: ProjectInvitation[];
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

    let where =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Requête principale paginée
    const dataQuery = `
      SELECT * FROM project_invitations
      ${where}
      ORDER BY sent_at DESC
      LIMIT $${idx++}
      OFFSET $${idx++}
    `;
    const dataValues = [...values, limit, offset];

    // Requête de comptage total
    const countQuery = `
      SELECT COUNT(*) AS total FROM project_invitations
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
      console.error(
        "Erreur lors de la récupération des invitations avec filtres :",
        error,
      );
      throw new Error("Erreur de base de données");
    }
  }
}
