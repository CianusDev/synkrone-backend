import { Media } from "../media/media.model";
import { Contract } from "../contracts/contracts.model";

export enum DeliverableStatus {
  PLANNED = "planned",
  IN_PROGRESS = "in_progress",
  SUBMITTED = "submitted",
  VALIDATED = "validated",
  REJECTED = "rejected",
}

/**
 * Représente un livrable dans le cadre d'un contrat.
 * Le champ `order` permet de définir la position du livrable dans la séquence prévue du contrat.
 */
export interface Deliverable {
  id: string;
  contractId: string;
  title: string;
  description?: string;
  status: DeliverableStatus;
  isMilestone?: boolean;
  amount?: number;
  dueDate?: string;
  submittedAt?: string;
  validatedAt?: string;
  feedback?: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
  medias?: Media[];
  contract?: Partial<Contract>;
  freelance?: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    photo_url?: string;
  };
  canEvaluated?: boolean;
}
