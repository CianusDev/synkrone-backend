export enum ContractStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  SUSPENDED = "suspended",
}

export enum PaymentMode {
  BY_MILESTONE = "by_milestone",
  FINAL_PAYMENT = "final_payment",
}

export interface Contract {
  id: string;
  application_id: string;
  project_id: string;
  freelance_id: string;
  company_id: string;
  agreed_rate?: number;
  payment_mode: PaymentMode;
  terms?: string;
  start_date?: Date;
  end_date?: Date;
  status: ContractStatus;
  created_at: Date;
}
