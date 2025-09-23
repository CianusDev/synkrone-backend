import { z } from "zod";
import { MediaType } from "./media.model";

// Schéma pour la création d'un média
export const createMediaSchema = z.object({
  url: z
    .url({
      message: "URL invalide",
    })
    .max(500),
  type: z.enum(MediaType),
  uploadedBy: z.uuid().optional(),
  description: z.string().max(1000).optional(),
  size: z.number().optional(),
});

// Schéma pour la mise à jour d'un média
export const updateMediaSchema = z.object({
  url: z
    .url({
      message: "URL invalide",
    })
    .max(500)
    .optional(),
  type: z.enum(MediaType).optional(),
  uploadedBy: z.uuid().optional(),
  description: z.string().max(1000).optional(),
  size: z.number().optional(),
});
