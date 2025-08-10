import z from "zod";

export const loginAdminSchema = z.object({
  username: z.string().min(1, "Le nom d'utilisateur est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
  sessionId: z.string().optional(),
});

export const changePasswordAdminSchema = z
  .object({
    currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
    newPassword: z
      .string()
      .min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères")
      .regex(
        /[a-z]/,
        "Le mot de passe doit contenir au moins une lettre minuscule",
      )
      .regex(
        /[A-Z]/,
        "Le mot de passe doit contenir au moins une lettre majuscule",
      )
      .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
      .regex(
        /[@$!%*?&]/,
        "Le mot de passe doit contenir au moins un caractère spécial (@, $, !, %, *, ?, &)",
      )
      .refine(
        (val) => !val.includes(" "),
        "Le mot de passe ne doit pas contenir d'espaces",
      ),
    confirmPassword: z
      .string()
      .min(1, "La confirmation du mot de passe est requise"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const createAdminSchema = z.object({
  username: z
    .string()
    .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
    .max(100, "Le nom d'utilisateur ne peut pas dépasser 100 caractères")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, points, tirets et underscores",
    ),
  email: z.email("L'email doit être valide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(
      /[a-z]/,
      "Le mot de passe doit contenir au moins une lettre minuscule",
    )
    .regex(
      /[A-Z]/,
      "Le mot de passe doit contenir au moins une lettre majuscule",
    )
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
    .regex(
      /[@$!%*?&]/,
      "Le mot de passe doit contenir au moins un caractère spécial (@, $, !, %, *, ?, &)",
    )
    .refine(
      (val) => !val.includes(" "),
      "Le mot de passe ne doit pas contenir d'espaces",
    ),
  level: z.enum(["super_admin", "moderateur", "support"]),
});
