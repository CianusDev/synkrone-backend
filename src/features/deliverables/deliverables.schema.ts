import { z } from "zod";
import { DeliverableStatus } from "./deliverables.model";

// Schéma pour la création d'un livrable
export const createDeliverableSchema = z.object({
  contractId: z.uuid({ message: "contractId doit être un UUID." }),
  title: z.string().min(1, "Le titre est requis."),
  description: z.string().optional(),
  status: z.nativeEnum(DeliverableStatus).default(DeliverableStatus.PLANNED),
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

// Schéma pour la mise à jour d'un livrable
export const updateDeliverableSchema = z.object({
  title: z.string().min(1, "Le titre est requis.").optional(),
  description: z.string().optional(),
  status: z.nativeEnum(DeliverableStatus).optional(),
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

// Schéma pour la validation de l'ID (UUID)
export const deliverableIdSchema = z.object({
  id: z.uuid({ message: "ID de livrable invalide (UUID attendu)." }),
});

// Schéma pour la validation du contractId (UUID)
export const contractIdSchema = z.object({
  contractId: z.uuid({ message: "contractId doit être un UUID." }),
});
