import { z } from "zod";
import { InvitationStatus } from "./project-invitations.model";

// Schéma pour la création d'une invitation
export const createProjectInvitationSchema = z.object({
  project_id: z.string().uuid({ message: "ID de projet invalide (UUID attendu)." }),
  freelance_id: z.string().uuid({ message: "ID de freelance invalide (UUID attendu)." }),
  company_id: z.string().uuid({ message: "ID d'entreprise invalide (UUID attendu)." }),
  message: z.string().optional().nullable(),
  status: z.nativeEnum(InvitationStatus).optional(),
  expires_at: z.coerce.date().optional().nullable(),
});

// Schéma pour la mise à jour du statut d'une invitation
export const updateInvitationStatusSchema = z.object({
  status: z.nativeEnum(InvitationStatus),
  responded_at: z.coerce.date().optional().nullable(),
});

// Schéma pour la validation d'un ID (UUID)
export const invitationIdSchema = z.object({
  id: z.string().uuid({ message: "ID d'invitation invalide (UUID attendu)." }),
});

// Schéma pour la validation d'un paramètre freelanceId dans l'URL
export const freelanceIdParamSchema = z.object({
  freelanceId: z.string().uuid({ message: "ID de freelance invalide (UUID attendu)." }),
});

// Schéma pour la validation d'un paramètre companyId dans l'URL
export const companyIdParamSchema = z.object({
  companyId: z.string().uuid({ message: "ID d'entreprise invalide (UUID attendu)." }),
});

// Schéma pour la validation d'un paramètre projectId dans l'URL
export const projectIdParamSchema = z.object({
  projectId: z.string().uuid({ message: "ID de projet invalide (UUID attendu)." }),
});

// Schéma pour le filtrage et la pagination des invitations
export const filterInvitationsSchema = z.object({
  status: z.nativeEnum(InvitationStatus).optional(),
  freelanceId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
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
