export interface UserSession {
  id: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  lastActivityAt: Date;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
}
