import { ProjectSkillWithDetails } from "../project-skills/project-skills.model";
import { Company } from "../company/company.model";
import { Application } from "../applications/applications.model";
import { ExprerienceLevel } from "../freelance/freelance.model";
import { Contract } from "../contracts/contracts.model";
import { Deliverable } from "../deliverables/deliverables.model";

export enum ProjectStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  IS_PENDING = "is_pending",
  CLOSED = "closed",
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
  allowMultipleApplications?: boolean;
  levelExperience?: ExprerienceLevel;
  tjmProposed?: number;
  applicationsCount?: number;
  invitationsCount?: number;
  skills?: ProjectSkillWithDetails[];
  recentProjects?: Project[];
  applications?: Application[];
  company?: Company;
  isApplied?: boolean; // <-- Ajouté
  isAccepted?: boolean; // <-- Ajouté
  applicationId?: string; // <-- Ajouté
  contract?: Contract; // <-- Ajouté pour les missions
  deliverableCount?: number; // <-- Ajouté pour le nombre de livrables
  deliverables?: Deliverable[]; // <-- Ajouté pour les livrables du contrat
}
