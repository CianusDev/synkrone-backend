export enum NotificationTypeEnum {
  project = "project",
  application = "application",
  payment = "payment",
  message = "message",
  system = "system",
}

export interface Notification {
  id: string;
  user_id: string;
  title?: string;
  message?: string;
  type: NotificationTypeEnum;
  is_read: boolean;
  created_at: Date;
  updated_at: Date | null;
}
