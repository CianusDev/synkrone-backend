import { z } from "zod";

// Schéma pour ajouter une compétence à un projet
export const addSkillToProjectSchema = z.object({
  skillId: z.string().uuid({ message: "ID de compétence invalide (UUID attendu)." }),
});

// Schéma pour supprimer une compétence d'un projet
export const removeSkillFromProjectSchema = z.object({
  skillId: z.string().uuid({ message: "ID de compétence invalide (UUID attendu)." }),
});

// Schéma pour mettre à jour les compétences d'un projet
export const updateProjectSkillsSchema = z.object({
  skillIds: z.array(
    z.string().uuid({ message: "ID de compétence invalide (UUID attendu)." })
  ).min(0, "Le tableau des compétences ne peut pas être vide."),
});

// Schéma pour la validation des paramètres d'URL
export const projectIdParamSchema = z.object({
  projectId: z.string().uuid({ message: "ID de projet invalide (UUID attendu)." }),
});

export const skillIdParamSchema = z.object({
  skillId: z.string().uuid({ message: "ID de compétence invalide (UUID attendu)." }),
});

// Schéma pour la validation des paramètres combinés
export const projectSkillParamsSchema = z.object({
  projectId: z.string().uuid({ message: "ID de projet invalide (UUID attendu)." }),
  skillId: z.string().uuid({ message: "ID de compétence invalide (UUID attendu)." }),
});
