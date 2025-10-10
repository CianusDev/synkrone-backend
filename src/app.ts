import cors from "cors";
import dotenv from "dotenv";
import express, { Response } from "express";
import { envConfig } from "./config/env.config";
import applicationsRoutes from "./features/applications/applications.route";
import authAdminRoutes from "./features/auth-admin/auth-admin.routes";
import authRoutes from "./features/auth/auth-unified.route";
import categorySkillRoutes from "./features/category-skill/category-skill.route";
import { CompanyRepository } from "./features/company/company.repository";
import contractsRoutes from "./features/contracts/contracts.route";
import freelanceSkillRoutes from "./features/freelance-skills/freelance-skills.route";
import { FreelanceRepository } from "./features/freelance/freelance.repository";
import freelanceRoutes from "./features/freelance/freelance.route";
import { NotificationTypeEnum } from "./features/notifications/notification.model";
import { NotificationRepository } from "./features/notifications/notification.repository";
import notificationRoutes from "./features/notifications/notification.route";
import { UserNotificationRepository } from "./features/notifications/user-notifications/user-notification.repository";
import userNotificationRoutes from "./features/notifications/user-notifications/user-notification.route";
import profileRoutes from "./features/profile/profile.routes";
import projectCategoryRoutes from "./features/project-categories/project-categories.route";
import projectInvitationRoutes from "./features/project-invitations/project-invitations.route";
import projectRoutes from "./features/projects/projects.route";
import skillsRoutes from "./features/skills/skill.route";
import projectSkillsRoutes from "./features/project-skills/project-skills.route";
import conversationsRoutes from "./features/converstions/conversation.route";
import messagesRoutes from "./features/messages/message.route";
import presenceRoutes from "./features/presence/presence.route";
import { io } from "./server";
import workDaysRouter from "./features/work-days/work-days.route";
import mediaRoutes from "./features/media/media.route";
import deliverablesRoutes from "./features/deliverables/deliverables.route";
import { HTTP_STATUS, SOKET_EVENTS } from "./utils/constant";
import deliverableMediaRoutes from "./features/media/deliverable_media/deliverable_media.route";
import adminRouter from "./features/admin/admin.route";

dotenv.config();

export const app = express();

const CORS_ORIGIN = envConfig.corsOrigin;

app.use(express.json()); // 👈 nécessaire pour parser le JSON

// Configuration de CORS pour autoriser les origines spécifiques
const corsOptions = {
  origin: CORS_ORIGIN || "*", // à adapter selon vos besoins de sécurité
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
};

app.use(cors(corsOptions));
// Dans un contrôleur Express
app.get("/test-notif/:userId", (req, res) => {
  const userId = req.params.userId;
  io.to(userId).emit("notification:new", {
    notification: {
      title: "Test manuel",
      message: "Ceci est un test manuel",
    },
  });
  res.send("Notification envoyée !");
});

// Endpoint pour envoyer les notifications de bienvenue (Admin uniquement)
app.post(
  "/api/admin/send-welcome-notifications",
  // AuthAdminMiddleware,
  async (req, res) => {
    try {
      console.log("🚀 Démarrage de l'envoi des notifications de bienvenue...");

      // Initialisation des repositories
      const freelanceRepo = new FreelanceRepository();
      const companyRepo = new CompanyRepository();
      const notificationRepo = new NotificationRepository();
      const userNotificationRepo = new UserNotificationRepository();

      // Fonction pour créer une notification utilisateur avec temps réel
      const createUserNotificationWithRealtime = async (
        userId: string,
        notificationId: string,
        isRead: boolean = false,
      ) => {
        // 1. Créer la liaison user-notification dans la base de données
        const userNotification =
          await userNotificationRepo.createUserNotification(
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
      };

      // 1. Récupérer tous les freelances
      const freelances = await freelanceRepo.getFreelancesWithFilters({
        limit: 10000,
        page: 1,
      });

      // 2. Récupérer toutes les companies
      const companies = await companyRepo.getCompaniesWithFilters({
        limit: 10000,
        page: 1,
      });

      // 3. Créer la notification de bienvenue
      const notification = await notificationRepo.createNotification({
        title: "Bienvenue sur la plateforme !",
        message:
          "Votre compte a bien été créé. Nous vous souhaitons la bienvenue sur Synkrone.",
        type: NotificationTypeEnum.system,
        is_global: false,
      });

      if (!notification) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Erreur lors de la création de la notification",
        });
      }

      // 4. Compteurs pour le récapitulatif
      let freelanceSuccess = 0;
      let freelanceErrors = 0;
      let companySuccess = 0;
      let companyErrors = 0;

      // 5. Envoyer la notification à tous les freelances
      for (const freelance of freelances.data) {
        try {
          await createUserNotificationWithRealtime(
            freelance.id,
            notification.id,
            false,
          );
          freelanceSuccess++;
        } catch (err) {
          console.error(`❌ Erreur pour freelance ${freelance.email}:`, err);
          freelanceErrors++;
        }
      }

      // 6. Envoyer la notification à toutes les companies
      for (const company of companies.data) {
        try {
          await createUserNotificationWithRealtime(
            company.id,
            notification.id,
            false,
          );
          companySuccess++;
        } catch (err) {
          console.error(
            `❌ Erreur pour company ${company.company_email}:`,
            err,
          );
          companyErrors++;
        }
      }

      // 7. Retourner le récapitulatif
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Notifications de bienvenue envoyées",
        data: {
          notification_id: notification.id,
          freelances: {
            total: freelances.data.length,
            success: freelanceSuccess,
            errors: freelanceErrors,
          },
          companies: {
            total: companies.data.length,
            success: companySuccess,
            errors: companyErrors,
          },
          total_sent: freelanceSuccess + companySuccess,
        },
      });
    } catch (error) {
      console.error(
        "❌ Erreur globale lors de l'envoi des notifications:",
        error,
      );
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Erreur interne du serveur",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

app.get("/health", (_, res: Response) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Server is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/auth-admin", authAdminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/freelance-skills/", freelanceSkillRoutes);
app.use("/api/skills", skillsRoutes);
app.use("/api/project-categories", projectCategoryRoutes);
app.use("/api/category-skill", categorySkillRoutes);
app.use("/api/freelances", freelanceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/user-notifications", userNotificationRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/project-invitations", projectInvitationRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/contracts", contractsRoutes);
app.use("/api/project-skills", projectSkillsRoutes);
app.use("/api/conversations", conversationsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/presence", presenceRoutes);
app.use("/api/deliverables", deliverablesRoutes);
app.use("/api/deliverable-media", deliverableMediaRoutes);
app.use("/api/work-days", workDaysRouter);
app.use("/api/admin/", adminRouter);
