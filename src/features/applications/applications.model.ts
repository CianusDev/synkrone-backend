import { Freelance } from "../freelance/freelance.model";
import { Project } from "../projects/projects.model";

export enum ApplicationStatus {
  SUBMITTED = "submitted",
  UNDER_REVIEW = "under_review",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  WITHDRAWN = "withdrawn",
}

export interface Application {
  id: string;
  project_id: string;
  freelance_id: string;

  proposed_rate?: number;
  cover_letter?: string;
  status: ApplicationStatus;
  submission_date: Date;
  response_date?: Date | null;

  // Relations optionnelles pour enrichir les réponses
  freelance?: Partial<Freelance>;
  project?: Project;
  freelanceStats?: ApplicationStats;
  projectStats?: ApplicationStats;
}

export interface ApplicationStats {
  submitted: number;
  accepted: number;
  rejected: number;
  under_review: number;
  withdrawn: number;
  total: number;
}
