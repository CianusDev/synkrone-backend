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
    // 1. Vérifier s'il existe déjà une candidature acceptée pour ce freelance sur ce projet
    const acceptedApplication =
      await this.repository.getApplicationByFreelanceAndProject(
        data.freelance_id || "",
        data.project_id || "",
        [ApplicationStatus.ACCEPTED],
      );
    if (acceptedApplication) {
      throw new Error(
        "Vous avez déjà été accepté sur cette mission et ne pouvez pas repostuler.",
      );
    }

    // 2. Vérifier l'unicité des candidatures en cours (submitted/under_review)
    const pendingApplication =
      await this.repository.getApplicationByFreelanceAndProject(
        data.freelance_id || "",
        data.project_id || "",
        [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW],
      );
    if (pendingApplication) {
      if (pendingApplication.status === ApplicationStatus.SUBMITTED) {
        throw new Error("Une candidature est déjà en cours pour ce projet.");
      } else {
        throw new Error(
          "Une candidature est déjà en cours d'examen pour ce projet.",
        );
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

    // Notification de bienvenue
    // const notificationRepo = new NotificationRepository();
    // const welcomeNotification = await notificationRepo.createNotification({
    //   title: "Bienvenue sur la plateforme !",
    //   message: `Bonjour ${newFreelance.firstname}, votre compte a bien été créé. Nous vous souhaitons la bienvenue !`,
    //   type: NotificationTypeEnum.system,
    //   is_global: false,
    // });
    // if (welcomeNotification) {
    //   await this.userNotificationService.createUserNotification(
    //     newFreelance.id,
    //     welcomeNotification.id,
    //     false,
    //   );
    // }

    if (project && project.company?.id) {
      const notification = await this.notificationRepository.createNotification(
        {
          title: "Nouvelle candidature reçue",
          message: `Le freelance {{${freelance.firstname}}} {{${freelance.lastname}}} a postulé au projet {{${project.title}}}.`,
          type: NotificationTypeEnum.application,
          is_global: false,
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

    // 3.
    return this.repository.createApplication(data);
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
    // Mettre à jour le statut
    const updated = await this.repository.updateApplicationStatus(
      id,
      ApplicationStatus.WITHDRAWN,
      new Date(),
    );
    if (!updated) return null;
    // Retourner la candidature mise à jour avec l'objet freelance (sans password_hashed) et projet
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

    // Optionally, send notification if status is ACCEPTED or REJECTED
    if (
      (status === ApplicationStatus.ACCEPTED ||
        status === ApplicationStatus.REJECTED) &&
      application.project_id
    ) {
      const project = await this.projectsRepository.getProjectById(
        application.project_id,
      );
      const freelance = await this.freelanceRepository.getFreelanceById(
        application.freelance_id,
      );

      if (project && project.company?.id && freelance) {
        let notificationTitle = "";
        let notificationMessage = "";

        if (status === ApplicationStatus.ACCEPTED) {
          notificationTitle = "Candidature acceptée";
          notificationMessage = `Votre candidature au projet "${project.title}" a été acceptée.`;
        } else if (status === ApplicationStatus.REJECTED) {
          notificationTitle = "Candidature refusée";
          notificationMessage = `Votre candidature au projet "${project.title}" a été refusée.`;
        }

        const notification =
          await this.notificationRepository.createNotification({
            title: notificationTitle,
            message: notificationMessage,
            type: NotificationTypeEnum.application,
            is_global: false,
          });

        if (notification) {
          await this.userNotificationService.createUserNotification(
            freelance.id,
            notification.id,
            false,
          );
        }
      }
    }

    // Si on accepte une candidature, rejeter toutes les autres du même projet
    if (status === ApplicationStatus.ACCEPTED) {
      await this.repository.rejectOtherApplications(application.project_id, id);

      // Créer la conversation entre le freelance et la company si elle n'existe pas déjà
      const project = await this.projectsRepository.getProjectById(
        application.project_id,
      );
      if (project && project.company?.id) {
        await this.conversationService.createOrGetConversation({
          freelanceId: application.freelance_id,
          companyId: project.company.id,
          applicationId: application.id,
        });
      }

      // Notifier tous les freelances dont la candidature est rejetée automatiquement
      const projectTitle = project?.title || "ce projet";
      const rejectedApps = await this.repository.getApplicationsByProjectId(
        application.project_id,
      );
      for (const app of rejectedApps) {
        if (app.id !== id && app.status === ApplicationStatus.REJECTED) {
          // Récupère le freelance
          const freelance = await this.freelanceRepository.getFreelanceById(
            app.freelance_id,
          );
          if (freelance) {
            const notification =
              await this.notificationRepository.createNotification({
                title: "Candidature refusée",
                message: `Votre candidature au projet "${projectTitle}" a été refusée car une autre a été acceptée.`,
                type: NotificationTypeEnum.application,
                is_global: false,
              });
            if (notification) {
              await this.userNotificationService.createUserNotification(
                freelance.id,
                notification.id,
                false,
              );
            }
          }
        }
      }
    }

    return this.repository.updateApplicationStatus(id, status, responseDate);
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
}
