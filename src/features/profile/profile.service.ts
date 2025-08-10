import { CompanyRepository } from "../company/company.repository";
import { FreelanceRepository } from "../freelance/freelance.repository";
import { Freelance } from "../freelance/freelance.model";
import { Company } from "../company/company.model";
import z from "zod";
import {
  updateCompanyProfileSchema,
  updateFreelanceProfileSchema,
} from "./profile.schema";

// Définir des types d'erreur personnalisés
class ProfileError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

class NotFoundError extends ProfileError {
  constructor(message: string) {
    super(message, 404);
  }
}

class ValidationError extends ProfileError {
  constructor(message: string) {
    super(message, 400);
  }
}

// Interface pour la mise à jour du profil freelance
interface UpdateFreelanceProfileData extends Partial<Freelance> {}

// Interface pour la mise à jour du profil entreprise
interface UpdateCompanyProfileData extends Partial<Company> {}

export class ProfileService {
  private readonly freelanceRepository: FreelanceRepository;
  private readonly companyRepository: CompanyRepository;

  constructor() {
    this.freelanceRepository = new FreelanceRepository();
    this.companyRepository = new CompanyRepository();
  }

  /**
   * Compléter le profil d'un freelance
   * @param freelanceId ID du freelance
   * @param data Données à mettre à jour
   * @returns Le profil freelance mis à jour
   */
  async completeFreelanceProfile(
    freelanceId: string,
    data: z.infer<typeof updateFreelanceProfileSchema>,
  ): Promise<Freelance> {
    try {
      // Vérification de l'existence du freelance
      const freelance =
        await this.freelanceRepository.getFreelanceById(freelanceId);

      if (!freelance) {
        throw new NotFoundError("Profil freelance non trouvé");
      }

      // Vérification si l'email de freelance est verifié
      if (!freelance.is_verified) {
        throw new ProfileError(
          "Le profil freelance ne peut pas être mis à jour car l'email n'est pas vérifié",
        );
      }

      // Validation des données
      this.validateFreelanceProfileData(data);

      // Mise à jour du profil
      const updatedFreelance =
        await this.freelanceRepository.updateFreelanceProfile(
          freelanceId,
          data,
        );

      if (!updatedFreelance) {
        throw new ProfileError(
          "Erreur lors de la mise à jour du profil freelance",
        );
      }

      // Si c'est la première connexion, marquer comme false
      if (updatedFreelance.is_first_login) {
        await this.freelanceRepository.updateFreelanceFirstLogin(freelanceId);
      }

      return updatedFreelance;
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof ProfileError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error("Erreur lors de la complétion du profil freelance:", error);
      throw new ProfileError(
        "Erreur lors de la mise à jour du profil. Veuillez réessayer.",
      );
    }
  }

  /**
   * Compléter le profil d'une entreprise
   * @param companyId ID de l'entreprise
   * @param data Données à mettre à jour
   * @returns Le profil entreprise mis à jour
   */
  async completeCompanyProfile(
    companyId: string,
    data: z.infer<typeof updateCompanyProfileSchema>,
  ): Promise<Company> {
    try {
      // Vérification de l'existence de l'entreprise
      const company = await this.companyRepository.getCompanyById(companyId);

      if (!company) {
        throw new NotFoundError("Profil entreprise non trouvé");
      }

      // Vérification si l'email de l'entreprise est verifié
      if (!company.is_verified) {
        throw new ProfileError(
          "Le profil entreprise ne peut pas être mis à jour car l'email n'est pas vérifié",
        );
      }

      // Validation des données
      this.validateCompanyProfileData(data);

      // Mise à jour du profil
      const updatedCompany = await this.companyRepository.updateCompany(
        companyId,
        data,
      );

      if (!updatedCompany) {
        throw new ProfileError(
          "Erreur lors de la mise à jour du profil entreprise",
        );
      }

      console.log({
        updatedCompany,
      });

      // Si c'est la première connexion, marquer comme false
      if (updatedCompany.is_first_login) {
        await this.companyRepository.updateCompanyFirstLogin(companyId);
      }

      return updatedCompany;
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof ProfileError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error(
        "Erreur lors de la complétion du profil entreprise:",
        error,
      );
      throw new ProfileError(
        "Erreur lors de la mise à jour du profil. Veuillez réessayer.",
      );
    }
  }

  /**
   * Obtenir le profil d'un freelance
   * @param freelanceId ID du freelance
   * @returns Le profil freelance
   */
  async getFreelanceProfile(freelanceId: string): Promise<Freelance> {
    try {
      const freelance =
        await this.freelanceRepository.getFreelanceById(freelanceId);

      if (!freelance) {
        throw new NotFoundError("Profil freelance non trouvé");
      }

      return freelance;
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof ProfileError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error(
        "Erreur lors de la récupération du profil freelance:",
        error,
      );
      throw new ProfileError("Erreur lors de la récupération du profil.");
    }
  }

  /**
   * Obtenir le profil d'une entreprise
   * @param companyId ID de l'entreprise
   * @returns Le profil entreprise
   */
  async getCompanyProfile(companyId: string): Promise<Company> {
    try {
      const company = await this.companyRepository.getCompanyById(companyId);

      if (!company) {
        throw new NotFoundError("Profil entreprise non trouvé");
      }

      return company;
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof ProfileError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error(
        "Erreur lors de la récupération du profil entreprise:",
        error,
      );
      throw new ProfileError("Erreur lors de la récupération du profil.");
    }
  }

  /**
   * Vérifier si le profil d'un freelance est complet
   * @param freelanceId ID du freelance
   * @returns true si le profil est complet, false sinon
   */
  async isFreelanceProfileComplete(
    freelanceId: string,
  ): Promise<{ isComplete: boolean; missingFields: string[] }> {
    try {
      const freelance =
        await this.freelanceRepository.getFreelanceById(freelanceId);

      if (!freelance) {
        throw new NotFoundError("Profil freelance non trouvé");
      }

      const requiredFields = [
        "firstname",
        "lastname",
        "job_title",
        "experience_years",
        "description",
        "tjm",
        "country",
        "phone",
      ];

      const missingFields = requiredFields.filter(
        (field) => !freelance[field as keyof Freelance],
      );

      return {
        isComplete: missingFields.length === 0,
        missingFields,
      };
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof ProfileError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error(
        "Erreur lors de la vérification du profil freelance:",
        error,
      );
      throw new ProfileError("Erreur lors de la vérification du profil.");
    }
  }

  /**
   * Vérifier si le profil d'une entreprise est complet
   * @param companyId ID de l'entreprise
   * @returns true si le profil est complet, false sinon
   */
  async isCompanyProfileComplete(
    companyId: string,
  ): Promise<{ isComplete: boolean; missingFields: string[] }> {
    try {
      const company = await this.companyRepository.getCompanyById(companyId);

      if (!company) {
        throw new NotFoundError("Profil entreprise non trouvé");
      }

      const requiredFields = [
        "company_name",
        "company_description",
        "industry",
        "address",
        "company_size",
        "country",
        "company_phone",
      ];

      const missingFields = requiredFields.filter(
        (field) => !company[field as keyof Company],
      );

      return {
        isComplete: missingFields.length === 0,
        missingFields,
      };
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof ProfileError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error(
        "Erreur lors de la vérification du profil entreprise:",
        error,
      );
      throw new ProfileError("Erreur lors de la vérification du profil.");
    }
  }

  /**
   * Validation des données de profil freelance
   */
  private validateFreelanceProfileData(data: UpdateFreelanceProfileData): void {
    // Validation du TJM (Taux Journalier Moyen)
    if (data.tjm !== undefined && data.tjm <= 0) {
      throw new ValidationError("Le TJM doit être un nombre positif");
    }

    // Validation des années d'expérience
    if (data.experience_years !== undefined && data.experience_years < 0) {
      throw new ValidationError(
        "Les années d'expérience ne peuvent pas être négatives",
      );
    }

    // Validation des URLs
    const urlFields = [
      "photo_url",
      "portfolio_url",
      "cover_url",
      "video_url",
      "linkedin_url",
    ];
    for (const field of urlFields) {
      const url = data[field as keyof UpdateFreelanceProfileData] as
        | string
        | undefined;
      if (url && !this.isValidUrl(url)) {
        throw new ValidationError(`L'URL ${field} n'est pas valide`);
      }
    }

    // Validation du statut de disponibilité
    if (
      data.availability &&
      !["available", "busy", "unavailable"].includes(data.availability)
    ) {
      throw new ValidationError(
        "La disponibilité doit être 'available', 'busy' ou 'unavailable'",
      );
    }
  }

  /**
   * Validation des données de profil entreprise
   */
  private validateCompanyProfileData(data: UpdateCompanyProfileData): void {
    // Validation des URLs
    const urlFields = ["logo_url", "website_url", "certification_doc_url"];
    for (const field of urlFields) {
      const url = data[field as keyof UpdateCompanyProfileData] as
        | string
        | undefined;
      if (url && !this.isValidUrl(url)) {
        throw new ValidationError(`L'URL ${field} n'est pas valide`);
      }
    }

    // Validation de la taille de l'entreprise
    if (
      data.company_size &&
      !["startup", "sme", "large_company"].includes(data.company_size)
    ) {
      throw new ValidationError(
        "La taille de l'entreprise doit être 'startup', 'sme' ou 'large_company'",
      );
    }
  }

  /**
   * Validation simple d'URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }
}
