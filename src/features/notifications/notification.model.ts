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
  metadata?: Record<string, string> | null;
  created_at: Date;
  updated_at: Date | null;
}
