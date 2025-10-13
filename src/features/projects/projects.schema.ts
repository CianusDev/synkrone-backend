import { z } from "zod";
import { ProjectStatus, TypeWork } from "./projects.model";
import { ExprerienceLevel } from "../freelance/freelance.model";

// Schéma pour la création d'un projet
export const createProjectSchema = z.object({
  title: z.string().min(1, "Le titre est requis."),
  description: z.string().optional(),
  budgetMin: z
    .number()
    .positive("Le budget minimum doit être positif.")
    .optional(),
  budgetMax: z
    .number()
    .positive("Le budget maximum doit être positif.")
    .optional(),
  deadline: z
    .string()
    .refine(
      (val) => !val || new Date(val) > new Date(),
      "La deadline doit être une date future.",
    )
    .optional(),
  durationDays: z.number().int().nonnegative().optional(),
  status: z.enum(ProjectStatus).optional(),
  typeWork: z.enum(TypeWork).optional(),
  categoryId: z.uuid().optional(),
  companyId: z.uuid({ message: "companyId doit être un UUID." }),
  allowMultipleApplications: z.boolean().optional(),
  levelExperience: z.enum(ExprerienceLevel).optional(),
  tjmProposed: z.number().positive().optional(),
});

// Schéma pour la mise à jour d'un projet
export const updateProjectSchema = z.object({
  title: z.string().min(1, "Le titre est requis.").optional(),
  description: z.string().optional(),
  budgetMin: z
    .number()
    .positive("Le budget minimum doit être positif.")
    .optional(),
  budgetMax: z
    .number()
    .positive("Le budget maximum doit être positif.")
    .optional(),
  deadline: z
    .string()
    .refine(
      (val) => !val || new Date(val) > new Date(),
      "La deadline doit être une date future.",
    )
    .optional(),
  durationDays: z.number().int().nonnegative().optional(),
  status: z.enum(ProjectStatus).optional(),
  typeWork: z.enum(TypeWork).optional(),
  categoryId: z.uuid().optional(),
  companyId: z.uuid({ message: "companyId doit être un UUID." }).optional(),
  publishedAt: z.string().optional(),
  allowMultipleApplications: z.boolean().optional(),
  levelExperience: z.enum(ExprerienceLevel).optional(),
  tjmProposed: z.number().positive().optional(),
});

// Schéma pour la validation de l'ID (UUID)
export const projectIdSchema = z.object({
  id: z.uuid({ message: "ID de projet invalide (UUID attendu)." }),
});

// Schéma pour la recherche, pagination et filtres sur la liste des projets
// Note: pour l'endpoint public GET /projects, le status est forcé à 'published'
export const getProjectsWithFiltersSchema = z.object({
  status: z.enum(ProjectStatus).optional(), // Ignoré pour GET /projects (toujours 'published')
  typeWork: z.enum(TypeWork).optional(),
  companyId: z.uuid().optional(),
  categoryId: z.uuid().optional(),
  search: z.string().optional(),
  levelExperience: z.enum(ExprerienceLevel).optional(),
  allowMultipleApplications: z.boolean().optional(),
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
  offset: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int().nonnegative(),
    ])
    .optional(),
  freelanceId: z.uuid().optional(),
});
