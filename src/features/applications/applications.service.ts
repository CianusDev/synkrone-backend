import { ApplicationsRepository } from "./applications.repository";
import { Application, ApplicationStatus } from "./applications.model";
import { FreelanceRepository } from "../freelance/freelance.repository";
import { ProjectsRepository } from "../projects/projects.repository";
import { Freelance } from "../freelance/freelance.model";
import { NotificationRepository } from "../notifications/notification.repository";
import { UserNotificationRepository } from "../notifications/user-notifications/user-notification.repository";
import { NotificationTypeEnum } from "../notifications/notification.model";
import { UserNotificationService } from "../notifications/user-notifications/user-notification.service";

export class ApplicationsService {
  private readonly repository: ApplicationsRepository;
  private readonly freelanceRepository: FreelanceRepository;
  private readonly projectsRepository: ProjectsRepository;
  private readonly userNotificationService: UserNotificationService;
  private readonly notificationRepository = new NotificationRepository();

  constructor() {
    this.repository = new ApplicationsRepository();
    this.freelanceRepository = new FreelanceRepository();
    this.projectsRepository = new ProjectsRepository();
    this.userNotificationService = new UserNotificationService();
    this.notificationRepository = new NotificationRepository();
  }

  /**
   * Create a new application (candidature)
   * @param data - Partial application data
   * @returns The created application
   */
  async createApplication(data: Partial<Application>): Promise<Application> {
    // 1. Vérifier l'unicité de la candidature
    const existing = await this.repository.getApplicationsWithFilters({
      projectId: data.project_id,
      freelanceId: data.freelance_id,
      status: ApplicationStatus.SUBMITTED, // ou tous statuts sauf withdrawn/rejected
      limit: 1,
      page: 1,
    });
    if (existing.total > 0) {
      throw new Error(
        "Une candidature existe déjà pour ce projet et ce freelance.",
      );
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
