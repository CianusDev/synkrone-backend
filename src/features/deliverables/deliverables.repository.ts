import { query } from "../../config/database";
import { Deliverable, DeliverableStatus } from "./deliverables.model";

export class DeliverablesRepository {
  /**
   * Crée un livrable
   */
  async createDeliverable(
    data: Omit<Deliverable, "id" | "createdAt" | "updatedAt">,
  ): Promise<Deliverable> {
    const result = await query<Deliverable>(
      `INSERT INTO deliverables (contract_id, title, description, status, is_milestone, amount, due_date, submitted_at, validated_at, feedback, "order")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, contract_id AS "contractId", title, description, status, is_milestone AS "isMilestone", amount, due_date AS "dueDate", submitted_at AS "submittedAt", validated_at AS "validatedAt", feedback, "order", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        data.contractId,
        data.title,
        data.description ?? null,
        data.status ?? DeliverableStatus.PLANNED,
        data.isMilestone ?? false,
        data.amount ?? 0,
        data.dueDate ?? null,
        data.submittedAt ?? null,
        data.validatedAt ?? null,
        data.feedback ?? null,
        data.order ?? null,
      ],
    );
    return result.rows[0];
  }

  /**
   * Récupère un livrable par son id
   */
  async getDeliverableById(id: string): Promise<Deliverable | null> {
    const result = await query<Deliverable>(
      `SELECT id, contract_id AS "contractId", title, description, status, is_milestone AS "isMilestone", amount, due_date AS "dueDate", submitted_at AS "submittedAt", validated_at AS "validatedAt", feedback, "order", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM deliverables WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  /**
   * Récupère tous les livrables d'un contrat
   */
  async getDeliverablesByContract(contractId: string): Promise<Deliverable[]> {
    const result = await query<Deliverable>(
      `SELECT id, contract_id AS "contractId", title, description, status, is_milestone AS "isMilestone", amount, due_date AS "dueDate", submitted_at AS "submittedAt", validated_at AS "validatedAt", feedback, "order", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM deliverables WHERE contract_id = $1 ORDER BY "order" ASC, created_at ASC`,
      [contractId],
    );
    return result.rows;
  }

  /**
   * Met à jour un livrable
   */
  async updateDeliverable(
    id: string,
    data: Partial<
      Omit<Deliverable, "id" | "contractId" | "createdAt" | "updatedAt">
    >,
  ): Promise<Deliverable | null> {
    const fields = [];
    const values = [];
    let idx = 2;

    for (const [key, value] of Object.entries(data)) {
      // Mapper les noms de champs TypeScript vers les noms de colonnes SQL
      const sqlField = key === "dueDate" ? "due_date" : key;
      fields.push(`${sqlField} = $${idx++}`);
      values.push(value);
    }
    if (fields.length === 0) return this.getDeliverableById(id);

    const result = await query<Deliverable>(
      `UPDATE deliverables SET ${fields.join(", ")} WHERE id = $1
       RETURNING id, contract_id AS "contractId", title, description, status, is_milestone AS "isMilestone", amount, due_date AS "dueDate", submitted_at AS "submittedAt", validated_at AS "validatedAt", feedback, "order", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id, ...values],
    );
    return result.rows[0] ?? null;
  }

  /**
   * Supprime un livrable
   */
  async deleteDeliverable(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM deliverables WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
