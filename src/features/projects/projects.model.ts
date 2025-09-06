export enum ProjectStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  IS_PENDING = "is_pending",
}

export enum TypeWork {
  REMOTE = "remote",
  HYBRIDE = "hybride",
  PRESENTIEL = "presentiel",
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  budget?: number;
  deadline?: string; // ISO date string
  status: ProjectStatus;
  typeWork?: TypeWork;
  categoryId?: string;
  companyId: string;
  createdAt: string;
  updatedAt?: string;
}
