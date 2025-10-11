export enum NotificationTypeEnum {
  project = "project",
  application = "application",
  payment = "payment",
  message = "message",
  system = "system",
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationTypeEnum;
  is_global: boolean;
  metadata?: NotificationMetadata | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface NotificationMetadata {
  // Identifiants d'entités liées
  deliverable_id?: string;
  contract_id?: string;
  project_id?: string;
  freelance_id?: string;
  company_id?: string;
  logo_url?: string;
  freelance_fullname?: string;
  // Informations contextuelles
  deliverable_title?: string;
  deliverable_status?: string;
  project_title?: string;
  freelance_name?: string;
  company_name?: string;
  completion_date?: string;
  feedback?: string;

  // Métadonnées d'action
  action?: string;
  priority?: "low" | "medium" | "high";
  icon?: string;
  color?: "primary" | "success" | "warning" | "error" | "info";
  link?: string;

  // Flags spéciaux
  can_evaluate?: boolean;
  auto_completed?: boolean;
  media_removed?: boolean;

  // Autres métadonnées dynamiques
  [key: string]: any;
}
