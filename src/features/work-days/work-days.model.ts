export enum WorkDayStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  VALIDATED = "validated",
  REJECTED = "rejected",
}

/**
 * Représente un jour de travail associé à un livrable.
 * Permet au freelance de justifier son travail quotidien et de calculer le paiement basé sur le TJM.
 */
export interface WorkDay {
  id: string;
  deliverableId: string;
  freelanceId: string;
  workDate: string;
  description: string;
  status: WorkDayStatus;
  tjmApplied?: number;
  amount?: number;
  submittedAt?: string;
  validatedAt?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Interface pour la création d'un jour de travail
 */
export interface CreateWorkDayData {
  deliverableId: string;
  freelanceId: string;
  workDate: string;
  description: string;
  tjmApplied: number;
}

/**
 * Interface pour la mise à jour d'un jour de travail
 */
export interface UpdateWorkDayData {
  workDate?: string;
  description?: string;
  tjmApplied?: number;
  status?: WorkDayStatus;
  rejectionReason?: string;
}
