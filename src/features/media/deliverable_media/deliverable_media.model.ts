export interface DeliverableMedia {
  deliverableId: string; // UUID
  mediaId: string;       // UUID
  deletedAt?: Date | null;
  createdAt: Date;
}
