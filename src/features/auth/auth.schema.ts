import z from "zod";

export const loginSchema = z.object({
  email: z.email("L'email doit être valide"),
  password: z.string().min(1, "Le mot de passe est requis"),
  sessionId: z.string().optional(),
});

export const registerFreelanceSchema = z.object({
  firstname: z.string().min(1, "Le prénom est requis"),
  lastname: z.string().min(1, "Le nom de famille est requis"),
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
});

export const registerCompanySchema = z.object({
  company_email: z.email("L'email de l'entreprise doit être valide"),
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
      "Le mot de passe doit contenir au moins un caractère spécial (@, $, !,  %, *, ?, &)",
    )
    .refine(
      (val) => !val.includes(" "),
      "Le mot de passe ne doit pas contenir d'espaces",
    ),
});

export const verifyEmailSchema = z.object({
  code: z.string().min(1, "Le code de vérification est requis"),
  email: z.email("L'email doit être valide"),
});
