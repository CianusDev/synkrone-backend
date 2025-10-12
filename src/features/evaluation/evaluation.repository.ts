import { query } from "../../config/database";
import {
  Evaluation,
  CreateEvaluationData,
  UpdateEvaluationData,
  EvaluationStats,
  EvaluationFilters,
  UserType,
} from "./evaluation.model";

export class EvaluationRepository {
  /**
   * Crée une nouvelle évaluation
   */
  async createEvaluation(data: CreateEvaluationData): Promise<Evaluation> {
    const sql = `
      INSERT INTO evaluations (
        contract_id,
        evaluator_id,
        evaluated_id,
        evaluator_type,
        evaluated_type,
        rating,
        comment
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        contract_id,
        evaluator_id,
        evaluated_id,
        evaluator_type,
        evaluated_type,
        rating,
        comment,
        created_at,
        updated_at;
    `;

    const values = [
      data.contract_id,
      data.evaluator_id,
      data.evaluated_id,
      data.evaluator_type,
      data.evaluated_type,
      data.rating,
      data.comment || null,
    ];

    try {
      const result = await query<Evaluation>(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error("Erreur lors de la création de l'évaluation:", error);
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Récupère une évaluation par son ID avec données enrichies
   */
  async getEvaluationById(id: string): Promise<Evaluation | null> {
    const sql = `
      SELECT
        e.id,
        e.contract_id,
        e.evaluator_id,
        e.evaluated_id,
        e.evaluator_type,
        e.evaluated_type,
        e.rating,
        e.comment,
        e.created_at,
        e.updated_at,
        json_build_object(
          'id', c.id,
          'project_id', c.project_id,
          'project', json_build_object(
            'id', p.id,
            'title', p.title
          )
        ) AS contract,
        CASE
          WHEN e.evaluator_type = 'freelance' THEN
            json_build_object(
              'id', f_eval.id,
              'name', CONCAT(f_eval.firstname, ' ', f_eval.lastname),
              'email', f_eval.email,
              'type', 'freelance'
            )
          ELSE
            json_build_object(
              'id', c_eval.id,
              'name', c_eval.company_name,
              'email', c_eval.company_email,
              'type', 'company'
            )
        END AS evaluator,
        CASE
          WHEN e.evaluated_type = 'freelance' THEN
            json_build_object(
              'id', f_eval_ed.id,
              'name', CONCAT(f_eval_ed.firstname, ' ', f_eval_ed.lastname),
              'email', f_eval_ed.email,
              'type', 'freelance'
            )
          ELSE
            json_build_object(
              'id', c_eval_ed.id,
              'name', c_eval_ed.company_name,
              'email', c_eval_ed.company_email,
              'type', 'company'
            )
        END AS evaluated
      FROM evaluations e
      LEFT JOIN contracts c ON e.contract_id = c.id
      LEFT JOIN projects p ON c.project_id = p.id
      LEFT JOIN freelances f_eval ON e.evaluator_id = f_eval.id AND e.evaluator_type = 'freelance'
      LEFT JOIN companies c_eval ON e.evaluator_id = c_eval.id AND e.evaluator_type = 'company'
      LEFT JOIN freelances f_eval_ed ON e.evaluated_id = f_eval_ed.id AND e.evaluated_type = 'freelance'
      LEFT JOIN companies c_eval_ed ON e.evaluated_id = c_eval_ed.id AND e.evaluated_type = 'company'
      WHERE e.id = $1;
    `;

    try {
      const result = await query<Evaluation>(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'évaluation:", error);
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Met à jour une évaluation
   */
  async updateEvaluation(
    id: string,
    data: UpdateEvaluationData,
  ): Promise<Evaluation | null> {
    const fields = [];
    const values = [id];
    let paramIndex = 2;

    if (data.rating !== undefined) {
      fields.push(`rating = $${paramIndex++}`);
      values.push(data.rating.toString());
    }

    if (data.comment !== undefined) {
      fields.push(`comment = $${paramIndex++}`);
      values.push(data.comment || "");
    }

    if (fields.length === 0) {
      return this.getEvaluationById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    const sql = `
      UPDATE evaluations
      SET ${fields.join(", ")}
      WHERE id = $1
      RETURNING id;
    `;

    try {
      const result = await query(sql, values);
      if (result.rows.length === 0) {
        return null;
      }
      return this.getEvaluationById(id);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'évaluation:", error);
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Supprime une évaluation
   */
  async deleteEvaluation(id: string): Promise<boolean> {
    const sql = `DELETE FROM evaluations WHERE id = $1;`;

    try {
      const result = await query(sql, [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Erreur lors de la suppression de l'évaluation:", error);
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Récupère les évaluations avec filtres et pagination
   */
  async getEvaluationsWithFilters(
    filters: EvaluationFilters & {
      page?: number;
      limit?: number;
    },
  ): Promise<{
    data: Evaluation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
    const offset = (page - 1) * limit;

    let whereClauses: string[] = [];
    let values: any[] = [];
    let paramIndex = 1;

    if (filters.evaluator_id) {
      whereClauses.push(`e.evaluator_id = $${paramIndex++}`);
      values.push(filters.evaluator_id);
    }

    if (filters.evaluated_id) {
      whereClauses.push(`e.evaluated_id = $${paramIndex++}`);
      values.push(filters.evaluated_id);
    }

    if (filters.evaluator_type) {
      whereClauses.push(`e.evaluator_type = $${paramIndex++}`);
      values.push(filters.evaluator_type);
    }

    if (filters.evaluated_type) {
      whereClauses.push(`e.evaluated_type = $${paramIndex++}`);
      values.push(filters.evaluated_type);
    }

    if (filters.rating) {
      whereClauses.push(`e.rating = $${paramIndex++}`);
      values.push(filters.rating);
    }

    if (filters.contract_id) {
      whereClauses.push(`e.contract_id = $${paramIndex++}`);
      values.push(filters.contract_id);
    }

    if (filters.project_id) {
      whereClauses.push(`c.project_id = $${paramIndex++}`);
      values.push(filters.project_id);
    }

    const whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const dataSql = `
      SELECT
        e.id,
        e.contract_id,
        e.evaluator_id,
        e.evaluated_id,
        e.evaluator_type,
        e.evaluated_type,
        e.rating,
        e.comment,
        e.created_at,
        e.updated_at,
        json_build_object(
          'id', c.id,
          'project_id', c.project_id,
          'project', json_build_object(
            'id', p.id,
            'title', p.title
          )
        ) AS contract,
        CASE
          WHEN e.evaluator_type = 'freelance' THEN
            json_build_object(
              'id', f_eval.id,
              'name', CONCAT(f_eval.firstname, ' ', f_eval.lastname),
              'email', f_eval.email,
              'type', 'freelance'
            )
          ELSE
            json_build_object(
              'id', c_eval.id,
              'name', c_eval.company_name,
              'email', c_eval.company_email,
              'type', 'company'
            )
        END AS evaluator,
        CASE
          WHEN e.evaluated_type = 'freelance' THEN
            json_build_object(
              'id', f_eval_ed.id,
              'name', CONCAT(f_eval_ed.firstname, ' ', f_eval_ed.lastname),
              'email', f_eval_ed.email,
              'type', 'freelance'
            )
          ELSE
            json_build_object(
              'id', c_eval_ed.id,
              'name', c_eval_ed.company_name,
              'email', c_eval_ed.company_email,
              'type', 'company'
            )
        END AS evaluated
      FROM evaluations e
      LEFT JOIN contracts c ON e.contract_id = c.id
      LEFT JOIN projects p ON c.project_id = p.id
      LEFT JOIN freelances f_eval ON e.evaluator_id = f_eval.id AND e.evaluator_type = 'freelance'
      LEFT JOIN companies c_eval ON e.evaluator_id = c_eval.id AND e.evaluator_type = 'company'
      LEFT JOIN freelances f_eval_ed ON e.evaluated_id = f_eval_ed.id AND e.evaluated_type = 'freelance'
      LEFT JOIN companies c_eval_ed ON e.evaluated_id = c_eval_ed.id AND e.evaluated_type = 'company'
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++};
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM evaluations e
      LEFT JOIN contracts c ON e.contract_id = c.id
      ${whereClause};
    `;

    const dataValues = [...values, limit, offset];
    const countValues = values;

    try {
      const [dataResult, countResult] = await Promise.all([
        query<Evaluation>(dataSql, dataValues),
        query(countSql, countValues),
      ]);

      const total = parseInt(countResult.rows[0]?.total ?? "0", 10);
      const totalPages = Math.ceil(total / limit);

      return {
        data: dataResult.rows,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des évaluations:", error);
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Récupère les statistiques d'évaluation d'un utilisateur
   */
  async getUserEvaluationStats(
    userId: string,
    userType: UserType,
  ): Promise<EvaluationStats | null> {
    const sql = `
      SELECT
        evaluated_id as user_id,
        evaluated_type as user_type,
        COUNT(*) as total_evaluations,
        AVG(rating)::numeric(3,2) as average_rating,
        COUNT(*) FILTER (WHERE rating = 1) as rating_1,
        COUNT(*) FILTER (WHERE rating = 2) as rating_2,
        COUNT(*) FILTER (WHERE rating = 3) as rating_3,
        COUNT(*) FILTER (WHERE rating = 4) as rating_4,
        COUNT(*) FILTER (WHERE rating = 5) as rating_5
      FROM evaluations
      WHERE evaluated_id = $1 AND evaluated_type = $2
      GROUP BY evaluated_id, evaluated_type;
    `;

    try {
      const result = await query(sql, [userId, userType]);
      const row = result.rows[0];

      if (!row) {
        return {
          user_id: userId,
          user_type: userType,
          total_evaluations: 0,
          average_rating: 0,
          rating_distribution: {
            rating_1: 0,
            rating_2: 0,
            rating_3: 0,
            rating_4: 0,
            rating_5: 0,
          },
        };
      }

      return {
        user_id: row.user_id,
        user_type: row.user_type,
        total_evaluations: parseInt(row.total_evaluations, 10),
        average_rating: parseFloat(row.average_rating) || 0,
        rating_distribution: {
          rating_1: parseInt(row.rating_1, 10),
          rating_2: parseInt(row.rating_2, 10),
          rating_3: parseInt(row.rating_3, 10),
          rating_4: parseInt(row.rating_4, 10),
          rating_5: parseInt(row.rating_5, 10),
        },
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Vérifie si une évaluation existe déjà pour un contrat et un évaluateur
   */
  async evaluationExists(
    contractId: string,
    evaluatorId: string,
    evaluatorType: UserType,
  ): Promise<boolean> {
    const sql = `
      SELECT 1 FROM evaluations
      WHERE contract_id = $1 AND evaluator_id = $2 AND evaluator_type = $3
      LIMIT 1;
    `;

    try {
      const result = await query(sql, [contractId, evaluatorId, evaluatorType]);
      return result.rows.length > 0;
    } catch (error) {
      console.error("Erreur lors de la vérification de l'évaluation:", error);
      throw new Error("Erreur de base de données");
    }
  }

  /**
   * Récupère les évaluations données par un utilisateur
   */
  async getEvaluationsByEvaluator(
    evaluatorId: string,
    evaluatorType: UserType,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Evaluation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.getEvaluationsWithFilters({
      evaluator_id: evaluatorId,
      evaluator_type: evaluatorType,
      page,
      limit,
    });
  }

  /**
   * Récupère les évaluations reçues par un utilisateur
   */
  async getEvaluationsByEvaluated(
    evaluatedId: string,
    evaluatedType: UserType,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Evaluation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.getEvaluationsWithFilters({
      evaluated_id: evaluatedId,
      evaluated_type: evaluatedType,
      page,
      limit,
    });
  }

  /**
   * Récupère les évaluations d'un contrat
   */
  async getEvaluationsByContract(contractId: string): Promise<Evaluation[]> {
    const result = await this.getEvaluationsWithFilters({
      contract_id: contractId,
      limit: 100, // Limite élevée car un contrat ne devrait avoir que 2 évaluations max
    });
    return result.data;
  }
}
