import { z } from "zod";

// Schéma pour la création d'une catégorie de projet
export const createProjectCategorySchema = z.object({
  name: z
    .string({
      message: "Le nom de la catégorie est requis.",
    })
    .min(1, "Le nom de la catégorie est requis."),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

// Schéma pour la mise à jour d'une catégorie de projet
export const updateProjectCategorySchema = z.object({
  name: z.string().min(1, "Le nom de la catégorie est requis.").optional(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

// Schéma pour la validation de l'ID (par exemple dans les params)
export const projectCategoryIdSchema = z.object({
  id: z.uuid({ message: "ID de catégorie invalide (UUID attendu)." }),
});
