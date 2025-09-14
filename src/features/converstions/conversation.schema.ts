import { z } from "zod";

// Schéma pour la création ou récupération d'une conversation
export const createConversationSchema = z.object({
  freelanceId: z.uuid({
    message: "freelanceId doit être un UUID valide",
  }),
  companyId: z.uuid({
    message: "companyId doit être un UUID valide",
  }),
  applicationId: z.uuid().optional(),
  contractId: z.uuid().optional(),
});

// Schéma pour la recherche d'une conversation (paramètres de requête)
export const findConversationSchema = z.object({
  freelanceId: z.uuid({
    message: "freelanceId doit être un UUID valide",
  }),
  companyId: z.uuid({
    message: "companyId doit être un UUID valide",
  }),
});

// Schéma pour la pagination (query params)
export const paginationSchema = z.object({
  limit: z.string().regex(/^\d+$/).optional(),
  offset: z.string().regex(/^\d+$/).optional(),
});
