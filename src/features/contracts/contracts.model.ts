import { Project } from "../projects/projects.model";
import { Freelance } from "../freelance/freelance.model";

export enum ContractStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  PENDING = "pending",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  SUSPENDED = "suspended",
}

export enum PaymentMode {
  FIXED_PRICE = "fixed_price",
  DAILY_RATE = "daily_rate",
  BY_MILESTONE = "by_milestone",
}

export interface Contract {
  id: string;
  application_id: string;
  project_id: string;
  freelance_id: string;
  company_id: string;
  payment_mode: PaymentMode;
  total_amount?: number;
  tjm?: number;
  estimated_days?: number;
  terms?: string;
  start_date?: Date;
  end_date?: Date;
  status: ContractStatus;
  created_at: Date;
  project?: Project;
  freelance?: Freelance;
}

/**
 * Interface pour la création d'un contrat
 */
export interface CreateContractData {
  application_id: string;
  project_id: string;
  freelance_id: string;
  company_id: string;
  payment_mode: PaymentMode;
  total_amount?: number;
  tjm?: number;
  estimated_days?: number;
  terms?: string;
  start_date?: Date;
  end_date?: Date;
  status?: ContractStatus;
}
