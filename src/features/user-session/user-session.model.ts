export interface UserSession {
  id: string;
  user_id: string;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
  last_activity_at: Date;
  expires_at: Date;
  created_at: Date;
  revoked_at: Date | null;
}
