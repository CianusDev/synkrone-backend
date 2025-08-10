import z from "zod";
import { Availability } from "../freelance/freelance.model";
import { CompanySize } from "../company/company.model";

// Schéma pour la complétion du profil freelance
export const updateFreelanceProfileSchema = z.object({
  firstname: z.string().min(1, "Le prénom est requis").optional(),
  lastname: z.string().min(1, "Le nom de famille est requis").optional(),
  photo_url: z.url("L'URL de la photo n'est pas valide").optional(),
  job_title: z.string().min(1, "Le titre du poste est requis").optional(),
  experience_years: z
    .number()
    .min(0, "Les années d'expérience ne peuvent pas être négatives")
    .optional(),
  description: z.string().optional(),
  portfolio_url: z
    .string()
    .url("L'URL du portfolio n'est pas valide")
    .optional(),
  cover_url: z
    .string()
    .url("L'URL de la couverture n'est pas valide")
    .optional(),
  video_url: z.string().url("L'URL de la vidéo n'est pas valide").optional(),
  linkedin_url: z.string().url("L'URL LinkedIn n'est pas valide").optional(),
  tjm: z.number().positive("Le TJM doit être positif").optional(),
  availability: z
    .enum([Availability.AVAILABLE, Availability.BUSY, Availability.UNAVAILABLE])
    .optional(),
  location: z.string().optional(),
  country: z.string().min(1, "Le pays est requis").optional(),
  phone: z.string().min(1, "Le numéro de téléphone est requis").optional(),
});

// Schéma pour la complétion du profil entreprise
export const updateCompanyProfileSchema = z.object({
  company_name: z
    .string()
    .min(1, "Le nom de l'entreprise est requis")
    .optional(),
  logo_url: z.url("L'URL du logo n'est pas valide").optional(),
  company_description: z.string().optional(),
  industry: z.string().min(1, "Le secteur d'activité est requis").optional(),
  website_url: z.url("L'URL du site web n'est pas valide").optional(),
  address: z.string().min(1, "L'adresse est requise").optional(),
  company_size: z
    .enum([CompanySize.LARGE_COMPANY, CompanySize.SME, CompanySize.STARTUP])
    .optional(),
  certification_doc_url: z
    .url("L'URL du document de certification n'est pas valide")
    .optional(),
  country: z.string().min(1, "Le pays est requis").optional(),
  company_phone: z
    .string()
    .min(1, "Le numéro de téléphone de l'entreprise est requis")
    .optional(),
});

// Schéma pour l'ID du profil
export const profileIdSchema = z.object({
  id: z.string().uuid("L'ID n'est pas un UUID valide"),
});
