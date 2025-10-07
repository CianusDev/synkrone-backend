import { FreelanceSkills } from "../freelance-skills/freelance-skills.model";

export enum Availability {
  AVAILABLE = "available",
  UNAVAILABLE = "unavailable",
  BUSY = "busy",
}

export enum ExprerienceLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  EXPERT = "expert",
}

export interface Freelance {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  password_hashed: string;
  photo_url?: string;
  job_title?: string;
  experience?: ExprerienceLevel;
  description?: string;
  cover_url?: string;
  linkedin_url?: string;
  tjm?: number;
  availability?: Availability;
  location?: string;
  is_verified: boolean;
  country?: string;
  city?: string;
  phone?: string;
  block_duration: number;
  skills?: FreelanceSkills[];
  is_first_login?: boolean;
  deleted_at: Date | null;
  blocked_at: Date | null;
  created_at: Date;
  updated_at: Date | null;
  isBlocked?: boolean;
}
