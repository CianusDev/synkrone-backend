export interface UserNotification {
  id: string;
  user_id: string;
  notification_id: string;
  is_read: boolean;
  created_at: Date;
  updated_at: Date | null;
}
