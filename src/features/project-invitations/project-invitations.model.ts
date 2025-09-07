export enum InvitationStatus {
  SENT = "sent",
  VIEWED = "viewed",
  ACCEPTED = "accepted",
  DECLINED = "declined",
  EXPIRED = "expired",
}

export interface ProjectInvitation {
  id: string;
  project_id: string;
  freelance_id: string;
  company_id: string;
  message?: string;
  status: InvitationStatus;
  sent_at: Date;
  responded_at?: Date | null;
  expires_at?: Date | null;
}
