import { z } from 'zod';

// Schéma pour l'ajout d'un média à un livrable
export const addMediaToDeliverableSchema = z.object({
  deliverableId: z.string().uuid({ message: 'deliverableId doit être un UUID valide.' }),
  mediaId: z.string().uuid({ message: 'mediaId doit être un UUID valide.' }),
});

// Schéma pour la suppression (soft delete) d'une liaison livrable-média
export const removeMediaFromDeliverableSchema = z.object({
  deliverableId: z.string().uuid({ message: 'deliverableId doit être un UUID valide.' }),
  mediaId: z.string().uuid({ message: 'mediaId doit être un UUID valide.' }),
});

// Schéma pour les paramètres de récupération d'une liaison précise
export const getDeliverableMediaParamsSchema = z.object({
  deliverableId: z.string().uuid({ message: 'deliverableId doit être un UUID valide.' }),
  mediaId: z.string().uuid({ message: 'mediaId doit être un UUID valide.' }),
});

// Schéma pour les paramètres de récupération de tous les médias d'un livrable
export const getMediaForDeliverableParamsSchema = z.object({
  deliverableId: z.string().uuid({ message: 'deliverableId doit être un UUID valide.' }),
});
