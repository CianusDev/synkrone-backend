import { z } from "zod";
import { WorkDayStatus } from "./work-days.model";

// Schéma pour la création d'un jour de travail
export const createWorkDaySchema = z.object({
  workDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Format de date invalide (YYYY-MM-DD attendu).",
    ),
  description: z
    .string()
    .min(10, "La description doit faire au moins 10 caractères.")
    .max(1000, "La description ne peut pas dépasser 1000 caractères."),
  tjmApplied: z.number().positive("Le TJM doit être positif."),
});

// Schéma pour la mise à jour d'un jour de travail
export const updateWorkDaySchema = z.object({
  workDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Format de date invalide (YYYY-MM-DD attendu).",
    )
    .optional(),
  description: z
    .string()
    .min(10, "La description doit faire au moins 10 caractères.")
    .max(1000, "La description ne peut pas dépasser 1000 caractères.")
    .optional(),
  tjmApplied: z.number().positive("Le TJM doit être positif.").optional(),
});

// Schéma pour la validation d'un jour de travail
export const validateWorkDaySchema = z.object({
  status: z.literal("validated"),
});

// Schéma pour le rejet d'un jour de travail
export const rejectWorkDaySchema = z.object({
  status: z.literal("rejected"),
  rejectionReason: z.string().min(1, "La raison du rejet est requise."),
});

// Schéma pour la soumission de jours de travail
export const submitWorkDaysSchema = z.object({
  workDayIds: z.array(z.uuid()).min(1, "Au moins un jour de travail doit être soumis."),
});

// Schéma pour la validation de l'ID (UUID)
export const workDayIdSchema = z.object({
  id: z.uuid({ message: "ID de jour de travail invalide (UUID attendu)." }),
});

// Schéma pour la validation du deliverableId (UUID)
export const deliverableIdSchema = z.object({
  deliverableId: z.uuid({ message: "deliverableId doit être un UUID." }),
});

// Schéma pour les filtres de recherche
export const workDayFiltersSchema = z.object({
  status: z.nativeEnum(WorkDayStatus).optional(),
  dateFrom: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Format de date invalide (YYYY-MM-DD attendu).",
    )
    .optional(),
  dateTo: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Format de date invalide (YYYY-MM-DD attendu).",
    )
    .optional(),
  freelanceId: z.uuid().optional(),
});
