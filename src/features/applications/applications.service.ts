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
    // Remplacer freelance_id par l'objet freelance
    const freelance = await this.freelanceRepository.getFreelanceById(
      application.freelance_id,
    );
    // Exclure le mot de passe hashé
    const { password_hashed, ...freelanceSafe } = freelance || {};
    return {
      ...application,
      freelance: freelanceSafe,
    };
  }

  /**
   * Get all applications for a given freelance
   * @param freelanceId - Freelance UUID
   * @returns Array of applications
   */
  async getApplicationsByFreelanceId(freelanceId: string): Promise<any[]> {
    const applications =
      await this.repository.getApplicationsByFreelanceId(freelanceId);
    const freelance =
      await this.freelanceRepository.getFreelanceById(freelanceId);
    const { password_hashed, ...freelanceSafe } = freelance || {};
    return applications.map((app) => ({
      ...app,
      freelance: freelanceSafe,
    }));
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
    // Retourner la candidature mise à jour avec l'objet freelance (sans password_hashed)
    const freelance =
      await this.freelanceRepository.getFreelanceById(freelanceId);
    const { password_hashed, ...freelanceSafe } = freelance || {};
    return {
      ...updated,
      freelance: freelanceSafe,
    };
  }

  /**
   * Get all applications for a given project
   * @param projectId - Project UUID
   * @returns Array of applications
   */
  async getApplicationsByProjectId(projectId: string): Promise<any[]> {
    const applications =
      await this.repository.getApplicationsByProjectId(projectId);
    // Pour chaque application, inclure l'objet freelance
    return await Promise.all(
      applications.map(async (app) => {
        const freelance = await this.freelanceRepository.getFreelanceById(
          app.freelance_id,
        );
        const { password_hashed, ...freelanceSafe } = freelance || {};
        return {
          ...app,
          freelance: freelanceSafe,
        };
      }),
    );
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
   * @returns { data, total, page, limit, totalPages }
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
  }> {
    const result = await this.repository.getApplicationsWithFilters(params);
    const totalPages = Math.ceil(result.total / (result.limit || 1));
    // Pour chaque application, inclure l'objet freelance
    const dataWithFreelance = await Promise.all(
      result.data.map(async (app) => {
        const freelance = await this.freelanceRepository.getFreelanceById(
          app.freelance_id,
        );
        const { password_hashed, ...freelanceSafe } = freelance || {};
        return {
          ...app,
          freelance: freelanceSafe,
        };
      }),
    );
    return {
      ...result,
      data: dataWithFreelance,
      totalPages,
    };
  }
}
