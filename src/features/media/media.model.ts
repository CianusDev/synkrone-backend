export enum MediaType {
  PDF = "pdf",
  IMAGE = "image",
  DOC = "doc",
  ZIP = "zip",
  OTHER = "other",
}

export interface Media {
  id: string; // UUID
  url: string;
  type: MediaType;
  uploadedBy?: string; // UUID, optionnel
  uploadedAt: Date;
  description?: string;
}
