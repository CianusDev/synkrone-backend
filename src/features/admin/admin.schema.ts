import { z } from "zod";
import { AdminLevel } from "./admin.model";

// Schéma pour la création d'un admin
export const createAdminSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  email: z.string().email("Format d'email invalide").optional(),
  password_hashed: z.string().min(1, "Le mot de passe hashé est requis"),
  level: z.nativeEnum(AdminLevel, { message: "Niveau d'admin invalide" }),
});

// Schéma pour la mise à jour du mot de passe d'un admin
export const updateAdminPasswordSchema = z.object({
  password_hashed: z.string().min(1, "Le mot de passe hashé est requis"),
});

// Schéma pour la mise à jour du niveau d'un admin
export const updateAdminLevelSchema = z.object({
  level: z.nativeEnum(AdminLevel, { message: "Niveau d'admin invalide" }),
});

// Schéma pour la validation des IDs UUID
export const adminIdSchema = z.object({
  id: z.uuid({ message: "ID invalide (UUID attendu)" }),
});

// Schéma pour bloquer un utilisateur
export const blockUserSchema = z.object({
  durationDays: z.number().int().min(-1, "Durée invalide (-1 pour indéfini, 0+ pour temporaire)").default(-1),
  reason: z.string().optional(),
});

// Schéma pour vérifier/certifier un utilisateur
export const verifyUserSchema = z.object({
  reason: z.string().optional(),
});

// Schéma pour révoquer une session
export const revokeSessionSchema = z.object({
  sessionId: z.uuid({ message: "ID de session invalide" }),
  reason: z.string().optional(),
});

// Schéma pour mettre à jour le statut d'un projet
export const updateProjectStatusSchema = z.object({
  status: z.enum(["draft", "published", "is_pending"], { message: "Statut de projet invalide" }),
  reason: z.string().optional(),
});

// Schémas de filtres pour les listes admin

// Filtres pour les freelances
export const adminFreelanceFiltersSchema = z.object({
  page: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int().positive(),
    ])
    .optional(),
  limit: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int().positive(),
    ])
    .optional(),
  search: z.string().optional(),
  isVerified: z
    .union([
      z.string().transform((val) => val === "true"),
      z.boolean(),
    ])
    .optional(),
  isBlocked: z
    .union([
      z.string().transform((val) => val === "true"),
      z.boolean(),
    ])
    .optional(),
  availability: z.enum(["available", "busy", "unavailable"]).optional(),
  experience: z.enum(["beginner", "intermediate", "expert"]).optional(),
  country: z.string().optional(),
  minTjm: z
    .union([
      z.string().transform((val) => parseFloat(val)),
      z.number(),
    ])
    .optional(),
  maxTjm: z
    .union([
      z.string().transform((val) => parseFloat(val)),
      z.number(),
    ])
    .optional(),
  sortBy: z.enum(["created_at", "updated_at", "tjm", "rating"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Filtres pour les entreprises
export const adminCompanyFiltersSchema = z.object({
  page: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int().positive(),
    ])
    .optional(),
  limit: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int().positive(),
    ])
    .optional(),
  search: z.string().optional(),
  isVerified: z
    .union([
      z.string().transform((val) => val === "true"),
      z.boolean(),
    ])
    .optional(),
  isCertified: z
    .union([
      z.string().transform((val) => val === "true"),
      z.boolean(),
    ])
    .optional(),
  isBlocked: z
    .union([
      z.string().transform((val) => val === "true"),
      z.boolean(),
    ])
    .optional(),
  industry: z.string().optional(),
  companySize: z.enum(["micro", "small", "medium", "large", "very_large"]).optional(),
  country: z.string().optional(),
  sortBy: z.enum(["created_at", "updated_at", "company_name"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Filtres pour les projets
export const adminProjectFiltersSchema = z.object({
  page: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int().positive(),
    ])
    .optional(),
  limit: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int().positive(),
    ])
    .optional(),
  search: z.string().optional(),
  status: z.enum(["draft", "published", "is_pending"]).optional(),
  typeWork: z.enum(["remote", "hybride", "presentiel"]).optional(),
  companyId: z.uuid().optional(),
  categoryId: z.uuid().optional(),
  minBudget: z
    .union([
      z.string().transform((val) => parseFloat(val)),
      z.number(),
    ])
    .optional(),
  maxBudget: z
    .union([
      z.string().transform((val) => parseFloat(val)),
      z.number(),
    ])
    .optional(),
  sortBy: z.enum(["created_at", "updated_at", "budget_min", "applications_count"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Filtres pour les sessions
export const adminSessionFiltersSchema = z.object({
  page: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int().positive(),
    ])
    .optional(),
  limit: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int().positive(),
    ])
    .optional(),
  userType: z.enum(["freelance", "company"]).optional(),
  sessionStatus: z.enum(["active", "expired", "revoked", "inactive"]).optional(),
  sortBy: z.enum(["last_activity_at", "created_at", "expires_at"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});
