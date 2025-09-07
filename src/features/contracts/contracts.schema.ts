import { z } from "zod";
import { ContractStatus, PaymentMode } from "./contracts.model";

// Schéma pour la création d'un contrat
export const createContractSchema = z.object({
  application_id: z.uuid({
    message: "ID de candidature invalide (UUID attendu).",
  }),
  project_id: z.uuid({ message: "ID de projet invalide (UUID attendu)." }),
  freelance_id: z.uuid({ message: "ID de freelance invalide (UUID attendu)." }),
  company_id: z.uuid({ message: "ID d'entreprise invalide (UUID attendu)." }),
  agreed_rate: z.number().min(0, "Le taux convenu doit être positif."),
  payment_mode: z.enum(PaymentMode),
  terms: z.string().optional().nullable(),
  start_date: z.coerce.date().optional().nullable(),
  end_date: z.coerce.date().optional().nullable(),
  status: z.enum(ContractStatus).optional(),
});

// Schéma pour la mise à jour du statut d'un contrat
export const updateContractStatusSchema = z.object({
  status: z.enum(ContractStatus),
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
