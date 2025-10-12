import { z } from "zod";
import { UserType } from "./evaluation.model";

// Schéma pour la création d'une évaluation
export const createEvaluationSchema = z.object({
  contract_id: z.string().uuid("ID de contrat invalide (UUID attendu)"),
  evaluator_id: z.string().uuid("ID d'évaluateur invalide (UUID attendu)"),
  evaluated_id: z.string().uuid("ID d'évalué invalide (UUID attendu)"),
  evaluator_type: z.nativeEnum(UserType),
  evaluated_type: z.nativeEnum(UserType),
  rating: z
    .number()
    .int("La note doit être un nombre entier")
    .min(1, "La note minimum est 1")
    .max(5, "La note maximum est 5"),
  comment: z
    .string()
    .min(10, "Le commentaire doit contenir au moins 10 caractères")
    .max(500, "Le commentaire ne peut pas dépasser 500 caractères")
    .optional(),
});

// Schéma pour la mise à jour d'une évaluation
export const updateEvaluationSchema = z.object({
  rating: z
    .number()
    .int("La note doit être un nombre entier")
    .min(1, "La note minimum est 1")
    .max(5, "La note maximum est 5")
    .optional(),
  comment: z
    .string()
    .min(10, "Le commentaire doit contenir au moins 10 caractères")
    .max(500, "Le commentaire ne peut pas dépasser 500 caractères")
    .optional(),
});

// Schéma pour la validation d'un ID d'évaluation
export const evaluationIdSchema = z.object({
  id: z.string().uuid("ID d'évaluation invalide (UUID attendu)"),
});

// Schéma pour la validation d'un ID d'utilisateur
export const userIdSchema = z.object({
  userId: z.string().uuid("ID d'utilisateur invalide (UUID attendu)"),
});

// Schéma pour la validation d'un ID de contrat
export const contractIdSchema = z.object({
  contractId: z.string().uuid("ID de contrat invalide (UUID attendu)"),
});

// Schéma pour les filtres d'évaluations
export const evaluationFiltersSchema = z.object({
  evaluator_id: z.string().uuid().optional(),
  evaluated_id: z.string().uuid().optional(),
  evaluator_type: z.nativeEnum(UserType).optional(),
  evaluated_type: z.nativeEnum(UserType).optional(),
  rating: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int(),
    ])
    .refine((val) => val >= 1 && val <= 5, {
      message: "La note doit être entre 1 et 5",
    })
    .optional(),
  contract_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  page: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int().positive(),
    ])
    .optional()
    .refine((val) => val === undefined || (!isNaN(val) && val > 0), {
      message: "Page invalide",
    }),
  limit: z
    .union([
      z.string().transform((val) => parseInt(val, 10)),
      z.number().int().positive(),
    ])
    .optional()
    .refine((val) => val === undefined || (!isNaN(val) && val > 0 && val <= 100), {
      message: "Limite invalide (max 100)",
    }),
});

// Schéma pour les statistiques d'évaluations par type d'utilisateur
export const evaluationStatsParamsSchema = z.object({
  userId: z.string().uuid("ID d'utilisateur invalide (UUID attendu)"),
  userType: z.nativeEnum(UserType).optional(),
});
