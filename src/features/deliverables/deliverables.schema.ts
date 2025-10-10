import { z } from "zod";
import { DeliverableStatus } from "./deliverables.model";

// Statuts autorisés pour les freelances (pas de VALIDATED/REJECTED)
const FreelanceDeliverableStatus = z.enum([
  DeliverableStatus.PLANNED,
  DeliverableStatus.IN_PROGRESS,
  DeliverableStatus.SUBMITTED,
]);

// Statuts autorisés pour les companies (tous les statuts)
const CompanyDeliverableStatus = z.nativeEnum(DeliverableStatus);

// Schéma pour la création d'un livrable (par freelances)
export const createDeliverableSchema = z.object({
  contractId: z.uuid({ message: "contractId doit être un UUID." }),
  title: z.string().min(1, "Le titre est requis."),
  description: z.string().optional(),
  status: FreelanceDeliverableStatus.default(DeliverableStatus.PLANNED),
  isMilestone: z.boolean().optional(),
  amount: z.number().min(0, "Le montant doit être positif ou nul.").optional(),
  dueDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Format de date invalide (YYYY-MM-DD attendu).",
    )
    .optional(),
  feedback: z.string().optional(),
  order: z.number().int().nonnegative().optional(),
  mediaIds: z.array(z.uuid()).optional(),
});

// Schéma pour la mise à jour d'un livrable (par freelances)
export const updateDeliverableSchema = z.object({
  title: z.string().min(1, "Le titre est requis.").optional(),
  description: z.string().optional(),
  status: FreelanceDeliverableStatus.optional(),
  isMilestone: z.boolean().optional(),
  amount: z.number().min(0, "Le montant doit être positif ou nul.").optional(),
  dueDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Format de date invalide (YYYY-MM-DD attendu).",
    )
    .optional(),
  feedback: z.string().optional(),
  order: z.number().int().nonnegative().optional(),
  mediaIds: z.array(z.uuid()).optional(),
});

// Schéma pour la mise à jour d'un livrable (par companies) - tous les statuts autorisés
export const updateDeliverableCompanySchema = z.object({
  title: z.string().min(1, "Le titre est requis.").optional(),
  description: z.string().optional(),
  status: CompanyDeliverableStatus.optional(),
  isMilestone: z.boolean().optional(),
  amount: z.number().min(0, "Le montant doit être positif ou nul.").optional(),
  dueDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Format de date invalide (YYYY-MM-DD attendu).",
    )
    .optional(),
  feedback: z.string().optional(),
  order: z.number().int().nonnegative().optional(),
  mediaIds: z.array(z.uuid()).optional(),
});

// Schémas spécifiques pour les actions de validation/rejet (companies uniquement)
export const validateDeliverableSchema = z.object({
  status: z.literal(DeliverableStatus.VALIDATED),
  feedback: z.string().optional(),
});

export const rejectDeliverableSchema = z.object({
  status: z.literal(DeliverableStatus.REJECTED),
  feedback: z
    .string()
    .min(1, "Un feedback est requis pour rejeter un livrable."),
});

// Schéma pour la validation de l'ID (UUID)
export const deliverableIdSchema = z.object({
  id: z.uuid({ message: "ID de livrable invalide (UUID attendu)." }),
});

// Schéma pour la validation du contractId (UUID)
export const contractIdSchema = z.object({
  contractId: z.uuid({ message: "contractId doit être un UUID." }),
});
