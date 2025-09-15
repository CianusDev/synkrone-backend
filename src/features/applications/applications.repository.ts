import { db } from "../../config/database";
import { Application, ApplicationStatus } from "./applications.model";

export class ApplicationsRepository {
  /**
   * Crée une nouvelle candidature (application)
   * @param application - Données de la candidature
   * @returns La candidature créée
   */
  async createApplication(
    application: Partial<Application>,
  ): Promise<Application> {
    const query = `
      INSERT INTO applications (
        project_id,
        freelance_id,
        proposed_rate,
        cover_letter,
        status,
        submission_date
      ) VALUES (
        $1, $2, $3, $4, $5, NOW()
      ) RETURNING *;
    `;
    const values = [
      application.project_id,
      application.freelance_id,
      application.proposed_rate,
      application.cover_letter,
      application.status || ApplicationStatus.SUBMITTED,
    ];
    try {
      const result = await db.query(query, values);
      return result.rows[0] as Application;
    } catch (error) {
      console.error("Erreur lors de la création de la candidature :", error);
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Récupère une candidature par son ID
   * @param id - UUID de la candidature
   * @returns La candidature ou null si non trouvée
   */
  async getApplicationById(id: string): Promise<Application | null> {
    const query = `SELECT * FROM applications WHERE id = $1;`;
    try {
      const result = await db.query(query, [id]);
      return (result.rows[0] as Application) || null;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la candidature par ID :",
        error,
      );
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Récupère toutes les candidatures pour un freelance donné
   * @param freelanceId - UUID du freelance
   * @returns Tableau de candidatures
   */
  async getApplicationsByFreelanceId(
    freelanceId: string,
  ): Promise<Application[]> {
    const query = `SELECT * FROM applications WHERE freelance_id = $1 ORDER BY submission_date DESC;`;
    try {
      const result = await db.query(query, [freelanceId]);
      return result.rows as Application[];
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des candidatures par freelance ID :",
        error,
      );
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Récupère toutes les candidatures pour un projet donné
   * @param projectId - UUID du projet
   * @returns Tableau de candidatures
   */
  async getApplicationsByProjectId(projectId: string): Promise<Application[]> {
    const query = `SELECT * FROM applications WHERE project_id = $1 ORDER BY submission_date DESC;`;
    try {
      const result = await db.query(query, [projectId]);
      return result.rows as Application[];
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des candidatures par projet ID :",
        error,
      );
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Met à jour le statut d'une candidature
   * @param id - UUID de la candidature
   * @param status - Nouveau statut
   * @param responseDate - Date de réponse optionnelle
   * @returns La candidature mise à jour ou null si non trouvée
   */
  async updateApplicationStatus(
    id: string,
    status: ApplicationStatus,
    responseDate?: Date,
  ): Promise<Application | null> {
    const query = `
      UPDATE applications
      SET status = $1,
          response_date = $2
      WHERE id = $3
      RETURNING *;
    `;
    const values = [status, responseDate || null, id];
    try {
      const result = await db.query(query, values);
      return (result.rows[0] as Application) || null;
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour du statut de la candidature :",
        error,
      );
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Rejette toutes les autres candidatures pour un projet sauf celle acceptée
   * @param projectId - UUID du projet
   * @param acceptedApplicationId - UUID de la candidature acceptée
   */
  async rejectOtherApplications(
    projectId: string,
    acceptedApplicationId: string,
  ): Promise<void> {
    const query = `
      UPDATE applications
      SET status = $1,
          response_date = $2
      WHERE project_id = $3
        AND id != $4
        AND status NOT IN ($5, $6, $7)
    `;
    const values = [
      ApplicationStatus.REJECTED,
      new Date(),
      projectId,
      acceptedApplicationId,
      ApplicationStatus.REJECTED,
      ApplicationStatus.ACCEPTED,
      ApplicationStatus.WITHDRAWN,
    ];
    try {
      await db.query(query, values);
    } catch (error) {
      console.error(
        "Erreur lors du rejet des autres candidatures du projet :",
        error,
      );
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Supprime une candidature par son ID
   * @param id - UUID de la candidature
   * @returns true si supprimée, false sinon
   */
  async deleteApplication(id: string): Promise<boolean> {
    const query = `DELETE FROM applications WHERE id = $1;`;
    try {
      const result = await db.query(query, [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Erreur lors de la suppression de la candidature :", error);
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Récupère les candidatures avec pagination et retourne aussi le total
   * @param params - { status, freelanceId, projectId, limit, page }
   * @returns { data: Application[], total: number, page: number, limit: number }
   */
  async getApplicationsWithFilters(params: {
    status?: ApplicationStatus;
    freelanceId?: string;
    projectId?: string;
    limit?: number;
    page?: number;
  }): Promise<{
    data: Application[];
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
    if (params.projectId) {
      whereClauses.push(`project_id = $${idx++}`);
      values.push(params.projectId);
    }

    let where =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Requête principale paginée
    const dataQuery = `
      SELECT * FROM applications
      ${where}
      ORDER BY submission_date DESC
      LIMIT $${idx++}
      OFFSET $${idx++}
    `;
    const dataValues = [...values, limit, offset];

    // Requête de comptage total
    const countQuery = `
      SELECT COUNT(*) AS total FROM applications
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
        "Erreur lors de la récupération des candidatures avec pagination :",
        error,
      );
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Vérifie s'il existe une candidature pour un freelance sur un projet donné
   * @param freelanceId - UUID du freelance
   * @param projectId - UUID du projet
   * @param statuses - Statuts à vérifier (optionnel, par défaut tous)
   * @returns L'application trouvée ou null
   */
  async getApplicationByFreelanceAndProject(
    freelanceId: string,
    projectId: string,
    statuses?: ApplicationStatus[],
  ): Promise<Application | null> {
    let query = `
      SELECT * FROM applications
      WHERE freelance_id = $1 AND project_id = $2
    `;
    const values: any[] = [freelanceId, projectId];

    if (statuses && statuses.length > 0) {
      const statusPlaceholders = statuses
        .map((_, index) => `$${index + 3}`)
        .join(", ");
      query += ` AND status IN (${statusPlaceholders})`;
      values.push(...statuses);
    }

    query += ` ORDER BY submission_date DESC LIMIT 1`;

    try {
      const result = await db.query(query, values);
      return (result.rows[0] as Application) || null;
    } catch (error) {
      console.error(
        "Erreur lors de la vérification de candidature existante :",
        error,
      );
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Récupère les statistiques des candidatures pour un freelance donné
   * @param freelanceId - UUID du freelance
   * @returns Statistiques des candidatures par statut
   */
  async getApplicationStatsByFreelance(freelanceId: string): Promise<{
    submitted: number;
    accepted: number;
    rejected: number;
    under_review: number;
    withdrawn: number;
    total: number;
  }> {
    const query = `
      SELECT
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review,
        COUNT(CASE WHEN status = 'withdrawn' THEN 1 END) as withdrawn,
        COUNT(*) as total
      FROM applications
      WHERE freelance_id = $1
    `;

    try {
      const result = await db.query(query, [freelanceId]);
      const stats = result.rows[0];
      return {
        submitted: parseInt(stats.submitted || "0", 10),
        accepted: parseInt(stats.accepted || "0", 10),
        rejected: parseInt(stats.rejected || "0", 10),
        under_review: parseInt(stats.under_review || "0", 10),
        withdrawn: parseInt(stats.withdrawn || "0", 10),
        total: parseInt(stats.total || "0", 10),
      };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des statistiques par freelance :",
        error,
      );
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Récupère les statistiques des candidatures pour un projet donné
   * @param projectId - UUID du projet
   * @returns Statistiques des candidatures par statut
   */
  async getApplicationStatsByProject(projectId: string): Promise<{
    submitted: number;
    accepted: number;
    rejected: number;
    under_review: number;
    withdrawn: number;
    total: number;
  }> {
    const query = `
      SELECT
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review,
        COUNT(CASE WHEN status = 'withdrawn' THEN 1 END) as withdrawn,
        COUNT(*) as total
      FROM applications
      WHERE project_id = $1
    `;

    try {
      const result = await db.query(query, [projectId]);
      const stats = result.rows[0];
      return {
        submitted: parseInt(stats.submitted || "0", 10),
        accepted: parseInt(stats.accepted || "0", 10),
        rejected: parseInt(stats.rejected || "0", 10),
        under_review: parseInt(stats.under_review || "0", 10),
        withdrawn: parseInt(stats.withdrawn || "0", 10),
        total: parseInt(stats.total || "0", 10),
      };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des statistiques par projet :",
        error,
      );
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Met à jour le contenu d'une candidature (tarif proposé et lettre de motivation)
   * @param id - UUID de la candidature
   * @param data - Données à mettre à jour
   * @returns La candidature mise à jour ou null si non trouvée
   */
  async updateApplicationContent(
    id: string,
    data: { proposed_rate?: number; cover_letter?: string },
  ): Promise<Application | null> {
    const fields = [];
    const values = [];
    let idx = 2;

    if (data.proposed_rate !== undefined) {
      fields.push(`proposed_rate = $${idx++}`);
      values.push(data.proposed_rate);
    }
    if (data.cover_letter !== undefined) {
      fields.push(`cover_letter = $${idx++}`);
      values.push(data.cover_letter);
    }

    if (fields.length === 0) {
      // Aucun champ à mettre à jour, retourner la candidature existante
      return this.getApplicationById(id);
    }

    const query = `
      UPDATE applications
      SET ${fields.join(", ")}
      WHERE id = $1
      RETURNING *;
    `;
    const queryValues = [id, ...values];

    try {
      const result = await db.query(query, queryValues);
      return (result.rows[0] as Application) || null;
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour du contenu de la candidature :",
        error,
      );
      throw new Error("Erreur de base de données");
    }
  }
}
