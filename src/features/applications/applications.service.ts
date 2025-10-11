import { ApplicationsRepository } from "./applications.repository";
import { Application, ApplicationStatus } from "./applications.model";
import { FreelanceRepository } from "../freelance/freelance.repository";
import { ProjectsRepository } from "../projects/projects.repository";
import { Freelance } from "../freelance/freelance.model";
import { NotificationRepository } from "../notifications/notification.repository";
import { UserNotificationRepository } from "../notifications/user-notifications/user-notification.repository";
import { NotificationTypeEnum } from "../notifications/notification.model";
import { UserNotificationService } from "../notifications/user-notifications/user-notification.service";
import { ConversationService } from "../converstions/conversation.service";
import { emailTemplates, sendEmail } from "../../config/smtp-email";

export class ApplicationsService {
  private readonly repository: ApplicationsRepository;
  private readonly freelanceRepository: FreelanceRepository;
  private readonly projectsRepository: ProjectsRepository;
  private readonly userNotificationService: UserNotificationService;
  private readonly notificationRepository = new NotificationRepository();
  private readonly conversationService = new ConversationService();

  constructor() {
    this.repository = new ApplicationsRepository();
    this.freelanceRepository = new FreelanceRepository();
    this.projectsRepository = new ProjectsRepository();
    this.userNotificationService = new UserNotificationService();
    this.notificationRepository = new NotificationRepository();
    this.conversationService = new ConversationService();
  }

  /**
   * Create a new application (candidature)
   * @param data - Partial application data
   * @returns The created application
   */
  async createApplication(data: Partial<Application>): Promise<Application> {
    // 1. Vérifier s'il existe déjà une candidature pour ce freelance sur ce projet
    const existingApplication =
      await this.repository.getApplicationByFreelanceAndProject(
        data.freelance_id || "",
        data.project_id || "",
      );

    if (existingApplication) {
      switch (existingApplication.status) {
        case ApplicationStatus.ACCEPTED:
          throw new Error(
            "Vous avez déjà été accepté sur cette mission et ne pouvez pas repostuler.",
          );
        case ApplicationStatus.SUBMITTED:
          throw new Error("Une candidature est déjà en cours pour ce projet.");
        case ApplicationStatus.UNDER_REVIEW:
          throw new Error(
            "Une candidature est déjà en cours d'examen pour ce projet.",
          );
        case ApplicationStatus.REJECTED:
          // Mettre à jour la candidature rejetée avec les nouvelles données
          await this.repository.updateApplicationForReactivation(
            existingApplication.id,
            {
              proposed_rate: data.proposed_rate,
              cover_letter: data.cover_letter,
              status: ApplicationStatus.SUBMITTED,
            },
          );
          console.log(
            `✅ Candidature rejetée réactivée avec nouvelles données`,
          );
          break;
        case ApplicationStatus.WITHDRAWN:
          // Mettre à jour la candidature retirée avec les nouvelles données
          await this.repository.updateApplicationForReactivation(
            existingApplication.id,
            {
              proposed_rate: data.proposed_rate,
              cover_letter: data.cover_letter,
              status: ApplicationStatus.SUBMITTED,
            },
          );
          console.log(
            `✅ Candidature retirée réactivée avec nouvelles données`,
          );
          break;
        default:
          throw new Error("Une candidature existe déjà pour ce projet.");
      }
    }

    const project = await this.projectsRepository.getProjectById(
      data.project_id || "",
    );
    if (!project) throw new Error("Projet introuvable.");

    const freelance = await this.freelanceRepository.getFreelanceById(
      data.freelance_id || "",
    );
    if (!freelance) throw new Error("Freelance introuvable.");

    // Notifier l'entreprise de la nouvelle candidature
    if (project && project.company?.id) {
      const notification = await this.notificationRepository.createNotification(
        {
          title: "Nouvelle candidature reçue",
          message: `Le freelance ${freelance.firstname} ${freelance.lastname} a postulé au projet "${project.title}".`,
          type: NotificationTypeEnum.application,
          is_global: false,
          metadata: {
            applicationId: existingApplication
              ? existingApplication.id
              : "new_application", // On peut ajuster cela selon les besoins
            projectId: project.id,
            freelanceId: freelance.id,
            link: `/company/projects/${project.id}?tab=applications`, // Lien vers la page des candidatures du projet
          },
        },
      );
      if (notification) {
        await this.userNotificationService.createUserNotification(
          project.company.id,
          notification.id,
          false,
        );
      }
    }
    // Si une candidature inactive existe, la mettre à jour au lieu d'en créer une nouvelle
    if (
      existingApplication &&
      (existingApplication.status === ApplicationStatus.REJECTED ||
        existingApplication.status === ApplicationStatus.WITHDRAWN)
    ) {
      console.log(
        `✅ Mise à jour de la candidature existante ${existingApplication.id}`,
      );
      // Retourner la candidature mise à jour sans créer de nouvelle candidature ni envoyer d'email
      // car la candidature a déjà été mise à jour plus haut
      const updatedExisting = await this.repository.getApplicationById(
        existingApplication.id,
      );
      if (updatedExisting) {
        return updatedExisting;
      }
    }

    // Créer la candidature
    const newapplication = await this.repository.createApplication(data);
    const template = emailTemplates.freelanceApplied(
      project.title,
      freelance.firstname || "Cher(e) Freelance",
      project.company?.company_name || "l'entreprise",
      (() => {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, "0");
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const year = String(now.getFullYear());
        return `${day}/${month}/${year}`;
      })(),
    );

    // Envoi de l'email
    await sendEmail({
      to: project.company?.company_email!,
      ...template,
    });

    return newapplication;
  }

  /**
   * Get an application by its ID
   * @param id - Application UUID
   * @returns The application or null if not found
   */
  async getApplicationById(id: string): Promise<any | null> {
    const application = await this.repository.getApplicationById(id);
    if (!application) return null;

    // Récupérer les informations du freelance
    const freelance = await this.freelanceRepository.getFreelanceById(
      application.freelance_id,
    );
    const { password_hashed, ...freelanceSafe } = freelance || {};

    // Récupérer les informations du projet
    const project = await this.projectsRepository.getProjectById(
      application.project_id,
    );

    // Récupérer les statistiques du freelance
    const freelanceStats = await this.repository.getApplicationStatsByFreelance(
      application.freelance_id,
    );

    // Récupérer les statistiques du projet
    const projectStats = await this.repository.getApplicationStatsByProject(
      application.project_id,
    );

    return {
      ...application,
      freelance: freelanceSafe,
      project: project || undefined,
      freelanceStats,
      projectStats,
    };
  }

  /**
   * Get all applications for a given freelance
   * @param freelanceId - Freelance UUID
   * @returns Array of applications with stats
   */
  async getApplicationsByFreelanceId(freelanceId: string): Promise<{
    applications: Application[];
    stats: {
      submitted: number;
      accepted: number;
      rejected: number;
      under_review: number;
      withdrawn: number;
      total: number;
    };
  }> {
    const applications =
      await this.repository.getApplicationsByFreelanceId(freelanceId);
    const freelance =
      await this.freelanceRepository.getFreelanceById(freelanceId);
    const { password_hashed, ...freelanceSafe } = freelance || {};

    // Récupérer les statistiques du freelance
    const stats =
      await this.repository.getApplicationStatsByFreelance(freelanceId);

    // Pour chaque application, inclure l'objet projet
    const applicationsWithProjects = await Promise.all(
      applications.map(async (app) => {
        const project = await this.projectsRepository.getProjectById(
          app.project_id,
        );
        return {
          ...app,
          freelance: freelanceSafe,
          project: project || undefined,
        };
      }),
    );

    return {
      applications: applicationsWithProjects,
      stats,
    };
  }

  // Retirer une candidature (changer le statut à 'withdrawn' si le freelance est bien le propriétaire)
  // Retirer une candidature (changer le statut à 'withdrawn' si le freelance est bien le propriétaire et si le statut le permet)
  async withdrawApplication(
    id: string,
    freelanceId: string,
  ): Promise<(Application & { freelance: Partial<Freelance> }) | null> {
    console.log({ freelanceId, id });
    const application = await this.repository.getApplicationById(id);
    console.log({ application });
    if (!application || application.freelance_id !== freelanceId) {
      return null; // Non trouvé ou non autorisé
    }
    // Empêcher le retrait si la candidature est déjà acceptée ou rejetée
    if (
      application.status === ApplicationStatus.ACCEPTED ||
      application.status === ApplicationStatus.REJECTED
    ) {
      // On pourrait retourner une erreur spécifique ici
      throw new Error(
        "Impossible de retirer une candidature déjà acceptée ou rejetée.",
      );
    }
    // console.log({ application });
    // Mettre à jour le statut vers withdrawn
    const updated = await this.repository.updateApplicationStatus(
      id,
      ApplicationStatus.WITHDRAWN,
      new Date(),
    );
    if (!updated) return null;

    // Récupérer les informations pour les notifications
    const freelance =
      await this.freelanceRepository.getFreelanceById(freelanceId);
    const { password_hashed, ...freelanceSafe } = freelance || {};

    const project = await this.projectsRepository.getProjectById(
      updated.project_id,
    );

    // Notifier l'entreprise que la candidature a été retirée
    if (project && project.company?.id && freelance) {
      try {
        const notification =
          await this.notificationRepository.createNotification({
            title: "Candidature retirée",
            message: `Le freelance ${freelance.firstname} ${freelance.lastname} a retiré sa candidature au projet "${project.title}".`,
            type: NotificationTypeEnum.application,
            is_global: false,
            metadata: {
              applicationId: updated.id,
              projectId: project.id,
              freelanceId: freelance.id,
              link: `/company/projects/${project.id}?tab=applications`, // Lien vers la page des candidatures du projet
            },
          });

        if (notification) {
          await this.userNotificationService.createUserNotification(
            project.company.id,
            notification.id,
            false,
          );
        }
      } catch (notificationError) {
        console.error(
          `❌ Erreur lors de l'envoi de la notification pour candidature retirée ${id}:`,
          notificationError,
        );
        // Ne pas faire échouer l'opération de retrait si la notification échoue
      }
    }

    return {
      ...updated,
      freelance: freelanceSafe,
      project: project || undefined,
    };
  }

  /**
   * Get all applications for a given project
   * @param projectId - Project UUID
   * @returns Array of applications with stats
   */
  async getApplicationsByProjectId(projectId: string): Promise<{
    applications: any[];
    stats: {
      submitted: number;
      accepted: number;
      rejected: number;
      under_review: number;
      withdrawn: number;
      total: number;
    };
  }> {
    const applications =
      await this.repository.getApplicationsByProjectId(projectId);

    // Récupérer les informations du projet une seule fois
    const project = await this.projectsRepository.getProjectById(projectId);

    // Récupérer les statistiques du projet
    const stats = await this.repository.getApplicationStatsByProject(projectId);

    // Pour chaque application, inclure l'objet freelance et projet
    const applicationsWithFreelances = await Promise.all(
      applications.map(async (app) => {
        const freelance = await this.freelanceRepository.getFreelanceById(
          app.freelance_id,
        );
        const { password_hashed, ...freelanceSafe } = freelance || {};
        return {
          ...app,
          freelance: freelanceSafe,
          project: project || undefined,
        };
      }),
    );

    return {
      applications: applicationsWithFreelances,
      stats,
    };
  }
  /**
   * Update the status of an application
   * @param id - Application UUID
   * @param status - New status
   * @param responseDate - Optional response date
   * @returns The updated application or null if not found
   */
  async updateApplicationStatus(
    id: string,
    status: ApplicationStatus,
    responseDate?: Date,
  ): Promise<Application | null> {
    // Find the application
    const application = await this.repository.getApplicationById(id);
    if (!application) {
      return null;
    }

    // Récupérer les données du projet et du freelance une seule fois
    const project = await this.projectsRepository.getProjectById(
      application.project_id,
    );

    const freelance = await this.freelanceRepository.getFreelanceById(
      application.freelance_id,
    );

    if (!project) {
      throw new Error("Projet introuvable.");
    }

    if (!freelance) {
      throw new Error("Freelance introuvable.");
    }

    const updatedApplication = await this.repository.updateApplicationStatus(
      id,
      status,
      responseDate,
    );

    // Optionally, send notification if status is ACCEPTED or REJECTED
    if (
      (status === ApplicationStatus.ACCEPTED ||
        status === ApplicationStatus.REJECTED) &&
      project &&
      project.company?.id &&
      freelance
    ) {
      let notificationTitle = "";
      let notificationMessage = "";

      if (status === ApplicationStatus.ACCEPTED) {
        notificationTitle = "Candidature acceptée";
        notificationMessage = `Votre candidature au projet "${project.title}" a été acceptée.`;
        const template = emailTemplates.applicationAccepted(
          project.title,
          freelance.firstname || "Cher(e) Freelance",
          project.company?.company_name || "l'entreprise",
          (() => {
            const now = new Date();
            const day = String(now.getDate()).padStart(2, "0");
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const year = String(now.getFullYear());
            return `${day}/${month}/${year}`;
          })(),
        );

        // Envoi de l'email
        await sendEmail({
          to: freelance.email!,
          ...template,
        });
      } else if (status === ApplicationStatus.REJECTED) {
        notificationTitle = "Candidature refusée";
        notificationMessage = `Votre candidature au projet "${project.title}" a été refusée.`;
        const template = emailTemplates.applicationRejected(
          project.title,
          freelance.firstname || "Cher(e) Freelance",
          project.company?.company_name || "l'entreprise",
          (() => {
            const now = new Date();
            const day = String(now.getDate()).padStart(2, "0");
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const year = String(now.getFullYear());
            return `${day}/${month}/${year}`;
          })(),
        );

        // Envoi de l'email
        await sendEmail({
          to: freelance.email!,
          ...template,
        });
      }

      const notification = await this.notificationRepository.createNotification(
        {
          title: notificationTitle,
          message: notificationMessage,
          type: NotificationTypeEnum.application,
          is_global: false,
          metadata: {
            company_name: project.company?.company_name || "",
            logo_url: project.company?.logo_url || "",
            applicationId: application.id,
            projectId: project.id,
            freelanceId: freelance.id,
            link: `/freelance/proposals/${application.id}`, // Lien vers la page de la candidature
          },
        },
      );

      if (notification) {
        await this.userNotificationService.createUserNotification(
          freelance.id,
          notification.id,
          false,
        );
      }
    }

    // Si on accepte une candidature, rejeter toutes les autres du même projet
    if (
      status === ApplicationStatus.ACCEPTED &&
      project?.allowMultipleApplications === false
    ) {
      await this.repository.rejectOtherApplications(application.project_id, id);

      // Créer la conversation entre le freelance et la company si elle n'existe pas déjà
      if (project && project.company?.id) {
        try {
          await this.conversationService.createOrGetConversation({
            freelanceId: application.freelance_id,
            companyId: project.company.id,
            applicationId: application.id,
          });
          console.log(
            `✅ Conversation créée/récupérée pour la candidature acceptée: ${application.id}`,
          );
        } catch (conversationError) {
          console.error(
            `❌ Erreur lors de la création de la conversation pour la candidature ${application.id}:`,
            conversationError,
          );
          // Ne pas faire échouer toute l'opération si la conversation échoue
          // L'acceptation de la candidature reste valide
        }
      }

      // Notifier tous les freelances dont la candidature est rejetée automatiquement
      const projectTitle = project?.title || "ce projet";
      const rejectedApps = await this.repository.getApplicationsByProjectId(
        application.project_id,
      );
      for (const app of rejectedApps) {
        if (app.id !== id && app.status === ApplicationStatus.REJECTED) {
          // Récupère le freelance
          const rejectedFreelance =
            await this.freelanceRepository.getFreelanceById(app.freelance_id);
          if (rejectedFreelance) {
            const notification =
              await this.notificationRepository.createNotification({
                title: "Candidature refusée",
                message: `Votre candidature au projet "${projectTitle}" a été refusée car une autre a été acceptée.`,
                type: NotificationTypeEnum.application,
                is_global: false,
                metadata: {
                  applicationId: app.id,
                  projectId: project.id,
                  freelanceId: rejectedFreelance.id,
                  link: `/freelance/proposals/${app.id}`, // Lien vers la page de la candidature
                },
              });
            if (notification) {
              await this.userNotificationService.createUserNotification(
                rejectedFreelance.id,
                notification.id,
                false,
              );
            }
          }
        }
      }
    }

    return updatedApplication;
  }

  /**
   * Delete an application by its ID
   * @param id - Application UUID
   * @returns true if deleted, false otherwise
   */
  async deleteApplication(id: string): Promise<boolean> {
    return this.repository.deleteApplication(id);
  }

  /**
   * Récupère les candidatures avec filtres et pagination, retourne aussi le nombre total de pages
   * @param params - Paramètres de filtre et pagination
   * @returns { data, total, page, limit, totalPages, stats? }
   */
  async getApplicationsWithFilters(params: {
    status?: ApplicationStatus;
    freelanceId?: string;
    projectId?: string;
    limit?: number;
    page?: number;
    includeAll?: boolean;
  }): Promise<{
    data: Application[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    stats?: {
      submitted: number;
      accepted: number;
      rejected: number;
      under_review: number;
      withdrawn: number;
      total: number;
    };
  }> {
    const result = await this.repository.getApplicationsWithFilters(params);
    const totalPages = Math.ceil(result.total / (result.limit || 1));

    // Récupérer les statistiques si on filtre par freelance ou projet
    let stats = undefined;
    if (params.freelanceId) {
      stats = await this.repository.getApplicationStatsByFreelance(
        params.freelanceId,
      );
    } else if (params.projectId) {
      stats = await this.repository.getApplicationStatsByProject(
        params.projectId,
      );
    }

    // Pour chaque application, inclure l'objet freelance et projet
    const dataWithFreelanceAndProject = await Promise.all(
      result.data.map(async (app) => {
        const freelance = await this.freelanceRepository.getFreelanceById(
          app.freelance_id,
        );
        const { password_hashed, ...freelanceSafe } = freelance || {};

        const project = await this.projectsRepository.getProjectById(
          app.project_id,
        );

        return {
          ...app,
          freelance: freelanceSafe,
          project: project || undefined,
        };
      }),
    );
    return {
      ...result,
      data: dataWithFreelanceAndProject,
      totalPages,
      stats,
    };
  }

  /**
   * Update application content (proposed_rate and cover_letter) by freelance
   * @param id - Application UUID
   * @param data - Content data to update
   * @param freelanceId - Freelance ID for authorization
   * @returns The updated application or null if not found/unauthorized
   */
  async updateApplicationContent(
    id: string,
    data: { proposed_rate?: number; cover_letter?: string },
    freelanceId: string,
  ): Promise<Application | null> {
    // Vérifier que la candidature existe et appartient au freelance
    const application = await this.repository.getApplicationById(id);
    if (!application || application.freelance_id !== freelanceId) {
      return null; // Non trouvé ou non autorisé
    }

    // Vérifier que la candidature peut être modifiée (seulement si statut SUBMITTED)
    if (application.status !== ApplicationStatus.SUBMITTED) {
      throw new Error(
        "Seules les candidatures avec le statut 'soumise' peuvent être modifiées.",
      );
    }

    // Valider les données
    if (data.proposed_rate !== undefined && data.proposed_rate < 0) {
      throw new Error("Le tarif proposé doit être positif");
    }

    // Mettre à jour le contenu
    const updated = await this.repository.updateApplicationContent(id, data);
    if (!updated) return null;

    // Retourner la candidature mise à jour avec les informations enrichies
    const freelance =
      await this.freelanceRepository.getFreelanceById(freelanceId);
    const { password_hashed, ...freelanceSafe } = freelance || {};

    const project = await this.projectsRepository.getProjectById(
      updated.project_id,
    );

    return {
      ...updated,
      freelance: freelanceSafe,
      project: project || undefined,
    };
  }

  /**
   * Check if an application exists for a freelance on a specific project
   * @param freelanceId - Freelance UUID
   * @param projectId - Project UUID
   * @param statuses - Optional array of statuses to filter
   * @returns The existing application or null
   */
  async getApplicationByFreelanceAndProject(
    freelanceId: string,
    projectId: string,
    statuses?: ApplicationStatus[],
  ): Promise<Application | null> {
    return this.repository.getApplicationByFreelanceAndProject(
      freelanceId,
      projectId,
      statuses,
    );
  }

  /**
   * Initialize negotiation by creating a conversation for the application
   * @param applicationId - Application UUID
   * @returns The created conversation with details
   */
  async initializeNegotiation(applicationId: string): Promise<any> {
    // Récupérer la candidature
    const application = await this.repository.getApplicationById(applicationId);
    if (!application) {
      throw new Error("Candidature non trouvée");
    }

    // Récupérer le projet pour avoir l'ID de l'entreprise
    const project = await this.projectsRepository.getProjectById(
      application.project_id,
    );
    if (!project || !project.company?.id) {
      throw new Error("Projet ou entreprise non trouvé");
    }

    // Créer ou récupérer la conversation
    try {
      const conversation =
        await this.conversationService.createOrGetConversation({
          freelanceId: application.freelance_id,
          companyId: project.company.id,
          applicationId: application.id,
        });

      console.log(
        `✅ Négociation initialisée pour la candidature: ${applicationId}`,
      );

      const updateApplication = await this.repository.updateApplicationStatus(
        application.id,
        ApplicationStatus.UNDER_REVIEW,
        new Date(),
      );

      return conversation;
    } catch (conversationError) {
      console.error(
        `❌ Erreur lors de l'initialisation de la négociation pour la candidature ${applicationId}:`,
        conversationError,
      );
      throw new Error("Impossible d'initialiser la négociation");
    }
  }
}
