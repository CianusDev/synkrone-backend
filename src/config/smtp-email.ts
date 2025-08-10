import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { envConfig } from "./env.config";

// Charger les variables d'environnement
dotenv.config();

/**
 * Configuration SMTP pour Gmail
 * Documentation: https://support.google.com/mail/answer/7126229
 */
export const smtpConfig = {
  host: "smtp.gmail.com",
  port: 587, // Port TLS/STARTTLS recommandé
  secure: false, // true pour 465 (SSL), false pour 587 (TLS)
  auth: {
    user: envConfig.gmailUser, // Votre adresse Gmail
    pass: envConfig.gmailAppPassword, // Mot de passe d'application Gmail
  },
  tls: {
    rejectUnauthorized: false, // Peut être utile en développement
  },
};

/**
 * Créer un transporteur Nodemailer pour Gmail
 */
export const createGmailTransporter = () => {
  return nodemailer.createTransport(smtpConfig);
};

/**
 * Options par défaut pour les emails
 */
export const defaultEmailOptions = {
  from: `"${envConfig.appName || "Synkrone"}" <${envConfig.gmailUser}}>`,
};

/**
 * Fonction utilitaire pour envoyer un email
 */
export const sendEmail = async (options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: any[];
}) => {
  const transporter = createGmailTransporter();

  const mailOptions = {
    ...defaultEmailOptions,
    ...options,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Email envoyé avec succès:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email:", error);
    throw error;
  }
};

/**
 * Vérifier la connexion SMTP
 */
export const verifySmtpConnection = async (): Promise<boolean> => {
  try {
    const transporter = createGmailTransporter();
    await transporter.verify();
    console.log("✅ Connexion SMTP Gmail vérifiée avec succès");
    return true;
  } catch (error) {
    console.error("❌ Erreur de connexion SMTP Gmail:", error);
    return false;
  }
};

/**
 * Templates d'emails pré-définis
 */
export const emailTemplates = {
  // Template de vérification d'email
  emailVerification: (code: string, firstName?: string) => ({
    subject: "Vérification de votre adresse email - Synkrone",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Vérification de votre email</h2>
        ${firstName ? `<p>Bonjour ${firstName},</p>` : "<p>Bonjour,</p>"}
        <p>Merci de vous être inscrit sur Synkrone. Pour finaliser votre inscription, veuillez utiliser le code de vérification suivant :</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 8px;">${code}</h1>
        </div>
        <p>Ce code est valide pendant 10 minutes.</p>
        <p>Si vous n'avez pas demandé cette vérification, ignorez cet email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px;">L'équipe Synkrone</p>
      </div>
    `,
    text: `
      Vérification de votre email - Synkrone

      ${firstName ? `Bonjour ${firstName},` : "Bonjour,"}

      Merci de vous être inscrit sur Synkrone. Pour finaliser votre inscription, veuillez utiliser le code de vérification suivant :

      Code: ${code}

      Ce code est valide pendant 10 minutes.

      Si vous n'avez pas demandé cette vérification, ignorez cet email.

      L'équipe Synkrone
    `,
  }),

  // Template de réinitialisation de mot de passe
  passwordReset: (code: string, firstName?: string) => ({
    subject: "Réinitialisation de votre mot de passe - Synkrone",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Réinitialisation de mot de passe</h2>
        ${firstName ? `<p>Bonjour ${firstName},</p>` : "<p>Bonjour,</p>"}
        <p>Vous avez demandé la réinitialisation de votre mot de passe. Utilisez le code suivant :</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #dc3545; font-size: 32px; margin: 0; letter-spacing: 8px;">${code}</h1>
        </div>
        <p>Ce code est valide pendant 10 minutes.</p>
        <p><strong>Si vous n'avez pas demandé cette réinitialisation, contactez-nous immédiatement.</strong></p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px;">L'équipe Synkrone</p>
      </div>
    `,
    text: `
      Réinitialisation de mot de passe - Synkrone

      ${firstName ? `Bonjour ${firstName},` : "Bonjour,"}

      Vous avez demandé la réinitialisation de votre mot de passe. Utilisez le code suivant :

      Code: ${code}

      Ce code est valide pendant 10 minutes.

      Si vous n'avez pas demandé cette réinitialisation, contactez-nous immédiatement.

      L'équipe Synkrone
    `,
  }),

  // Template de bienvenue
  welcome: (firstName: string, userType: "freelance" | "company") => ({
    subject: "Bienvenue sur Synkrone !",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Bienvenue sur Synkrone ! 🎉</h2>
        <p>Bonjour ${firstName},</p>
        <p>Félicitations ! Votre compte ${userType === "freelance" ? "freelance" : "entreprise"} a été créé avec succès.</p>
        <p>Vous pouvez maintenant :</p>
        <ul>
          ${
            userType === "freelance"
              ? `
              <li>Compléter votre profil professionnel</li>
              <li>Ajouter vos compétences et expériences</li>
              <li>Rechercher des missions</li>
              <li>Postuler aux offres qui vous intéressent</li>
            `
              : `
              <li>Compléter le profil de votre entreprise</li>
              <li>Publier vos premières missions</li>
              <li>Rechercher des freelances qualifiés</li>
              <li>Gérer vos projets</li>
            `
          }
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${envConfig.frontendUrl}/dashboard"
             style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Accéder à mon tableau de bord
          </a>
        </div>
        <p>À bientôt sur Synkrone !</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px;">L'équipe Synkrone</p>
      </div>
    `,
    text: `
      Bienvenue sur Synkrone !

      Bonjour ${firstName},

      Félicitations ! Votre compte ${userType === "freelance" ? "freelance" : "entreprise"} a été créé avec succès.

      Vous pouvez maintenant accéder à votre tableau de bord : ${envConfig.frontendUrl}/dashboard

      À bientôt sur Synkrone !

      L'équipe Synkrone
    `,
  }),
};

export default {
  smtpConfig,
  createGmailTransporter,
  sendEmail,
  verifySmtpConnection,
  emailTemplates,
};
