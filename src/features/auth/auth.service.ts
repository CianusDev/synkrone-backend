import { Request } from "express";
import z from "zod";
import { envConfig } from "../../config/env.config";
import { emailTemplates, sendEmail } from "../../config/smtp-email";
import { HTTP_STATUS } from "../../utils/constant";
import {
  comparePassword,
  createResetOTPToken,
  createUserToken,
  generateCodeOTP,
  hashPassword,
  verifyResetOTPToken,
} from "../../utils/utils";
import { Company } from "../company/company.model";
import { CompanyRepository } from "../company/company.repository";
import { Freelance } from "../freelance/freelance.model";
import { FreelanceRepository } from "../freelance/freelance.repository";
import { NotificationTypeEnum } from "../notifications/notification.model";
import { NotificationRepository } from "../notifications/notification.repository";
import { UserNotificationService } from "../notifications/user-notifications/user-notification.service";
import { OtpType } from "../otp/otp.model";
import { OtpRepository } from "../otp/otp.repository";
import { UserSessionRepository } from "../user-session/user-session.repository";
import {
  loginSchema,
  registerCompanySchema,
  registerFreelanceSchema,
  verifyEmailSchema,
} from "./auth.schema";

// Définir des types d'erreur personnalisés
class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = HTTP_STATUS.BAD_REQUEST) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

class NotFoundError extends AuthError {
  constructor(message: string) {
    super(message, HTTP_STATUS.NOT_FOUND);
  }
}

class UnauthorizedError extends AuthError {
  constructor(message: string) {
    super(message, HTTP_STATUS.UNAUTHORIZED);
  }
}

class ValidationError extends AuthError {
  constructor(message: string) {
    super(message, HTTP_STATUS.BAD_REQUEST);
  }
}

// Interface pour unifier la gestion des emails
interface EmailOptions {
  to: string;
  name: string;
  type: "freelance" | "company";
}

export class AuthService {
  private readonly freelanceRepository: FreelanceRepository;
  private readonly companyRepository: CompanyRepository;
  private readonly otpRepository: OtpRepository;
  private readonly userSessionRepository: UserSessionRepository;
  private readonly userNotificationService: UserNotificationService;

  // OTP validity period in milliseconds (10 minutes)
  private readonly OTP_VALIDITY_PERIOD = 10 * 60 * 1000;

  // Session validity period in milliseconds (7 days)
  private readonly SESSION_VALIDITY_PERIOD = 7 * 24 * 60 * 60 * 1000;

  constructor() {
    this.freelanceRepository = new FreelanceRepository();
    this.companyRepository = new CompanyRepository();
    this.otpRepository = new OtpRepository();
    this.userSessionRepository = new UserSessionRepository();
    this.userNotificationService = new UserNotificationService();
  }

  /**
   * Méthode privée pour vérifier si un email existe déjà
   * @param email L'email à vérifier
   * @param type Type d'utilisateur (freelance ou company)
   * @returns true si l'email existe, false sinon
   */
  private async checkEmailExists(
    email: string,
    type: "freelance" | "company",
  ): Promise<boolean> {
    try {
      if (type === "freelance") {
        const freelance =
          await this.freelanceRepository.getFreelanceByEmail(email);
        return !!freelance;
      } else {
        const company = await this.companyRepository.getCompanyByEmail(email);
        return !!company;
      }
    } catch (error) {
      console.error(
        `Erreur lors de la vérification de l'email ${email}:`,
        error,
      );
      throw new AuthError("Erreur lors de la vérification de l'email");
    }
  }

  /**
   * Méthode privée pour créer et envoyer un OTP
   * @param options Options d'email (destinataire, nom, type)
   * @param otpType Type d'OTP (vérification d'email ou réinitialisation de mot de passe)
   */
  private async createAndSendOTP(
    options: EmailOptions,
    otpType: OtpType,
  ): Promise<string> {
    try {
      // Suppression d'un éventuel OTP existant
      await this.otpRepository.deleteOtpByEmail(options.to);

      // Génération d'un nouveau code OTP
      const code = generateCodeOTP();
      const codeToken = createResetOTPToken(options.to, code);

      // Enregistrement de l'OTP dans la base de données
      await this.otpRepository.createOtp({
        code,
        email: options.to,
        type: otpType,
        expiresAt: new Date(Date.now() + this.OTP_VALIDITY_PERIOD),
      });

      const frontendUrl = envConfig.frontendUrl || "http://localhost:3000";
      const resetLink = `${frontendUrl}/auth/reset-password?token=${codeToken}`;
      const template =
        otpType === OtpType.EMAIL_VERIFICATION
          ? emailTemplates.emailVerification(code, options.name)
          : emailTemplates.passwordReset(resetLink, options.name);

      // Envoi de l'email
      await sendEmail({
        to: options.to,
        ...template,
      });

      return code;
    } catch (error) {
      console.error(`Erreur lors de l'envoi de l'OTP à ${options.to}:`, error);
      throw new AuthError("Erreur lors de l'envoi de  OTP de vérification");
    }
  }

  /**
   * Méthode pour vérifier un OTP
   * @param email Email associé à l'OTP
   * @param code Code OTP à vérifier
   * @returns true si l'OTP est valide, sinon throw une erreur
   */
  private async verifyOTP(email: string, code: string): Promise<boolean> {
    const otp = await this.otpRepository.isValidOtp(email, code);

    if (!otp) {
      throw new ValidationError(
        "Code de vérification invalide ou expiré ! Veuillez réessayer.",
      );
    }

    // Suppression de l'OTP après vérification (bonne pratique de sécurité)
    await this.otpRepository.deleteOtpByEmail(email);

    return true;
  }

  /**
   * Méthode pour vérifier un OTP
   * @param email Email associé à l'OTP
   * @param codeId CodeId OTP à vérifier
   * @returns true si l'OTP est valide, sinon throw une erreur
   */
  // private async verifyOTPByCodeId(
  //   email: string,
  //   codeId: string,
  // ): Promise<boolean> {
  //   const otp = await this.otpRepository.isValidOtpByCodeID(codeId);

  //   if (!otp) {
  //     throw new ValidationError(
  //       "Code de vérification invalide ou expiré ! Veuillez réessayer.",
  //     );
  //   }

  //   // Suppression de l'OTP après vérification (bonne pratique de sécurité)
  //   await this.otpRepository.deleteOtpByEmail(email);

  //   return true;
  // }

  /**
   * Méthode pour gérer la création ou mise à jour de session utilisateur
   * @param userId ID de l'utilisateur
   * @param req Requête Express
   * @param existingSessionId ID de session existante (optionnel)
   * @returns ID de la session
   */
  private async handleUserSession(
    user_id: string,
    req: Request,
    existingSessionId?: string,
  ): Promise<string> {
    try {
      const existingSession = existingSessionId
        ? await this.userSessionRepository.getSessionById(existingSessionId)
        : null;

      if (!existingSession || !existingSession.is_active) {
        // Création d'une nouvelle session
        const session = await this.userSessionRepository.createSession({
          user_id,
          ip_address: req.ip || "unknown",
          user_agent: req.headers["user-agent"] || "unknown",
          expires_at: new Date(Date.now() + this.SESSION_VALIDITY_PERIOD),
          is_active: true,
        });

        return session.id;
      } else {
        // Mise à jour de la session existante
        await this.userSessionRepository.updateSession(existingSession.id, {
          ip_address: req.ip || "unknown",
          user_agent: req.headers["user-agent"] || "unknown",
          expires_at: new Date(Date.now() + this.SESSION_VALIDITY_PERIOD),
          is_active: true,
        });

        return existingSession.id;
      }
    } catch (error) {
      console.error("Erreur lors de la gestion de la session:", error);
      throw new AuthError("Erreur lors de la gestion de la session");
    }
  }

  //  AUTH FREELANCE
  async registerFreelance(
    data: z.infer<typeof registerFreelanceSchema>,
  ): Promise<Freelance> {
    try {
      // Vérification de l'existence du freelance par email
      const emailExists = await this.checkEmailExists(data.email, "freelance");

      if (emailExists) {
        throw new ValidationError(
          "Cet email est déjà utilisé par un autre compte.",
        );
      }

      // Hashage du mot de passe avec salt
      const password_hashed = await hashPassword(data.password);

      // Création du freelance
      const newFreelance = await this.freelanceRepository.createFreelance({
        ...data,
        password_hashed,
      });

      if (!newFreelance) {
        throw new AuthError("Erreur lors de la création du compte freelance");
      }

      // Création et envoi du code OTP
      await this.createAndSendOTP(
        {
          to: newFreelance.email,
          name: newFreelance.firstname,
          type: "freelance",
        },
        OtpType.EMAIL_VERIFICATION,
      );

      // Notification de bienvenue
      const notificationRepo = new NotificationRepository();
      const welcomeNotification = await notificationRepo.createNotification({
        title: "Bienvenue sur la plateforme !",
        message: `Bonjour ${newFreelance.firstname}, votre compte a bien été créé. Nous vous souhaitons la bienvenue !`,
        type: NotificationTypeEnum.system,
        is_global: false,
      });
      if (welcomeNotification) {
        await this.userNotificationService.createUserNotification(
          newFreelance.id,
          welcomeNotification.id,
          false,
        );
      }

      return newFreelance;
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof AuthError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error("Erreur lors de l'inscription freelance:", error);
      throw new AuthError("Erreur lors de l'inscription. Veuillez réessayer.");
    }
  }

  /**
   * Connexion d'un freelance
   * @param data Données de connexion (email, mot de passe)
   * @param req Requête Express
   * @returns Informations de session et freelance
   */
  async loginFreelance(data: z.infer<typeof loginSchema>, req: Request) {
    try {
      const { sessionId } = req.body;

      // Vérification de l'existence du freelance par email
      const freelance = await this.freelanceRepository.getFreelanceByEmail(
        data.email,
      );

      // Si le freelance n'existe pas, message d'erreur générique (sécurité)
      if (!freelance) {
        throw new UnauthorizedError("Email ou mot de passe incorrect");
      }

      // Vérification du mot de passe avec timing constant pour éviter les timing attacks
      const isPasswordValid = await comparePassword(
        data.password,
        freelance.password_hashed,
      );

      // Vérification de l'email
      const isEmailVerified = freelance.is_verified;

      // Si le mot de passe n'est pas valide ou l'email n'est pas vérifié
      if (!isPasswordValid) {
        throw new UnauthorizedError("Email ou mot de passe incorrect");
      }

      if (!isEmailVerified) {
        throw new UnauthorizedError(
          "Veuillez vérifier votre email avant de vous connecter",
        );
      }

      // Gestion de la session utilisateur
      const newSessionId = await this.handleUserSession(
        freelance.id,
        req,
        sessionId,
      );

      // Création du token JWT pour l'authentification
      const token = createUserToken(freelance, "freelance");

      // Retourne les informations de connexion
      return {
        token,
        freelance: {
          id: freelance.id,
          email: freelance.email,
          firstname: freelance.firstname,
          lastname: freelance.lastname,
          is_verified: freelance.is_verified,
          is_first_login: freelance.is_first_login,
          availability: freelance.availability,
          phone: freelance.phone,
          photo_url: freelance.photo_url,
          job_title: freelance.job_title,
          experience: freelance.experience,
          description: freelance.description,
          country: freelance.country,
          city: freelance.city,
          // Ne pas retourner le mot de passe hashé ou d'autres informations sensibles
        },
        sessionId: newSessionId,
      };
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof AuthError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error("Erreur lors de la connexion freelance:", error);
      throw new UnauthorizedError(
        "Erreur lors de la connexion. Veuillez réessayer.",
      );
    }
  }

  /**
   * Demande de réinitialisation de mot de passe pour un freelance
   * @param email Email du freelance
   */
  async forgotPasswordFreelance(email: string): Promise<void> {
    try {
      // Vérification de l'existence du freelance par email
      const freelance =
        await this.freelanceRepository.getFreelanceByEmail(email);

      // Si le freelance n'existe pas, on lance une erreur
      if (!freelance) {
        // Pour des raisons de sécurité, on ne devrait pas révéler si l'email existe ou non
        // Mais on simule quand même l'envoi d'un email pour ne pas donner d'indice
        console.log(
          `Tentative de réinitialisation pour un email inexistant: ${email}`,
        );
        return; // Retourne silencieusement sans erreur
      }

      // Création et envoi du code OTP
      await this.createAndSendOTP(
        { to: freelance.email, name: freelance.firstname, type: "freelance" },
        OtpType.PASSWORD_RESET,
      );
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof AuthError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error(
        "Erreur lors de la demande de réinitialisation de mot de passe:",
        error,
      );
      throw new AuthError(
        "Erreur lors de l'envoi de l'email de réinitialisation",
      );
    }
  }

  /**
   * Réinitialisation du mot de passe d'un freelance
   * @param email Email du freelance
   * @param code Code OTP de vérification
   * @param newPassword Nouveau mot de passe
   */
  async resetPasswordFreelance(
    token: string,
    newPassword: string,
  ): Promise<void> {
    try {
      // Récupération de l'OTP par son ID (token)
      const otpData = verifyResetOTPToken(token);
      const email = otpData.email || "";
      const code = otpData.code || "";
      if (!email || !code) {
        throw new ValidationError("Token invalide ou expiré.");
      }
      // Vérification de l'OTP
      await this.verifyOTP(email, code);

      // Vérification de l'existence du freelance
      const freelance =
        await this.freelanceRepository.getFreelanceByEmail(email);
      if (!freelance) {
        throw new NotFoundError("Compte utilisateur non trouvé.");
      }

      // Hashage du nouveau mot de passe avec salt
      const password_hashed = await hashPassword(newPassword);

      // Mise à jour du mot de passe du freelance
      const updatedFreelance =
        await this.freelanceRepository.updateFreelancePassword(
          email,
          password_hashed,
        );

      if (!updatedFreelance) {
        throw new AuthError("Erreur lors de la mise à jour du mot de passe");
      }

      // Invalidation de toutes les sessions actives pour des raisons de sécurité
      // (optionnel mais recommandé lors d'un changement de mot de passe)
      // await this.userSessionRepository.deactivateAllUserSessions(freelance.id);
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof AuthError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error(
        "Erreur lors de la réinitialisation du mot de passe:",
        error,
      );
      throw new AuthError("Erreur lors de la réinitialisation du mot de passe");
    }
  }

  /**
   * Renvoi du code de vérification d'email pour un freelance
   * @param email Email du freelance
   */
  async resendEmailVerificationOTPFreelance(email: string): Promise<void> {
    try {
      // Vérification de l'existence du freelance
      const freelance =
        await this.freelanceRepository.getFreelanceByEmail(email);
      if (!freelance) {
        throw new NotFoundError("Aucun compte trouvé avec cet email.");
      }

      // Si le compte est déjà vérifié, on lance une erreur
      if (freelance.is_verified) {
        throw new ValidationError("Ce compte est déjà vérifié.");
      }

      // Création et envoi du code OTP
      await this.createAndSendOTP(
        { to: freelance.email, name: freelance.firstname, type: "freelance" },
        OtpType.EMAIL_VERIFICATION,
      );
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof AuthError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error(
        "Erreur lors du renvoi du code de vérification d'email:",
        error,
      );
      throw new AuthError("Erreur lors de l'envoi de l'email de vérification");
    }
  }

  /**
   * Renvoi du code de réinitialisation de mot de passe pour un freelance
   * @param email Email du freelance
   */
  async resendResetPasswordOTPFreelance(email: string): Promise<void> {
    try {
      // Vérification de l'existence du freelance
      const freelance =
        await this.freelanceRepository.getFreelanceByEmail(email);
      if (!freelance) {
        // Pour des raisons de sécurité, on ne devrait pas révéler si l'email existe ou non
        console.log(
          `Tentative de renvoi d'OTP pour un email inexistant: ${email}`,
        );
        return; // Retourne silencieusement sans erreur
      }

      // Création et envoi du code OTP
      await this.createAndSendOTP(
        { to: freelance.email, name: freelance.firstname, type: "freelance" },
        OtpType.PASSWORD_RESET,
      );
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof AuthError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error(
        "Erreur lors du renvoi du code de réinitialisation:",
        error,
      );
      throw new AuthError(
        "Erreur lors de l'envoi de l'email de réinitialisation",
      );
    }
  }

  /**
   * Vérification de l'email d'un freelance
   * @param data Données de vérification (email, code)
   * @returns Le freelance mis à jour
   */
  async verifyEmailFreelance(
    data: z.infer<typeof verifyEmailSchema>,
  ): Promise<Freelance> {
    try {
      // Vérification de l'OTP
      await this.verifyOTP(data.email, data.code);

      // Mise à jour du freelance pour marquer l'email comme vérifié
      const freelance = await this.freelanceRepository.verifyEmail(data.email);

      if (!freelance) {
        throw new NotFoundError("Compte freelance non trouvé.");
      }

      return freelance;
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof AuthError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error(
        "Erreur lors de la vérification de l'email freelance:",
        error,
      );
      throw new AuthError("Erreur lors de la vérification de l'email");
    }
  }

  // AUTH COMPANY
  /**
   * Connexion d'une société
   * @param data Données de connexion (email, mot de passe)
   * @param req Requête Express
   * @returns Informations de session et société
   */
  async loginCompany(data: z.infer<typeof loginSchema>, req: Request) {
    try {
      const { sessionId } = req.body;

      // Vérification de l'existence de la société par email
      const company = await this.companyRepository.getCompanyByEmail(
        data.email,
      );

      // Si la société n'existe pas, message d'erreur générique (sécurité)
      if (!company) {
        console.log("Company not found with email:", data.email);
        throw new UnauthorizedError("Email ou mot de passe incorrect");
      }

      // Vérification du mot de passe avec timing constant pour éviter les timing attacks
      const isPasswordValid = await comparePassword(
        data.password,
        company.password_hashed,
      );

      // Vérification de l'email
      const isEmailVerified = company.is_verified;

      // Si le mot de passe n'est pas valide ou l'email n'est pas vérifié
      if (!isPasswordValid) {
        console.log("Company not found with email:", data.email);
        throw new UnauthorizedError("Email ou mot de passe incorrect");
      }

      if (!isEmailVerified) {
        throw new UnauthorizedError(
          "Veuillez vérifier votre email avant de vous connecter",
        );
      }

      // Gestion de la session utilisateur
      const newSessionId = await this.handleUserSession(
        company.id,
        req,
        sessionId,
      );

      // Création du token JWT pour l'authentification
      const token = createUserToken(company, "company");

      // Retourne les informations de connexion
      return {
        token,
        company: {
          id: company.id,
          company_email: company.company_email,
          company_name: company.company_name,
          logo_url: company.logo_url,
          is_verified: company.is_verified,
          is_first_login: company.is_first_login,
          company_phone: company.company_phone,
          website_url: company.website_url,
          country: company.country,
          city: company.city,
          address: company.address,
          company_description: company.company_description,
          industry: company.industry,
          company_size: company.company_size,
          // Ne pas retourner le mot de passe hashé ou d'autres informations sensibles
        },
        sessionId: newSessionId,
      };
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof AuthError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error("Erreur lors de la connexion société:", error);
      throw new UnauthorizedError(
        "Erreur lors de la connexion. Veuillez réessayer.",
      );
    }
  }

  /**
   * Inscription d'une société
   * @param data Données d'inscription
   * @returns La société créée
   */
  async registerCompany(data: z.infer<typeof registerCompanySchema>) {
    try {
      // Vérification de l'existence de la société par email
      const emailExists = await this.checkEmailExists(
        data.company_email,
        "company",
      );

      if (emailExists) {
        throw new ValidationError(
          "Cet email est déjà utilisé par un autre compte.",
        );
      }

      // Hashage du mot de passe avec salt
      const password_hashed = await hashPassword(data.password);

      // Création de la société
      const newCompany = await this.companyRepository.createCompany({
        ...data,
        password_hashed,
      });

      if (!newCompany) {
        throw new AuthError("Erreur lors de la création du compte société");
      }

      try {
        // Création et envoi du code OTP
        await this.createAndSendOTP(
          {
            to: newCompany.company_email,
            name: newCompany.company_name || "",
            type: "company",
          },
          OtpType.EMAIL_VERIFICATION,
        );
      } catch (error) {
        console.error(
          "Erreur lors de l'envoi de l'email de vérification pour la société:",
          error,
        );
        // On ne bloque pas l'inscription si l'email d'OTP échoue
      }

      // Notification de bienvenue
      const notificationRepo = new NotificationRepository();
      const welcomeNotification = await notificationRepo.createNotification({
        title: "Bienvenue sur la plateforme !",
        message: `Bonjour ${newCompany.company_name || "Entreprise"}, votre compte a bien été créé. Nous vous souhaitons la bienvenue !`,
        type: NotificationTypeEnum.system,
        is_global: false,
      });
      if (welcomeNotification) {
        await this.userNotificationService.createUserNotification(
          newCompany.id,
          welcomeNotification.id,
          false,
        );
      }

      return newCompany;
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof AuthError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error("Erreur lors de l'inscription société:", error);
      throw new AuthError("Erreur lors de l'inscription. Veuillez réessayer.");
    }
  }

  /**
   * Demande de réinitialisation de mot de passe pour une société
   * @param email Email de la société
   */
  async forgotPasswordCompany(email: string): Promise<void> {
    try {
      // Vérification de l'existence de la société par email
      const company = await this.companyRepository.getCompanyByEmail(email);

      // Si la société n'existe pas, on lance une erreur
      if (!company) {
        // Pour des raisons de sécurité, on ne devrait pas révéler si l'email existe ou non
        // Mais on simule quand même l'envoi d'un email pour ne pas donner d'indice
        console.log(
          `Tentative de réinitialisation pour un email inexistant: ${email}`,
        );
        return; // Retourne silencieusement sans erreur
      }

      // Création et envoi du code OTP
      await this.createAndSendOTP(
        {
          to: company.company_email,
          name: company.company_name || "Entreprise",
          type: "company",
        },
        OtpType.PASSWORD_RESET,
      );
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof AuthError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error(
        "Erreur lors de la demande de réinitialisation de mot de passe société:",
        error,
      );
      throw new AuthError(
        "Erreur lors de l'envoi de l'email de réinitialisation",
      );
    }
  }

  /**
   * Réinitialisation du mot de passe d'une société
   * @param email Email de la société
   * @param code Code OTP de vérification
   * @param newPassword Nouveau mot de passe
   */
  async resetPasswordCompany(
    token: string,
    newPassword: string,
  ): Promise<void> {
    try {
      // Récupération de l'OTP par son ID (token)
      const otpData = verifyResetOTPToken(token);
      const email = otpData.email || "";
      const code = otpData.code || "";
      if (!email || !code) {
        throw new ValidationError("Token invalide ou expiré.");
      }
      // Vérification de l'OTP
      await this.verifyOTP(email, code);

      // Vérification de l'existence de la société
      const company = await this.companyRepository.getCompanyByEmail(email);
      if (!company) {
        throw new NotFoundError("Compte société non trouvé.");
      }

      // Hashage du nouveau mot de passe avec salt
      const password_hashed = await hashPassword(newPassword);

      // Mise à jour du mot de passe de la société
      const updatedCompany = await this.companyRepository.updateCompanyPassword(
        company.id,
        password_hashed,
      );

      if (!updatedCompany) {
        throw new AuthError("Erreur lors de la mise à jour du mot de passe");
      }

      // Invalidation de toutes les sessions actives pour des raisons de sécurité
      // (optionnel mais recommandé lors d'un changement de mot de passe)
      // await this.userSessionRepository.deactivateAllUserSessions(company.id);
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof AuthError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error(
        "Erreur lors de la réinitialisation du mot de passe société:",
        error,
      );
      throw new AuthError("Erreur lors de la réinitialisation du mot de passe");
    }
  }

  /**
   * Vérification de l'email d'une société avec un code OTP
   * @param data Données de vérification (email, code)
   * @returns La société mise à jour
   */
  async verifyEmailCompany(
    data: z.infer<typeof verifyEmailSchema>,
  ): Promise<Company> {
    try {
      // Vérification de l'OTP
      await this.verifyOTP(data.email, data.code);

      // Mise à jour de la société pour marquer l'email comme vérifié
      const company = await this.companyRepository.verifyEmail(data.email);

      if (!company) {
        throw new NotFoundError("Compte société non trouvé.");
      }

      return company;
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof AuthError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error(
        "Erreur lors de la vérification de l'email société:",
        error,
      );
      throw new AuthError("Erreur lors de la vérification de l'email");
    }
  }

  /**
   * Renvoi du code de vérification d'email pour une société
   * @param email Email de la société
   */
  async resendEmailVerificationOTPCompany(email: string): Promise<void> {
    try {
      // Vérification de l'existence de la société
      const company = await this.companyRepository.getCompanyByEmail(email);
      if (!company) {
        throw new NotFoundError("Aucun compte trouvé avec cet email.");
      }

      // Si le compte est déjà vérifié, on lance une erreur
      if (company.is_verified) {
        throw new ValidationError("Ce compte est déjà vérifié.");
      }

      // Création et envoi du code OTP
      await this.createAndSendOTP(
        {
          to: company.company_email,
          name: company.company_name || "",
          type: "company",
        },
        OtpType.EMAIL_VERIFICATION,
      );
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof AuthError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error(
        "Erreur lors du renvoi du code de vérification d'email société:",
        error,
      );
      throw new AuthError("Erreur lors de l'envoi de l'email de vérification");
    }
  }

  /**
   * Renvoi du code de réinitialisation de mot de passe pour une société
   * @param email Email de la société
   */
  async resendResetPasswordOTPCompany(email: string): Promise<void> {
    try {
      // Vérification de l'existence de la société
      const company = await this.companyRepository.getCompanyByEmail(email);
      if (!company) {
        // Pour des raisons de sécurité, on ne devrait pas révéler si l'email existe ou non
        console.log(
          `Tentative de renvoi d'OTP pour un email inexistant: ${email}`,
        );
        return; // Retourne silencieusement sans erreur
      }

      // Création et envoi du code OTP
      await this.createAndSendOTP(
        {
          to: company.company_email,
          name: company.company_name || "Entreprise",
          type: "company",
        },
        OtpType.PASSWORD_RESET,
      );
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof AuthError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error(
        "Erreur lors du renvoi du code de réinitialisation société:",
        error,
      );
      throw new AuthError(
        "Erreur lors de l'envoi de l'email de réinitialisation",
      );
    }
  }

  // COMMON
  /**
   * Déconnexion d'un utilisateur
   * @param sessionId ID de la session à déconnecter
   */
  async logout(sessionId: string): Promise<void> {
    try {
      // Vérification de l'existence de la session
      const session =
        await this.userSessionRepository.getSessionById(sessionId);
      console.log({
        session,
      });
      // Si la session n'existe pas, on lance une erreur
      if (!session) {
        throw new NotFoundError("Session non trouvée");
      }

      // Désactivation de la session
      await this.userSessionRepository.updateSession(sessionId, {
        is_active: false,
        expires_at: new Date(Date.now() - 1000), // Expire immédiatement
      });
    } catch (error) {
      // Propagation des erreurs personnalisées
      if (error instanceof AuthError) {
        throw error;
      }
      // Conversion des erreurs standards en erreurs personnalisées
      console.error("Erreur lors de la déconnexion:", error);
      throw new AuthError("Erreur lors de la déconnexion");
    }
  }
}
