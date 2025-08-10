export interface AdminSession {
  id: string;
  admin_id: string;
  ip_address?: string;
  userAgent?: string;
  is_active: boolean;
  lastActivityAt: Date;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
}
