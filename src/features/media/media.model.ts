export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
  DOCUMENT = "document",
  // Ajoute d'autres types si ton type_media_enum en contient plus
}

export interface Media {
  id: string; // UUID
  url: string;
  type: MediaType;
  uploadedBy?: string; // UUID, optionnel
  uploadedAt: Date;
  description?: string;
}
