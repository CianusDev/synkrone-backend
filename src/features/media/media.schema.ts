import { z } from "zod";
import { MediaType } from "./media.model";

// Schéma pour la création d'un média
export const createMediaSchema = z.object({
  url: z.string().url().max(500),
  type: z.nativeEnum(MediaType),
  uploadedBy: z.string().uuid().optional(),
  description: z.string().max(1000).optional(),
});

// Schéma pour la mise à jour d'un média
export const updateMediaSchema = z.object({
  url: z.string().url().max(500).optional(),
  type: z.nativeEnum(MediaType).optional(),
  uploadedBy: z.string().uuid().optional(),
  description: z.string().max(1000).optional(),
});
