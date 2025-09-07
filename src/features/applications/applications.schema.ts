import { z } from "zod";
import { ApplicationStatus } from "./applications.model";

// Schéma pour la création d'une candidature
export const createApplicationSchema = z.object({
  project_id: z
    .string()
    .uuid({ message: "ID de projet invalide (UUID attendu)." }),
  freelance_id: z
    .string()
    .uuid({ message: "ID de freelance invalide (UUID attendu)." }),
  proposed_rate: z.number().min(0, "Le taux proposé doit être positif."),
  cover_letter: z.string().optional().nullable(),
  status: z.nativeEnum(ApplicationStatus).optional(),
});

// Schéma pour la mise à jour du statut d'une candidature
export const updateApplicationStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
  response_date: z.coerce.date().optional().nullable(),
});

// Schéma pour la validation d'un ID (UUID)
export const applicationIdSchema = z.object({
  id: z
    .string()
    .uuid({ message: "ID de candidature invalide (UUID attendu)." }),
});

// Schéma pour la validation d'un paramètre freelanceId dans l'URL
export const freelanceIdParamSchema = z.object({
  freelanceId: z
    .string()
    .uuid({ message: "ID de freelance invalide (UUID attendu)." }),
});

// Schéma pour la validation d'un paramètre projectId dans l'URL
export const projectIdParamSchema = z.object({
  projectId: z
    .string()
    .uuid({ message: "ID de projet invalide (UUID attendu)." }),
});

// Schéma pour le filtrage et la pagination des candidatures
export const filterApplicationsSchema = z.object({
  status: z.nativeEnum(ApplicationStatus).optional(),
  freelanceId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  page: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int().positive(),
    ])
    .optional()
    .refine((val) => val === undefined || (!isNaN(val) && val > 0), {
      message: "Page invalide.",
    }),
  limit: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int().positive(),
    ])
    .optional()
    .refine((val) => val === undefined || (!isNaN(val) && val > 0), {
      message: "Limite invalide.",
    }),
});
