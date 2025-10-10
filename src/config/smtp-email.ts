import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { envConfig } from "./env.config";

// Charger les variables d'environnement
dotenv.config();

console.log("🚀 Configuration SMTP pour Gmail chargée:", {
  user: envConfig.gmailUser, // Votre adresse Gmail
  pass: envConfig.gmailAppPassword, // Mot de passe d'application Gmail
});

/**
 * Configuration SMTP pour Gmail
 */
export const smtpConfig = {
  host: "smtp.gmail.com",
  port: 587, // TLS est plus compatible avec Render que SSL (465)
  secure: false, // false pour port 587
  auth: {
    user: envConfig.gmailUser,
    pass: envConfig.gmailAppPassword,
  },
  tls: {
    rejectUnauthorized: false, // Important pour Render
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

  // Template de réinitialisation de mot de passe avec lien
  passwordReset: (resetLink: string, firstName?: string) => ({
    subject: "Réinitialisation de votre mot de passe - Synkrone",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Réinitialisation de mot de passe</h2>
        ${firstName ? `<p>Bonjour ${firstName},</p>` : "<p>Bonjour,</p>"}
        <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p>Ce lien est valide pendant 10 minutes.</p>
        <p><strong>Si vous n'avez pas demandé cette réinitialisation, contactez-nous immédiatement.</strong></p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px;">L'équipe Synkrone</p>
      </div>
    `,
    text: `
      Réinitialisation de mot de passe - Synkrone

      ${firstName ? `Bonjour ${firstName},` : "Bonjour,"}

      Vous avez demandé la réinitialisation de votre mot de passe. Veuillez utiliser le lien suivant pour définir un nouveau mot de passe :

      Lien de réinitialisation : ${resetLink}

      Ce lien est valide pendant 10 minutes.

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

  // Template pour notifier qu'un freelance a postulé à un projet
  freelanceApplied: (
    projectTitle: string,
    freelanceName: string,
    companyName?: string,
    applicationDate?: string,
    path?: string,
  ) => ({
    subject: `Nouveau candidat pour votre projet "${projectTitle}" - Synkrone`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Un freelance a postulé à votre projet</h2>
        <p>
          ${companyName ? `Bonjour ${companyName},` : "Bonjour,"}
        </p>
        <p>
          Le freelance <strong>${freelanceName}</strong> vient de postuler à votre projet <strong>"${projectTitle}"</strong>.
        </p>
        ${
          applicationDate
            ? `<p>Date de candidature : <strong>${applicationDate}</strong></p>`
            : ""
        }
        <p>
          Connectez-vous à votre tableau de bord Synkrone pour consulter son profil et gérer les candidatures.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${envConfig.frontendUrl}/${path}"
             style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Voir les candidatures
          </a>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px;">L'équipe Synkrone</p>
      </div>
    `,
    text: `
      Un freelance a postulé à votre projet - Synkrone

      ${companyName ? `Bonjour ${companyName},` : "Bonjour,"}

      Le freelance ${freelanceName} vient de postuler à votre projet "${projectTitle}".

      ${applicationDate ? `Date de candidature : ${applicationDate}` : ""}

      Connectez-vous à votre tableau de bord Synkrone pour consulter son profil et gérer les candidatures :
      ${envConfig.frontendUrl}/dashboard/projects

      L'équipe Synkrone
    `,
  }),

  // Template pour notifier a un freelance que sa candidature a été acceptée
  applicationAccepted: (
    projectTitle: string,
    freelanceName: string,
    companyName?: string,
    startDate?: string,
    path?: string,
  ) => ({
    subject: `Votre candidature pour "${projectTitle}" a été acceptée ! - Synkrone`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Félicitations ! Votre candidature a été acceptée</h2>
        <p>
          ${freelanceName ? `Bonjour ${freelanceName},` : "Bonjour,"}
        </p>
        <p>
          Nous avons le plaisir de vous informer que votre candidature pour le projet <strong>"${projectTitle}"</strong> a été acceptée.
        </p>
        ${
          companyName
            ? `<p>Vous allez collaborer avec <strong>${companyName}</strong>.</p>`
            : ""
        }
        ${
          startDate
            ? `<p>Date de début prévue : <strong>${startDate}</strong></p>`
            : ""
        }
        <p>
          Connectez-vous à votre tableau de bord Synkrone pour consulter les détails du projet et les prochaines étapes.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${envConfig.frontendUrl}/${path}"
             style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Voir les détails du projet
          </a>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px;">L'équipe Synkrone</p>
      </div>
    `,
    text: `
      Votre candidature a été acceptée - Synkrone

      ${freelanceName ? `Bonjour ${freelanceName},` : "Bonjour,"}

      Nous avons le plaisir de vous informer que votre candidature pour le projet "${projectTitle}" a été acceptée.

      ${companyName ? `Vous allez collaborer avec ${companyName}.` : ""}
      ${startDate ? `Date de début prévue : ${startDate}` : ""}

      Connectez-vous à votre tableau de bord Synkrone pour consulter les détails du projet et les prochaines étapes :
      ${envConfig.frontendUrl}/dashboard/applications

      L'équipe Synkrone
    `,
  }),

  // Template pour notifier a un freelance que sa candidature a été refusée
  applicationRejected: (
    projectTitle: string,
    freelanceName: string,
    companyName?: string,
    path?: string,
  ) => ({
    subject: `Votre candidature pour "${projectTitle}" n'a pas été retenue - Synkrone`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Mise à jour de votre candidature</h2>
        <p>
          ${freelanceName ? `Bonjour ${freelanceName},` : "Bonjour,"}
        </p>
        <p>
          Nous vous remercions d'avoir postulé au projet <strong>"${projectTitle}"</strong>.
        </p>
        <p>
          Après examen attentif, nous regrettons de vous informer que votre candidature n'a pas été retenue.
        </p>
        ${
          companyName
            ? `<p>Nous vous encourageons à postuler à d'autres projets publiés par <strong>${companyName}</strong> ou d'autres entreprises sur Synkrone.</p>`
            : ""
        }
        <p>
          N'hésitez pas à consulter régulièrement notre plateforme pour découvrir de nouvelles opportunités.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${envConfig.frontendUrl}/${path}"
             style="background: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Explorer d'autres projets
          </a>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px;">L'équipe Synkrone</p>
      </div>
    `,
    text: `
      Mise à jour de votre candidature - Synkrone

      ${freelanceName ? `Bonjour ${freelanceName},` : "Bonjour,"}

      Nous vous remercions d'avoir postulé au projet "${projectTitle}".

      Après examen attentif, nous regrettons de vous informer que votre candidature n'a pas été retenue.

      ${companyName ? `Nous vous encourageons à postuler à d'autres projets publiés par ${companyName} ou d'autres entreprises sur Synkrone.` : ""}

      N'hésitez pas à consulter régulièrement notre plateforme pour découvrir de nouvelles opportunités :
      ${envConfig.frontendUrl}/home

      L'équipe Synkrone
    `,
  }),

  // Template pour notifier a un freellance qu'il a recu une proposition de contrat
  contractProposed: (
    projectTitle: string,
    freelanceName: string,
    companyName?: string,
    contractDate?: string,
    path?: string,
  ) => ({
    subject: `Nouvelle proposition de contrat pour "${projectTitle}" - Synkrone`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Vous avez une nouvelle proposition de contrat</h2>
        <p>
          ${freelanceName ? `Bonjour ${freelanceName},` : "Bonjour,"}
        </p>
        <p>
          Vous avez reçu une nouvelle proposition de contrat pour le projet <strong>"${projectTitle}"</strong>.
        </p>
        ${
          companyName
            ? `<p>Cette proposition vous a été envoyée par <strong>${companyName}</strong>.</p>`
            : ""
        }
        ${
          contractDate
            ? `<p>Date de la proposition : <strong>${contractDate}</strong></p>`
            : ""
        }
        <p>
          Connectez-vous à votre tableau de bord Synkrone pour consulter les détails de la proposition et accepter ou refuser le contrat.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${envConfig.frontendUrl}/${path}"
             style="background: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Voir la proposition de contrat
          </a>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px;">L'équipe Synkrone</p>
      </div>
    `,
    text: `
      Nouvelle proposition de contrat - Synkrone

      ${freelanceName ? `Bonjour ${freelanceName},` : "Bonjour,"}

      Vous avez reçu une nouvelle proposition de contrat pour le projet "${projectTitle}".

      ${companyName ? `Cette proposition vous a été envoyée par ${companyName}.` : ""}
      ${contractDate ? `Date de la proposition : ${contractDate}` : ""}

      Connectez-vous à votre tableau de bord Synkrone pour consulter les détails de la proposition et accepter ou refuser le contrat :
      ${envConfig.frontendUrl}/dashboard/contracts

      L'équipe Synkrone
    `,
  }),

  // Template pour notifier a une company qu'un contrat a été accepté par un freelance
  contractAccepted: (
    projectTitle: string,
    companyName: string,
    freelanceName?: string,
    contractDate?: string,
    path?: string,
  ) => ({
    subject: `Le contrat pour "${projectTitle}" a été accepté - Synkrone`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Un contrat a été accepté</h2>
        <p>
          ${companyName ? `Bonjour ${companyName},` : "Bonjour,"}
        </p>
        <p>
          Nous avons le plaisir de vous informer que le contrat pour le projet <strong>"${projectTitle}"</strong> a été accepté.
        </p>
        ${
          freelanceName
            ? `<p>Le freelance <strong>${freelanceName}</strong> a accepté le contrat.</p>`
            : ""
        }
        ${
          contractDate
            ? `<p>Date d'acceptation : <strong>${contractDate}</strong></p>`
            : ""
        }
        <p>
          Connectez-vous à votre tableau de bord Synkrone pour consulter les détails du contrat et les prochaines étapes.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${envConfig.frontendUrl}/${path}"
             style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Voir les détails du contrat
          </a>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px;">L'équipe Synkrone</p>
      </div>
    `,
    text: `
      Un contrat a été accepté - Synkrone

      ${companyName ? `Bonjour ${companyName},` : "Bonjour,"}

      Nous avons le plaisir de vous informer que le contrat pour le projet "${projectTitle}" a été accepté.

      ${freelanceName ? `Le freelance ${freelanceName} a accepté le contrat.` : ""}
      ${contractDate ? `Date d'acceptation : ${contractDate}` : ""}

      Connectez-vous à votre tableau de bord Synkrone pour consulter les détails du contrat et les prochaines étapes :
      ${envConfig.frontendUrl}/dashboard/contracts

      L'équipe Synkrone
    `,
  }),

  // Template pour notifier a une company qu'un contrat a été refusé par un freelance
  contractRejected: (
    projectTitle: string,
    companyName: string,
    freelanceName?: string,
    contractDate?: string,
    path?: string,
  ) => ({
    subject: `Le contrat pour "${projectTitle}" a été refusé - Synkrone`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Mise à jour de votre contrat</h2>
        <p>
          ${companyName ? `Bonjour ${companyName},` : "Bonjour,"}
        </p>
        <p>
          Nous vous informons que le contrat pour le projet <strong>"${projectTitle}"</strong> a été refusé.
        </p>
        ${
          freelanceName
            ? `<p>Le freelance <strong>${freelanceName}</strong> a refusé le contrat.</p>`
            : ""
        }
        ${
          contractDate
            ? `<p>Date de refus : <strong>${contractDate}</strong></p>`
            : ""
        }
        <p>
          Connectez-vous à votre tableau de bord Synkrone pour consulter les détails du contrat et envisager d'autres options.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${envConfig.frontendUrl}/${path}"
             style="background: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Voir les détails du contrat
          </a>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px;">L  'équipe Synkrone</p>
      </div>
    `,
    text: `
      Mise à jour de votre contrat - Synkrone

      ${companyName ? `Bonjour ${companyName},` : "Bonjour,"}

      Nous vous informons que le contrat pour le projet "${projectTitle}" a été refusé.

      ${freelanceName ? `Le freelance ${freelanceName} a refusé le contrat.` : ""}
      ${contractDate ? `Date de refus : ${contractDate}` : ""}

      Connectez-vous à votre tableau de bord Synkrone pour consulter les détails du contrat et envisager d'autres options :
      ${envConfig.frontendUrl}

      L'équipe Synkrone
    `,
  }),

  // Template pour notifier a un freelance qu'un contrat a ete mise a jour par une company
  contractUpdated: (
    projectTitle: string,
    freelanceName: string,
    companyName?: string,
    updateDate?: string,
    path?: string,
  ) => ({
    subject: `Mise à jour de votre contrat pour "${projectTitle}" - Synkrone`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Votre contrat a été mis à jour</h2>
        <p>
          ${freelanceName ? `Bonjour ${freelanceName},` : "Bonjour,"}
        </p>
        <p>
          Nous vous informons que le contrat pour le projet <strong>"${projectTitle}"</strong> a été mis à jour.
        </p>
        ${
          companyName
            ? `<p>Cette mise à jour a été effectuée par <strong>${companyName}</strong>.</p>`
            : ""
        }
        ${
          updateDate
            ? `<p>Date de la mise à jour : <strong>${updateDate}</strong></p>`
            : ""
        }
        <p>
          Connectez-vous à votre tableau de bord Synkrone pour consulter les détails de la mise à jour et les prochaines étapes.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${envConfig.frontendUrl}/${path}"
             style="background: #ffc107; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Voir les détails du contrat
          </a>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px;">L'équipe Synkrone</p>
      </div>
    `,
    text: `
      Mise à jour de votre contrat - Synkrone

      ${freelanceName ? `Bonjour ${freelanceName},` : "Bonjour,"}

      Nous vous informons que le contrat pour le projet "${projectTitle}" a été mis à jour.

      ${companyName ? `Cette mise à jour a été effectuée par ${companyName}.` : ""}
      ${updateDate ? `Date de la mise à jour : ${updateDate}` : ""}

      Connectez-vous à votre tableau de bord Synkrone pour consulter les détails de la mise à jour et les prochaines étapes :
      ${envConfig.frontendUrl}

      L'équipe Synkrone
    `,
  }),

  // Template pour notifier a une company qu'un freelance a demande une modification de contrat
  contractModificationRequested: (
    projectTitle: string,
    companyName: string,
    freelanceName?: string,
    requestDate?: string,
    path?: string,
  ) => ({
    subject: `Demande de modification de contrat pour "${projectTitle}" - Synkrone`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Vous avez une nouvelle demande de modification de contrat</h2>
        <p>
          ${companyName ? `Bonjour ${companyName},` : "Bonjour,"}
        </p>
        <p>
          Le freelance <strong>${freelanceName}</strong> a demandé une modification du contrat pour le projet <strong>"${projectTitle}"</strong>.
        </p>
        ${
          requestDate
            ? `<p>Date de la demande : <strong>${requestDate}</ strong></p>`
            : ""
        }
        <p>
          Connectez-vous à votre tableau de bord Synkrone pour consulter les détails de la demande et y répondre.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${envConfig.frontendUrl}/${path}"
             style="background: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Voir la demande de modification
          </a>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px;">L'équipe Synkrone</p>
      </div>
    `,
    text: `
      Demande de modification de contrat - Synkrone
      ${companyName ? `Bonjour ${companyName},` : "Bonjour,"}
      Le freelance ${freelanceName} a demandé une modification du contrat pour le projet "${projectTitle}".
      ${requestDate ? `Date de la demande : ${requestDate}` : ""}
      Connectez-vous à votre tableau de bord Synkrone pour consulter les détails de la demande et y répondre :
      ${envConfig.frontendUrl}
      L'équipe Synkrone
    `,
  }),

  // Template pour notifier a un freelance que la mission a ete terminee
  projectCompleted: (
    projectTitle: string,
    freelanceName: string,
    companyName?: string,
    completionDate?: string,
    path?: string,
  ) => ({
    subject: `La mission "${projectTitle}" a été marquée comme terminée - Synkrone`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Votre mission a été marquée comme terminée</h2>
        <p>
          ${freelanceName ? `Bonjour ${freelanceName},` : "Bonjour,"}
        </p>
        <p>
          Nous vous informons que la mission <strong>"${projectTitle}"</strong> a été marquée comme terminée.
        </p>
        ${
          companyName
            ? `<p>Cette mission a été gérée par <strong>${companyName}</strong>.</p>`
            : ""
        }
        ${
          completionDate
            ? `<p>Date de fin de mission : <strong>${completionDate}</strong></p>`
            : ""
        }
        <p>
          Connectez-vous à votre tableau de bord Synkrone pour consulter les détails de la mission terminée et laisser un feedback.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${envConfig.frontendUrl}/${path}"
             style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Voir les détails de la mission
          </a>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px;">L'équipe Synkrone</p>
      </div>
    `,
    text: `
      Votre mission a été marquée comme terminée - Synkrone

      ${freelanceName ? `Bonjour ${freelanceName},` : "Bonjour,"}

      Nous vous informons que la mission "${projectTitle}" a été marquée comme terminée.

      ${companyName ? `Cette mission a été gérée par ${companyName}.` : ""}
      ${completionDate ? `Date de fin de mission : ${completionDate}` : ""}

      Connectez-vous à votre tableau de bord Synkrone pour consulter les détails de la mission terminée et laisser un feedback :
      ${envConfig.frontendUrl}

      L'équipe Synkrone
    `,
  }),

  // Template pour notifier a une company que la mission a ete terminee
  projectCompletedCompany: (
    projectTitle: string,
    companyName: string,
    freelanceName?: string,
    completionDate?: string,
    path?: string,
  ) => ({
    subject: `La mission "${projectTitle}" a été marquée comme terminée - Synkrone`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">La mission a été marquée comme terminée</h2>
        <p>
          ${companyName ? `Bonjour ${companyName},` : "Bonjour,"}
        </p>
        <p>
          Nous vous informons que la mission <strong>"${projectTitle}"</strong> a été marquée comme terminée.
        </p>
        ${
          freelanceName
            ? `<p>Cette mission a été réalisée par le freelance <strong>${freelanceName}</strong>.</p>`
            : ""
        }
        ${
          completionDate
            ? `<p>Date de fin de mission : <strong>${completionDate}</strong></p>`
            : ""
        }
        <p>
          Connectez-vous à votre tableau de bord Synkrone pour consulter les détails de la mission terminée et laisser un feedback.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${envConfig.frontendUrl}/${path}"
             style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Voir les détails de la mission
          </a>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px;">L  'équipe Synkrone</p>
      </div>
    `,
    text: `
      La mission a été marquée comme terminée - Synkrone

      ${companyName ? `Bonjour ${companyName},` : "Bonjour,"}

      Nous vous informons que la mission "${projectTitle}" a été marquée comme terminée.

      ${freelanceName ? `Cette mission a été réalisée par le freelance ${freelanceName}.` : ""}
      ${completionDate ? `Date de fin de mission : ${completionDate}` : ""}

      Connectez-vous à votre tableau de bord Synkrone pour consulter les détails de la mission terminée et laisser un feedback :
      ${envConfig.frontendUrl}

      L'équipe Synkrone
    `,
  }),

  // Template pour notifier a un freelance que son compte a ete suspendu
  accountSuspended: (freelanceName: string, reason: string, path?: string) => ({
    subject: "Votre compte Synkrone a été suspendu",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Notification de suspension de compte</h2>
        <p>
          ${freelanceName ? `Bonjour ${freelanceName},` : "Bonjour,"}
        </p>
        <p>
          Nous vous informons que votre compte Synkrone a été suspendu en raison de la suivante :
        </p>
        <div style="background: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #721c24; margin: 0;">${reason}</p>
        </div>
        <p> Si vous pensez qu'il s'agit d'une erreur ou si vous avez des questions, n'hésitez pas à nous contacter.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${envConfig.frontendUrl}/${path}"
             style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Contacter le support
          </a>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px;">L'équipe Synkrone</p>
      </div>
    `,
    text: `
      Notification de suspension de compte - Synkrone

      ${freelanceName ? `Bonjour ${freelanceName},` : "Bonjour,"}

      Nous vous informons que votre compte Synkrone a été suspendu en raison de la suivante :

      Raison : ${reason}

      Si vous pensez qu'il s'agit d'une erreur ou si vous avez des questions, n'hésitez pas à nous contacter :
      ${envConfig.frontendUrl}

      L'équipe Synkrone
    `,
  }),

  // Template pour notifier a une company que son compte a ete suspendu
  accountSuspendedCompany: (
    companyName: string,
    reason: string,
    path?: string,
  ) => ({
    subject: "Votre compte Synkrone a été suspendu",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Notification de suspension de compte</h2>
        <p>
          ${companyName ? `Bonjour ${companyName},` : "Bonjour,"}
        </p>
        <p>
          Nous vous informons que votre compte Synkrone a été suspendu en raison de la suivante :
        </p>
        <div style="background: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #721c24; margin: 0;">${reason}</p>
        </div>
        <p> Si vous pensez qu'il s'agit d'une erreur ou si vous avez des questions, n'hésitez pas à nous contacter.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${envConfig.frontendUrl}/${path}"
             style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Contacter le support
          </a>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px;">L'équipe Synkrone</p>
      </div>
    `,
    text: `
      Notification de suspension de compte - Synkrone

      ${companyName ? `Bonjour ${companyName},` : "Bonjour,"}

      Nous vous informons que votre compte Synkrone a été suspendu en raison de la suivante :

      Raison : ${reason}

      Si vous pensez qu'il s'agit d'une erreur ou si vous avez des questions, n'hésitez pas à nous contacter :
      ${envConfig.frontendUrl}

      L'équipe Synkrone
    `,
  }),

  // Template pour notifier a un utilisateur que son compte a ete reactive
  // peut etre utilise pour freelance et company
  accountReactivated: (name: string, path?: string) => ({
    subject: "Votre compte Synkrone a été réactivé",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Notification de réactivation de compte</h2>
        <p>
          ${name ? `Bonjour ${name},` : "Bonjour,"}
        </p>
        <p>
          Nous avons le plaisir de vous informer que votre compte Synkrone a été réactivé. Vous pouvez désormais accéder à toutes les fonctionnalités de notre plateforme.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${envConfig.frontendUrl}/${path}"
             style="background: #28a745; color: white; padding: 12px 24px;  text-decoration: none; border-radius: 5px; display: inline-block;">
            Accéder à mon compte
          </a>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px;">L'équipe Synkrone</p>
      </div>
    `,
    text: `
      Notification de réactivation de compte - Synkrone

      ${name ? `Bonjour ${name},` : "Bonjour,"}

      Nous avons le plaisir de vous informer que votre compte Synkrone a été réactivé. Vous pouvez désormais accéder à toutes les fonctionnalités de notre plateforme.

      Accédez à votre compte ici : ${envConfig.frontendUrl}

      L'équipe Synkrone
    `,
  }),

  // Template pour notifier la clôture automatique d'un contrat (freelance)
  contractCompletedAutomatic: (
    projectTitle: string,
    freelanceName: string,
    companyName?: string,
    completionDate?: string,
    path?: string,
  ) => ({
    subject: `Votre contrat pour "${projectTitle}" est terminé - Synkrone`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">🎉 Contrat terminé avec succès !</h2>
        <p>
          ${freelanceName ? `Bonjour ${freelanceName},` : "Bonjour,"}
        </p>
        <p>
          Félicitations ! Votre contrat pour le projet <strong>"${projectTitle}"</strong> a été automatiquement marqué comme terminé.
        </p>
        <p>
          <strong>✅ Tous vos livrables ont été validés avec succès !</strong>
        </p>
        ${
          companyName
            ? `<p>L'entreprise <strong>${companyName}</strong> a validé l'ensemble de votre travail.</p>`
            : ""
        }
        ${
          completionDate
            ? `<p>Date de completion : <strong>${completionDate}</strong></p>`
            : ""
        }
        <p>
          Vous pouvez maintenant évaluer votre collaboration et recevoir vos paiements finaux.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${envConfig.frontendUrl}/${path}"
             style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Évaluer la collaboration
          </a>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px;">L'équipe Synkrone</p>
      </div>
    `,
    text: `
      Contrat terminé avec succès - Synkrone

      ${freelanceName ? `Bonjour ${freelanceName},` : "Bonjour,"}

      Félicitations ! Votre contrat pour le projet "${projectTitle}" a été automatiquement marqué comme terminé.

      ✅ Tous vos livrables ont été validés avec succès !

      ${companyName ? `L'entreprise ${companyName} a validé l'ensemble de votre travail.` : ""}
      ${completionDate ? `Date de completion : ${completionDate}` : ""}

      Vous pouvez maintenant évaluer votre collaboration et recevoir vos paiements finaux :
      ${envConfig.frontendUrl}/dashboard/contracts

      L'équipe Synkrone
    `,
  }),

  // Template pour notifier la clôture automatique d'un contrat (company)
  contractCompletedAutomaticCompany: (
    projectTitle: string,
    companyName: string,
    freelanceName?: string,
    completionDate?: string,
    path?: string,
  ) => ({
    subject: `Le contrat pour "${projectTitle}" est terminé - Synkrone`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">🎉 Contrat terminé avec succès !</h2>
        <p>
          ${companyName ? `Bonjour ${companyName},` : "Bonjour,"}
        </p>
        <p>
          Le contrat pour le projet <strong>"${projectTitle}"</strong> a été automatiquement marqué comme terminé.
        </p>
        <p>
          <strong>✅ Tous les livrables ont été validés avec succès !</strong>
        </p>
        ${
          freelanceName
            ? `<p>Le freelance <strong>${freelanceName}</strong> a livré l'ensemble du travail demandé.</p>`
            : ""
        }
        ${
          completionDate
            ? `<p>Date de completion : <strong>${completionDate}</strong></p>`
            : ""
        }
        <p>
          Vous pouvez maintenant évaluer votre collaboration avec le freelance.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${envConfig.frontendUrl}/${path}"
             style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Évaluer la collaboration
          </a>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px;">L'équipe Synkrone</p>
      </div>
    `,
    text: `
      Contrat terminé avec succès - Synkrone

      ${companyName ? `Bonjour ${companyName},` : "Bonjour,"}

      Le contrat pour le projet "${projectTitle}" a été automatiquement marqué comme terminé.

      ✅ Tous les livrables ont été validés avec succès !

      ${freelanceName ? `Le freelance ${freelanceName} a livré l'ensemble du travail demandé.` : ""}
      ${completionDate ? `Date de completion : ${completionDate}` : ""}

      Vous pouvez maintenant évaluer votre collaboration avec le freelance :
      ${envConfig.frontendUrl}/dashboard/contracts

      L'équipe Synkrone
    `,
  }),

  // Template pour notifier le rejet d'un livrable avec suppression des médias
  deliverableRejectedWithMedia: (
    deliverableTitle: string,
    freelanceName: string,
    feedback: string,
    projectTitle?: string,
    path?: string,
  ) => ({
    subject: `Votre livrable "${deliverableTitle}" a été rejeté - Synkrone`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">❌ Livrable rejeté</h2>
        <p>
          ${freelanceName ? `Bonjour ${freelanceName},` : "Bonjour,"}
        </p>
        <p>
          Votre livrable <strong>"${deliverableTitle}"</strong> a été rejeté.
        </p>
        ${
          projectTitle
            ? `<p>Projet concerné : <strong>${projectTitle}</strong></p>`
            : ""
        }
        <div style="background: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h3 style="color: #721c24; margin-top: 0;">Feedback de l'entreprise :</h3>
          <p style="color: #721c24; margin-bottom: 0;">${feedback}</p>
        </div>
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="color: #856404; margin: 0;">
            <strong>⚠️ Important :</strong> Les médias associés à ce livrable ont été automatiquement supprimés.
            Vous devrez télécharger de nouveaux fichiers lors de votre prochaine soumission.
          </p>
        </div>
        <p>
          Prenez en compte les remarques et soumettez une nouvelle version de votre livrable.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${envConfig.frontendUrl}/${path}"
             style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Voir le livrable
          </a>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px;">L'équipe Synkrone</p>
      </div>
    `,
    text: `
      Livrable rejeté - Synkrone

      ${freelanceName ? `Bonjour ${freelanceName},` : "Bonjour,"}

      Votre livrable "${deliverableTitle}" a été rejeté.
      ${projectTitle ? `Projet concerné : ${projectTitle}` : ""}

      Feedback de l'entreprise :
      ${feedback}

      ⚠️ Important : Les médias associés à ce livrable ont été automatiquement supprimés. Vous devrez télécharger de nouveaux fichiers lors de votre prochaine soumission.

      Prenez en compte les remarques et soumettez une nouvelle version de votre livrable :
      ${envConfig.frontendUrl}/dashboard/deliverables

      L'équipe Synkrone
    `,
  }),

  // Template pour notifier la validation d'un livrable
  deliverableValidated: (
    deliverableTitle: string,
    freelanceName: string,
    companyName?: string,
    projectTitle?: string,
    path?: string,
  ) => ({
    subject: `Votre livrable "${deliverableTitle}" a été validé ! - Synkrone`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">✅ Livrable validé avec succès !</h2>
        <p>
          ${freelanceName ? `Bonjour ${freelanceName},` : "Bonjour,"}
        </p>
        <p>
          Excellente nouvelle ! Votre livrable <strong>"${deliverableTitle}"</strong> a été validé avec succès.
        </p>
        ${
          projectTitle
            ? `<p>Projet concerné : <strong>${projectTitle}</strong></p>`
            : ""
        }
        ${
          companyName
            ? `<p>L'entreprise <strong>${companyName}</strong> a approuvé votre travail.</p>`
            : ""
        }
        <div style="background: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
          <p style="color: #155724; margin: 0;">
            <strong>🎉 Félicitations !</strong> Votre livrable respecte parfaitement les spécifications demandées.
            Le paiement associé sera traité selon les termes du contrat.
          </p>
        </div>
        <p>
          Vous pouvez consulter les détails du livrable validé dans votre tableau de bord.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${envConfig.frontendUrl}/${path}"
             style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Voir le livrable
          </a>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px;">L'équipe Synkrone</p>
      </div>
    `,
    text: `
      Livrable validé avec succès - Synkrone

      ${freelanceName ? `Bonjour ${freelanceName},` : "Bonjour,"}

      Excellente nouvelle ! Votre livrable "${deliverableTitle}" a été validé avec succès.

      ${projectTitle ? `Projet concerné : ${projectTitle}` : ""}
      ${companyName ? `L'entreprise ${companyName} a approuvé votre travail.` : ""}

      🎉 Félicitations ! Votre livrable respecte parfaitement les spécifications demandées.
      Le paiement associé sera traité selon les termes du contrat.

      Consultez les détails dans votre tableau de bord :
      ${envConfig.frontendUrl}/dashboard/deliverables

      L'équipe Synkrone
    `,
  }),

  // Template pour notifier la soumission d'un livrable à l'entreprise
  deliverableSubmitted: (
    deliverableTitle: string,
    freelanceName: string,
    companyName?: string,
    projectTitle?: string,
    path?: string,
  ) => ({
    subject: `Nouveau livrable soumis : "${deliverableTitle}" - Synkrone`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #17a2b8;">📋 Nouveau livrable à examiner</h2>
        <p>
          ${companyName ? `Bonjour ${companyName},` : "Bonjour,"}
        </p>
        <p>
          Le freelance <strong>${freelanceName}</strong> vient de soumettre un nouveau livrable pour validation.
        </p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #17a2b8;">
          <h3 style="color: #17a2b8; margin-top: 0;">Détails du livrable :</h3>
          <p style="margin: 5px 0;"><strong>Titre :</strong> ${deliverableTitle}</p>
          ${
            projectTitle
              ? `<p style="margin: 5px 0;"><strong>Projet :</strong> ${projectTitle}</p>`
              : ""
          }
          <p style="margin: 5px 0;"><strong>Freelance :</strong> ${freelanceName}</p>
        </div>
        <p>
          Connectez-vous à votre tableau de bord pour examiner le livrable et décider de le valider ou le rejeter.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${envConfig.frontendUrl}/${path}"
             style="background: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Examiner le livrable
          </a>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px;">L'équipe Synkrone</p>
      </div>
    `,
    text: `
      Nouveau livrable à examiner - Synkrone

      ${companyName ? `Bonjour ${companyName},` : "Bonjour,"}

      Le freelance ${freelanceName} vient de soumettre un nouveau livrable pour validation.

      Détails du livrable :
      - Titre : ${deliverableTitle}
      ${projectTitle ? `- Projet : ${projectTitle}` : ""}
      - Freelance : ${freelanceName}

      Connectez-vous à votre tableau de bord pour examiner le livrable et décider de le valider ou le rejeter :
      ${envConfig.frontendUrl}/dashboard/deliverables

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
