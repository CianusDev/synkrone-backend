import { query } from "../../config/database";
import { WorkDay, WorkDayStatus, CreateWorkDayData, UpdateWorkDayData } from "./work-days.model";

export class WorkDaysRepository {
  /**
   * Crée un jour de travail
   */
  async createWorkDay(data: CreateWorkDayData): Promise<WorkDay> {
    const result = await query<WorkDay>(
      `INSERT INTO work_days (deliverable_id, freelance_id, work_date, description, tjm_applied, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, deliverable_id AS "deliverableId", freelance_id AS "freelanceId", work_date AS "workDate", description, status, tjm_applied AS "tjmApplied", amount, submitted_at AS "submittedAt", validated_at AS "validatedAt", rejection_reason AS "rejectionReason", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        data.deliverableId,
        data.freelanceId,
        data.workDate,
        data.description,
        data.tjmApplied,
        WorkDayStatus.DRAFT,
      ],
    );
    return result.rows[0];
  }

  /**
   * Récupère un jour de travail par son id
   */
  async getWorkDayById(id: string): Promise<WorkDay | null> {
    const result = await query<WorkDay>(
      `SELECT id, deliverable_id AS "deliverableId", freelance_id AS "freelanceId", work_date AS "workDate", description, status, tjm_applied AS "tjmApplied", amount, submitted_at AS "submittedAt", validated_at AS "validatedAt", rejection_reason AS "rejectionReason", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM work_days WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  /**
   * Récupère tous les jours de travail d'un livrable
   */
  async getWorkDaysByDeliverable(deliverableId: string): Promise<WorkDay[]> {
    const result = await query<WorkDay>(
      `SELECT id, deliverable_id AS "deliverableId", freelance_id AS "freelanceId", work_date AS "workDate", description, status, tjm_applied AS "tjmApplied", amount, submitted_at AS "submittedAt", validated_at AS "validatedAt", rejection_reason AS "rejectionReason", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM work_days WHERE deliverable_id = $1 ORDER BY work_date DESC`,
      [deliverableId],
    );
    return result.rows;
  }

  /**
   * Récupère tous les jours de travail d'un freelance avec filtres
   */
  async getWorkDaysByFreelance(
    freelanceId: string,
    filters?: {
      status?: WorkDayStatus;
      dateFrom?: string;
      dateTo?: string;
      deliverableId?: string;
    }
  ): Promise<WorkDay[]> {
    let sql = `SELECT id, deliverable_id AS "deliverableId", freelance_id AS "freelanceId", work_date AS "workDate", description, status, tjm_applied AS "tjmApplied", amount, submitted_at AS "submittedAt", validated_at AS "validatedAt", rejection_reason AS "rejectionReason", created_at AS "createdAt", updated_at AS "updatedAt"
               FROM work_days WHERE freelance_id = $1`;
    const values: any[] = [freelanceId];
    let paramIndex = 2;

    if (filters?.status) {
      sql += ` AND status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters?.dateFrom) {
      sql += ` AND work_date >= $${paramIndex}`;
      values.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters?.dateTo) {
      sql += ` AND work_date <= $${paramIndex}`;
      values.push(filters.dateTo);
      paramIndex++;
    }

    if (filters?.deliverableId) {
      sql += ` AND deliverable_id = $${paramIndex}`;
      values.push(filters.deliverableId);
      paramIndex++;
    }

    sql += ` ORDER BY work_date DESC`;

    const result = await query<WorkDay>(sql, values);
    return result.rows;
  }

  /**
   * Met à jour un jour de travail
   */
  async updateWorkDay(id: string, data: UpdateWorkDayData): Promise<WorkDay | null> {
    const fields = [];
    const values = [];
    let idx = 2;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        // Mapper les noms de champs TypeScript vers les noms de colonnes SQL
        let sqlField = key;
        switch (key) {
          case "workDate":
            sqlField = "work_date";
            break;
          case "tjmApplied":
            sqlField = "tjm_applied";
            break;
          case "rejectionReason":
            sqlField = "rejection_reason";
            break;
        }
        fields.push(`${sqlField} = $${idx++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) return this.getWorkDayById(id);

    // Ajouter updated_at
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    const result = await query<WorkDay>(
      `UPDATE work_days SET ${fields.join(", ")} WHERE id = $1
       RETURNING id, deliverable_id AS "deliverableId", freelance_id AS "freelanceId", work_date AS "workDate", description, status, tjm_applied AS "tjmApplied", amount, submitted_at AS "submittedAt", validated_at AS "validatedAt", rejection_reason AS "rejectionReason", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id, ...values],
    );
    return result.rows[0] ?? null;
  }

  /**
   * Supprime un jour de travail
   */
  async deleteWorkDay(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM work_days WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Soumet des jours de travail (change le statut en 'submitted')
   */
  async submitWorkDays(workDayIds: string[]): Promise<WorkDay[]> {
    const result = await query<WorkDay>(
      `UPDATE work_days SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ANY($1) AND status = 'draft'
       RETURNING id, deliverable_id AS "deliverableId", freelance_id AS "freelanceId", work_date AS "workDate", description, status, tjm_applied AS "tjmApplied", amount, submitted_at AS "submittedAt", validated_at AS "validatedAt", rejection_reason AS "rejectionReason", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [workDayIds],
    );
    return result.rows;
  }

  /**
   * Valide un jour de travail
   */
  async validateWorkDay(id: string): Promise<WorkDay | null> {
    const result = await query<WorkDay>(
      `UPDATE work_days SET status = 'validated', validated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'submitted'
       RETURNING id, deliverable_id AS "deliverableId", freelance_id AS "freelanceId", work_date AS "workDate", description, status, tjm_applied AS "tjmApplied", amount, submitted_at AS "submittedAt", validated_at AS "validatedAt", rejection_reason AS "rejectionReason", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  /**
   * Rejette un jour de travail
   */
  async rejectWorkDay(id: string, rejectionReason: string): Promise<WorkDay | null> {
    const result = await query<WorkDay>(
      `UPDATE work_days SET status = 'rejected', rejection_reason = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'submitted'
       RETURNING id, deliverable_id AS "deliverableId", freelance_id AS "freelanceId", work_date AS "workDate", description, status, tjm_applied AS "tjmApplied", amount, submitted_at AS "submittedAt", validated_at AS "validatedAt", rejection_reason AS "rejectionReason", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id, rejectionReason],
    );
    return result.rows[0] ?? null;
  }

  /**
   * Vérifie si un jour de travail existe pour une date donnée et un livrable
   */
  async workDayExistsForDate(deliverableId: string, workDate: string): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM work_days WHERE deliverable_id = $1 AND work_date = $2`,
      [deliverableId, workDate],
    );
    return result.rows.length > 0;
  }

  /**
   * Récupère les statistiques des jours de travail pour un livrable
   */
  async getWorkDayStatsByDeliverable(deliverableId: string): Promise<{
    totalDays: number;
    draftDays: number;
    submittedDays: number;
    validatedDays: number;
    rejectedDays: number;
    totalAmount: number;
    validatedAmount: number;
  }> {
    const result = await query(
      `SELECT
         COUNT(*) as total_days,
         COUNT(*) FILTER (WHERE status = 'draft') as draft_days,
         COUNT(*) FILTER (WHERE status = 'submitted') as submitted_days,
         COUNT(*) FILTER (WHERE status = 'validated') as validated_days,
         COUNT(*) FILTER (WHERE status = 'rejected') as rejected_days,
         COALESCE(SUM(tjm_applied), 0) as total_amount,
         COALESCE(SUM(CASE WHEN status = 'validated' THEN tjm_applied ELSE 0 END), 0) as validated_amount
       FROM work_days WHERE deliverable_id = $1`,
      [deliverableId],
    );

    const row = result.rows[0];
    return {
      totalDays: parseInt(row.total_days),
      draftDays: parseInt(row.draft_days),
      submittedDays: parseInt(row.submitted_days),
      validatedDays: parseInt(row.validated_days),
      rejectedDays: parseInt(row.rejected_days),
      totalAmount: parseFloat(row.total_amount),
      validatedAmount: parseFloat(row.validated_amount),
    };
  }
}
