import { z } from "zod";

// Schéma pour la création d'une catégorie de compétence
export const createCategorySkillSchema = z.object({
  name: z
    .string({
      message: "Le nom de la catégorie est requis.",
    })
    .min(1, "Le nom de la catégorie est requis."),
  slug: z
    .string({
      message: "Le slug est requis.",
    })
    .min(1, "Le slug est requis."),
  description: z.string().optional().nullable(),
});

// Schéma pour la mise à jour d'une catégorie de compétence
export const updateCategorySkillSchema = z.object({
  name: z.string().min(1, "Le nom de la catégorie est requis.").optional(),
  slug: z.string().min(1, "Le slug est requis.").optional(),
  description: z.string().optional().nullable(),
});

// Schéma pour la validation de l'ID (UUID)
export const categorySkillIdSchema = z.object({
  id: z.string().uuid({ message: "ID de catégorie invalide (UUID attendu)." }),
});
