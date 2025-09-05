import { z } from "zod";
import { Availability, ExprerienceLevel } from "./freelance.model";

// Schéma pour la création d'un freelance
export const createFreelanceSchema = z.object({
  firstname: z
    .string({
      message: "Le prénom est requis",
    })
    .min(1, "Le prénom est requis."),
  lastname: z
    .string({
      message: "Le nom de famille est requis",
    })
    .min(1, "Le nom est requis."),
  email: z.email("L'email n'est pas valide."),
  password: z
    .string({
      message: "Le mot de passe est requis",
    })
    .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  country: z.string().min(1, "Le pays est requis."),
});

// Schéma pour la mise à jour du profil freelance
export const updateFreelanceProfileSchema = z.object({
  firstname: z.string().min(1, "Le prénom est requis.").optional(),
  lastname: z.string().min(1, "Le nom est requis.").optional(),
  experience: z.enum(ExprerienceLevel).optional(),
  description: z.string().optional().nullable(),
  photo_url: z.url("URL de photo invalide.").optional().nullable(),
  job_title: z.string().optional().nullable(),
  cover_url: z.url("URL de couverture invalide.").optional().nullable(),
  linkedin_url: z.url("URL LinkedIn invalide.").optional().nullable(),
  tjm: z.number().min(0, "Le TJM doit être positif.").optional(),
  availability: z.enum(Availability).optional(),
  location: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
});

// Schéma pour la validation de l'ID (UUID)
export const freelanceIdSchema = z.object({
  id: z.uuid({ message: "ID de freelance invalide (UUID attendu)." }),
});

// Schéma pour la recherche, pagination et filtres sur la liste des freelances
// Utilisé pour GET (query params) et POST (body) /freelances/filter
export const getFreelancesWithFiltersSchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, { message: "Page invalide." })
    .optional()
    .or(z.number().int().positive().optional()),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, { message: "Limite invalide." })
    .optional()
    .or(z.number().int().positive().optional()),
  search: z.string().optional(),
  skills: z
    .union([
      z.array(z.string().uuid()),
      z
        .string()
        .uuid()
        .transform((v) => [v]),
    ])
    .optional(),
  experience: z
    .union([
      z.array(z.enum(["beginner", "intermediate", "expert"])),
      z.enum(["beginner", "intermediate", "expert"]).transform((v) => [v]),
    ])
    .optional(),
  tjmMin: z
    .union([z.string().transform((val) => parseFloat(val)), z.number()])
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), {
      message: "TJM minimum invalide.",
    })
    .optional(),
  tjmMax: z
    .union([z.string().transform((val) => parseFloat(val)), z.number()])
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), {
      message: "TJM maximum invalide.",
    })
    .optional(),
});

// Schéma pour la vérification d'email
export const verifyEmailSchema = z.object({
  email: z.email("L'email n'est pas valide."),
});

// Schéma pour la mise à jour du mot de passe
export const updatePasswordSchema = z.object({
  email: z.email("L'email n'est pas valide."),
  password: z
    .string({
      message: "Le mot de passe est requis",
    })
    .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});
