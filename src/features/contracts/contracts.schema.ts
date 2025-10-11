import { z } from "zod";
import { ContractStatus, PaymentMode } from "./contracts.model";

// Schéma pour la création d'un contrat
export const createContractSchema = z
  .object({
    application_id: z.uuid({
      message: "ID de candidature invalide (UUID attendu).",
    }),
    project_id: z.uuid({ message: "ID de projet invalide (UUID attendu)." }),
    freelance_id: z.uuid({
      message: "ID de freelance invalide (UUID attendu).",
    }),
    company_id: z.uuid({ message: "ID d'entreprise invalide (UUID attendu)." }),
    payment_mode: z.nativeEnum(PaymentMode),
    total_amount: z
      .number()
      .positive("Le montant total doit être positif.")
      .optional(),
    tjm: z.number().positive("Le TJM doit être positif.").optional(),
    estimated_days: z
      .number()
      .int()
      .positive("Le nombre de jours estimé doit être positif.")
      .optional(),
    terms: z.string().optional(),
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().optional().nullable(),
    status: z.nativeEnum(ContractStatus).optional(),
  })
  .refine(
    (data) => {
      if (
        data.payment_mode === PaymentMode.FIXED_PRICE ||
        data.payment_mode === PaymentMode.BY_MILESTONE
      ) {
        return data.total_amount !== undefined;
      }
      return true;
    },
    {
      message:
        "Le montant total est requis pour les modes fixed_price et by_milestone.",
      path: ["total_amount"],
    },
  )
  .refine(
    (data) => {
      if (data.payment_mode === PaymentMode.DAILY_RATE) {
        return data.tjm !== undefined && data.estimated_days !== undefined;
      }
      return true;
    },
    {
      message:
        "Le TJM et le nombre de jours estimé sont requis pour le mode daily_rate.",
      path: ["tjm"],
    },
  );

// Schéma pour la mise à jour du statut d'un contrat
export const updateContractStatusSchema = z.object({
  status: z.nativeEnum(ContractStatus),
});

// Schéma pour la validation d'un ID (UUID)
export const contractIdSchema = z.object({
  id: z.uuid({ message: "ID de contrat invalide (UUID attendu)." }),
});

// Schéma pour la validation d'un paramètre freelanceId dans l'URL
export const freelanceIdParamSchema = z.object({
  freelanceId: z.uuid({ message: "ID de freelance invalide (UUID attendu)." }),
});

// Schéma pour la validation d'un paramètre companyId dans l'URL
export const companyIdParamSchema = z.object({
  companyId: z.uuid({ message: "ID d'entreprise invalide (UUID attendu)." }),
});

// Schéma pour la validation d'un paramètre projectId dans l'URL
export const projectIdParamSchema = z.object({
  projectId: z.uuid({ message: "ID de projet invalide (UUID attendu)." }),
});

// Schéma pour la mise à jour d'un contrat
export const updateContractSchema = z
  .object({
    application_id: z
      .uuid({
        message: "ID de candidature invalide (UUID attendu).",
      })
      .optional(),
    project_id: z
      .uuid({ message: "ID de projet invalide (UUID attendu)." })
      .optional(),
    freelance_id: z
      .uuid({
        message: "ID de freelance invalide (UUID attendu).",
      })
      .optional(),
    company_id: z
      .uuid({ message: "ID d'entreprise invalide (UUID attendu)." })
      .optional(),
    payment_mode: z.enum(PaymentMode).optional(),
    total_amount: z
      .number()
      .positive("Le montant total doit être positif.")
      .optional(),
    tjm: z.number().positive("Le TJM doit être positif.").optional(),
    estimated_days: z
      .number()
      .int()
      .positive("Le nombre de jours estimé doit être positif.")
      .optional(),
    terms: z.string().optional().nullable(),
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().optional(),
    status: z.enum(ContractStatus).optional(),
  })
  .refine(
    (data) => {
      if (
        data.payment_mode === PaymentMode.FIXED_PRICE ||
        data.payment_mode === PaymentMode.BY_MILESTONE
      ) {
        return data.total_amount !== undefined ? data.total_amount > 0 : true;
      }
      return true;
    },
    {
      message:
        "Le montant total doit être positif pour les modes fixed_price et by_milestone.",
      path: ["total_amount"],
    },
  )
  .refine(
    (data) => {
      if (data.payment_mode === PaymentMode.DAILY_RATE) {
        const tjmValid = data.tjm !== undefined ? data.tjm > 0 : true;
        const daysValid =
          data.estimated_days !== undefined ? data.estimated_days > 0 : true;
        return tjmValid && daysValid;
      }
      return true;
    },
    {
      message:
        "Le TJM et le nombre de jours estimé doivent être positifs pour le mode daily_rate.",
      path: ["tjm"],
    },
  );

// Schéma pour le filtrage et la pagination des contrats
export const filterContractsSchema = z.object({
  status: z.enum(ContractStatus).optional(),
  freelanceId: z.uuid().optional(),
  companyId: z.uuid().optional(),
  projectId: z.uuid().optional(),
  paymentMode: z.enum(PaymentMode).optional(),
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

// Schéma pour la demande de modification de contrat par le freelance
export const requestContractModificationSchema = z.object({
  reason: z
    .string()
    .min(10, "La raison doit contenir au moins 10 caractères.")
    .max(500, "La raison ne peut pas dépasser 500 caractères."),
});
