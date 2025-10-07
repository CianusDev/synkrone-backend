import { Freelance } from "../freelance/freelance.model";
import { Company } from "../company/company.model";
import { Project } from "../projects/projects.model";
import { FreelanceSkills } from "../freelance-skills/freelance-skills.model";

export enum AdminLevel {
  SUPER_ADMIN = "super_admin",
  MODERATEUR = "moderateur",
  SUPPORT = "support",
}

export interface Admin {
  id: string;
  username: string;
  email?: string;
  password_hashed: string;
  level: AdminLevel;
  created_at: Date;
}

// Stats Dashboard
export interface DashboardStats {
  users: {
    totalFreelances: number;
    totalCompanies: number;
    verifiedFreelances: number;
    verifiedCompanies: number;
    blockedFreelances: number;
    blockedCompanies: number;
    newFreelancesThisMonth: number;
    newCompaniesThisMonth: number;
  };
  projects: {
    totalProjects: number;
    draftProjects: number;
    publishedProjects: number;
    pendingProjects: number;
    newProjectsThisMonth: number;
  };
  contracts: {
    totalContracts: number;
    activeContracts: number;
    completedContracts: number;
    cancelledContracts: number;
  };
  sessions: {
    totalActiveSessions: number;
    activeFreelanceSessions: number;
    activeCompanySessions: number;
    activeAdminSessions: number;
    sessionsLast24h: number;
  };
  platform: {
    totalRevenue: number;
    totalCommissions: number;
    averageProjectValue: number;
    completionRate: number;
  };
}

// Session Management
export interface UserSession {
  sessionId: string;
  userId: string;
  userEmail: string;
  userType: "freelance" | "company";
  userName: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  lastActivityAt: Date;
  expiresAt: Date;
  sessionStarted: Date;
  revokedAt?: Date;
  sessionStatus: "active" | "expired" | "revoked" | "inactive";
  minutesSinceActivity: number;
}

export interface AdminSession {
  sessionId: string;
  adminId: string;
  adminUsername: string;
  adminEmail?: string;
  adminLevel: AdminLevel;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  lastActivityAt: Date;
  expiresAt: Date;
  sessionStarted: Date;
  revokedAt?: Date;
  sessionStatus: "active" | "expired" | "revoked" | "inactive";
  minutesSinceActivity: number;
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  revokedSessions: number;
  uniqueUsersWithSessions: number;
  sessionsLast24h: number;
  activeLastHour: number;
}

export interface SuspiciousActivity {
  userId: string;
  userEmail: string;
  userType: "freelance" | "company";
  differentIps: number;
  totalSessions: number;
  lastActivity: Date;
  ipAddresses: string[];
}

// Admin Actions
export interface AdminAction {
  adminId: string;
  targetType: "freelance" | "company" | "project" | "session";
  targetId: string;
  action:
    | "block"
    | "unblock"
    | "verify"
    | "unverify"
    | "delete"
    | "revoke_session"
    | "moderate";
  reason?: string;
  duration?: number; // pour les blocages temporaires
  metadata?: Record<string, any>;
  timestamp: Date;
}

// Extended models with admin-specific fields
export interface AdminFreelanceView extends Freelance {
  applicationsCount?: number;
  contractsCount?: number;
  averageRating?: number;
  totalEarnings?: number;
  lastActivity?: Date;
  isBlocked?: boolean;
  is_blocked?: boolean;
  blockReason?: string;
  blockExpiresAt?: Date;
  skills?: FreelanceSkills[];
}

export interface AdminCompanyView extends Company {
  projectsCount?: number;
  contractsCount?: number;
  averageRating?: number;
  totalSpent?: number;
  lastActivity?: Date;
  isBlocked?: boolean;
  is_blocked?: boolean;
  blockReason?: string;
  blockExpiresAt?: Date;
}

export interface AdminProjectView extends Project {
  moderationStatus?: "approved" | "flagged" | "under_review";
  flaggedReason?: string;
  moderatedBy?: string;
  moderatedAt?: Date;
}

// Extended models for contracts management
export interface AdminContractView {
  freelanceName?: string;
  freelanceEmail?: string;
  companyName?: string;
  companyEmail?: string;
  projectTitle?: string;
  deliverablesCount?: number;
  completedDeliverables?: number;
  totalPaid?: number;
  totalDue?: number;
  workDaysCount?: number;
  validatedWorkDays?: number;
  averageRating?: number;
  hasDispute?: boolean;
  lastActivity?: Date;
  paymentStatus?: "up_to_date" | "pending" | "overdue";
}

export interface AdminDeliverableView {
  contractTitle?: string;
  freelanceName?: string;
  companyName?: string;
  workDaysCount?: number;
  validatedWorkDays?: number;
  pendingWorkDays?: number;
  totalWorkAmount?: number;
  validatedAmount?: number;
  mediaCount?: number;
}

export interface ContractDispute {
  id: string;
  contractId: string;
  declarantId: string;
  declarantType: "freelance" | "company";
  description: string;
  status: "open" | "in_review" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: Date;
  resolvedAt?: Date;
  adminId?: string;
  resolution?: string;
}

// Filters for admin lists
export interface AdminFreelanceFilters {
  page?: number;
  limit?: number;
  search?: string;
  isVerified?: boolean;
  isBlocked?: boolean;
  availability?: string;
  experience?: string;
  country?: string;
  minTjm?: number;
  maxTjm?: number;
  sortBy?: "created_at" | "updated_at" | "tjm" | "rating";
  sortOrder?: "asc" | "desc";
}

export interface AdminCompanyFilters {
  page?: number;
  limit?: number;
  search?: string;
  isVerified?: boolean;
  isCertified?: boolean;
  isBlocked?: boolean;
  industry?: string;
  companySize?: string;
  country?: string;
  sortBy?: "created_at" | "updated_at" | "company_name";
  sortOrder?: "asc" | "desc";
}

export interface AdminProjectFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  typeWork?: string;
  companyId?: string;
  categoryId?: string;
  minBudget?: number;
  maxBudget?: number;
  sortBy?: "created_at" | "updated_at" | "budget_min" | "applications_count";
  sortOrder?: "asc" | "desc";
}

export interface AdminSessionFilters {
  page?: number;
  limit?: number;
  userType?: "freelance" | "company";
  sessionStatus?: "active" | "expired" | "revoked" | "inactive";
  sortBy?: "last_activity_at" | "created_at" | "expires_at";
  sortOrder?: "asc" | "desc";
}

export interface AdminContractFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?:
    | "draft"
    | "active"
    | "pending"
    | "completed"
    | "cancelled"
    | "suspended";
  paymentMode?: "fixed_price" | "daily_rate" | "by_milestone";
  freelanceId?: string;
  companyId?: string;
  projectId?: string;
  hasDispute?: boolean;
  paymentStatus?: "up_to_date" | "pending" | "overdue";
  minAmount?: number;
  maxAmount?: number;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  sortBy?:
    | "created_at"
    | "start_date"
    | "end_date"
    | "total_amount"
    | "last_activity";
  sortOrder?: "asc" | "desc";
}

export interface AdminDeliverableFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: "planned" | "in_progress" | "submitted" | "validated" | "rejected";
  contractId?: string;
  isMilestone?: boolean;
  overdue?: boolean;
  sortBy?: "created_at" | "due_date" | "submitted_at" | "amount";
  sortOrder?: "asc" | "desc";
}

export interface AdminPaymentFilters {
  page?: number;
  limit?: number;
  status?: "pending" | "completed" | "failed" | "refunded";
  type?: "milestone" | "fixed_price" | "commission" | "other";
  contractId?: string;
  freelanceId?: string;
  companyId?: string;
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "created_at" | "transaction_date" | "amount";
  sortOrder?: "asc" | "desc";
}
