/**
 * Script pour envoyer une notification de bienvenue à tous les utilisateurs existants
 * Ce script utilise Socket.IO pour envoyer les notifications en temps réel
 * Usage : ts-node src/scripts/test/send-welcome-realtime.ts
 */

import { FreelanceRepository } from "../../features/freelance/freelance.repository";
import { CompanyRepository } from "../../features/company/company.repository";
import { NotificationRepository } from "../../features/notifications/notification.repository";
import { NotificationTypeEnum } from "../../features/notifications/notification.model";
import { UserNotificationRepository } from "../../features/notifications/user-notifications/user-notification.repository";
import { io, startServer } from "../../server";
import { SOKET_EVENTS } from "../../utils/constant";

// Note: Ce script démarre le serveur pour utiliser Socket.IO
console.log("⚠️ Ce script démarre le serveur pour utiliser Socket.IO");

// Initialisation des repositories sans dépendre des services
const freelanceRepo = new FreelanceRepository();
const companyRepo = new CompanyRepository();
const notificationRepo = new NotificationRepository();
const userNotificationRepo = new UserNotificationRepository();

/**
 * Crée une liaison user-notification directement via le repository
 */
async function createUserNotificationWithRealtime(
  userId: string,
  notificationId: string,
  isRead: boolean = false,
) {
  try {
    // 1. Créer la liaison user-notification dans la base de données
    const userNotification = await userNotificationRepo.createUserNotification(
      userId,
      notificationId,
      isRead,
    );

    // 2. Récupérer la notification complète
    const notification =
      await notificationRepo.getNotificationById(notificationId);

    // 3. Émettre l'événement Socket.IO en temps réel
    if (notification) {
      io.to(userId).emit(SOKET_EVENTS.notifications.new, {
        ...userNotification,
        notification,
      });
      console.log(
        `🔔 Notification émise en temps réel pour l'utilisateur ${userId}`,
      );
    }

    return userNotification;
  } catch (error) {
    console.error(
      `Erreur lors de la création de notification pour ${userId}:`,
      error,
    );
    throw error;
  }
}

// Ajout de la fonction cleanupAndExit pour corriger l'erreur
function cleanupAndExit(code: number) {
  // Si besoin, ajouter ici des opérations de nettoyage (fermeture de connexions, etc.)
  process.exit(code);
}

async function sendWelcomeNotifications() {
  try {
    // Démarrer le serveur avant d'envoyer les notifications
    console.log("🚀 Démarrage du serveur...");
    await new Promise<void>((resolve) => {
      const server = startServer();
      server.on("listening", () => {
        console.log("✅ Serveur démarré avec succès !");
        resolve();
      });
    });

    // Attendre un peu pour que Socket.IO soit complètement initialisé
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log(
      "\n🚀 Démarrage de l'envoi des notifications de bienvenue...\n",
    );

    // 1. Récupérer tous les freelances
    console.log("📋 Récupération des freelances...");
    const freelances = await freelanceRepo.getFreelancesWithFilters({
      limit: 10000,
      page: 1,
    });
    console.log(`✅ ${freelances.data.length} freelances trouvés.`);

    // 2. Récupérer toutes les companies
    console.log("📋 Récupération des entreprises...");
    const companies = await companyRepo.getCompaniesWithFilters({
      limit: 10000,
      page: 1,
    });
    console.log(`✅ ${companies.data.length} entreprises trouvées.`);

    // 3. Créer la notification de bienvenue
    console.log("📝 Création de la notification de bienvenue...");
    const notification = await notificationRepo.createNotification({
      title: "Bienvenue sur la plateforme !",
      message:
        "Votre compte a bien été créé. Nous vous souhaitons la bienvenue sur Synkrone.",
      type: NotificationTypeEnum.system,
      is_global: false,
    });

    if (!notification) {
      console.error(
        "❌ Erreur lors de la création de la notification de bienvenue.",
      );
      process.exit(1);
    }

    console.log(`✅ Notification créée avec l'ID : ${notification.id}`);

    // 4. Envoyer la notification à tous les freelances
    console.log("\n📤 Envoi des notifications aux freelances...");
    let freelanceSuccess = 0;
    let freelanceErrors = 0;

    for (const freelance of freelances.data) {
      try {
        await createUserNotificationWithRealtime(
          freelance.id,
          notification.id,
          false,
        );
        console.log(`✅ Notification envoyée à freelance : ${freelance.email}`);
        freelanceSuccess++;
      } catch (err) {
        console.error(`❌ Erreur pour freelance ${freelance.email} :`, err);
        freelanceErrors++;
      }
    }

    // 5. Envoyer la notification à toutes les companies
    console.log("\n📤 Envoi des notifications aux entreprises...");
    let companySuccess = 0;
    let companyErrors = 0;

    for (const company of companies.data) {
      try {
        await createUserNotificationWithRealtime(
          company.id,
          notification.id,
          false,
        );
        console.log(
          `✅ Notification envoyée à company : ${company.company_email}`,
        );
        companySuccess++;
      } catch (err) {
        console.error(`❌ Erreur pour company ${company.company_email} :`, err);
        companyErrors++;
      }
    }

    console.log("\n------- 📊 RÉCAPITULATIF -------");
    console.log(
      `✅ Freelances : ${freelanceSuccess} succès, ❌ ${freelanceErrors} erreurs`,
    );
    console.log(
      `✅ Entreprises : ${companySuccess} succès, ❌ ${companyErrors} erreurs`,
    );
    console.log(
      "\n✨ Notifications de bienvenue envoyées à tous les utilisateurs.",
    );

    console.log(
      "\n⏳ Attente de 3 secondes pour terminer les envois Socket.IO...",
    );
    setTimeout(() => {
      console.log("🛑 Arrêt du serveur...");
      cleanupAndExit(0);
    }, 3000);
  } catch (error) {
    console.error("❌ Erreur globale du script :", error);
    cleanupAndExit(1);
  }
}
// Exécution du script
sendWelcomeNotifications();
