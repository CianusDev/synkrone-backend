import { ProjectSkillWithDetails } from "../project-skills/project-skills.model";
import { Company } from "../company/company.model";

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
  budgetMin?: number;
  budgetMax?: number;
  location?: string;
  deadline?: string; // ISO date string
  status: ProjectStatus;
  typeWork?: TypeWork;
  categoryId?: string;
  companyId: string;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
  durationDays?: number;
  applicationsCount?: number;
  invitationsCount?: number;
  skills?: ProjectSkillWithDetails[];
  recentProjects?: Project[];
  company?: Company;
  isApplied?: boolean; // <-- Ajouté
}
