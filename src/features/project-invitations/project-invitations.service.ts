import { ProjectInvitationsRepository } from "./project-invitations.repository";
import {
  ProjectInvitation,
  InvitationStatus,
} from "./project-invitations.model";
import { FreelanceRepository } from "../freelance/freelance.repository";
import { ProjectsRepository } from "../projects/projects.repository";
import { CompanyRepository } from "../company/company.repository";
import { ApplicationsService } from "../applications/applications.service";
import { NotificationRepository } from "../notifications/notification.repository";
import { UserNotificationService } from "../notifications/user-notifications/user-notification.service";
import { NotificationTypeEnum } from "../notifications/notification.model";

export class ProjectInvitationsService {
  private readonly repository: ProjectInvitationsRepository;
  private readonly freelancesRepository: FreelanceRepository;
  private readonly projectsRepository: ProjectsRepository;
  private readonly companyRepository: CompanyRepository;
  private readonly applicationsService: ApplicationsService;
  private readonly notificationRepository: NotificationRepository;
  private readonly userNotificationService: UserNotificationService;

  constructor() {
    this.repository = new ProjectInvitationsRepository();
    this.freelancesRepository = new FreelanceRepository();
    this.projectsRepository = new ProjectsRepository();
    this.companyRepository = new CompanyRepository();
    this.applicationsService = new ApplicationsService();
    this.notificationRepository = new NotificationRepository();
    this.userNotificationService = new UserNotificationService();
  }

  /**
   * Crée une nouvelle invitation de projet
   * @param data - Données de l'invitation
   * @returns L'invitation créée
   */
  async createInvitation(
    data: Partial<ProjectInvitation>,
  ): Promise<ProjectInvitation> {
    // 1. Vérifier l'unicité de l'invitation
    const existing = await this.repository.getInvitationsWithFilters({
      projectId: data.project_id,
      freelanceId: data.freelance_id,
      companyId: data.company_id,
      limit: 1,
      page: 1,
    });
    if (existing.total > 0) {
      throw new Error(
        "Une invitation existe déjà pour ce projet et ce freelance.",
      );
    }

    // 2. (Optionnel) Vérifier l'existence du projet, freelance, company
    // Exemple :
    const project = await this.projectsRepository.getProjectById(
      data.project_id || "",
    );
    if (!project) throw new Error("Projet introuvable.");
    const freelance = await this.freelancesRepository.getFreelanceById(
      data.freelance_id || "",
    );
    if (!freelance) throw new Error("Freelance introuvable.");
    const company = await this.companyRepository.getCompanyById(
      data.company_id || "",
    );
    if (!company) throw new Error("Entreprise introuvable.");

    // 3. Créer l'invitation
    return this.repository.createInvitation(data);
  }

  /**
   * Récupère une invitation par son ID
   * @param id - UUID de l'invitation
   * @returns L'invitation ou null si non trouvée
   */
  async getInvitationById(id: string): Promise<ProjectInvitation | null> {
    return this.repository.getInvitationById(id);
  }

  /**
   * Récupère les invitations envoyées à un freelance avec pagination
   */
  async getInvitationsByFreelanceId(
    freelanceId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: ProjectInvitation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.repository.getInvitationsByFreelanceId(
      freelanceId,
      page,
      limit,
    );
  }

  /**
   * Récupère les invitations envoyées par une entreprise avec pagination
   */
  async getInvitationsByCompanyId(
    companyId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: ProjectInvitation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.repository.getInvitationsByCompanyId(companyId, page, limit);
  }

  /**
   * Récupère les invitations pour un projet donné avec pagination
   */
  async getInvitationsByProjectId(
    projectId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: ProjectInvitation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.repository.getInvitationsByProjectId(projectId, page, limit);
  }

  /**
   * Met à jour le statut d'une invitation
   */
  async updateInvitationStatus(
    id: string,
    status: InvitationStatus,
    respondedAt?: Date,
  ): Promise<ProjectInvitation | null> {
    return this.repository.updateInvitationStatus(id, status, respondedAt);
  }

  /**
   * Supprime une invitation par son ID
   */
  async deleteInvitation(id: string): Promise<boolean> {
    return this.repository.deleteInvitation(id);
  }

  /**
   * Récupère les invitations avec filtres et pagination
   */
  async getInvitationsWithFilters(params: {
    status?: InvitationStatus;
    freelanceId?: string;
    companyId?: string;
    projectId?: string;
    limit?: number;
    page?: number;
  }): Promise<{
    data: ProjectInvitation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.repository.getInvitationsWithFilters(params);
    const totalPages = Math.ceil(result.total / (result.limit || 1));
    return {
      ...result,
      totalPages,
    };
  }

  /**
   * Accepte une invitation et crée automatiquement une candidature
   * @param invitationId - UUID de l'invitation
   * @param freelanceId - UUID du freelance qui accepte
   * @returns L'invitation mise à jour et la candidature créée
   */
  async acceptInvitation(
    invitationId: string,
    freelanceId: string,
  ): Promise<{
    invitation: ProjectInvitation;
    application: any;
  }> {
    // 1. Récupérer l'invitation
    const invitation = await this.repository.getInvitationById(invitationId);
    if (!invitation) {
      throw new Error("Invitation non trouvée");
    }

    // 2. Vérifier que l'invitation appartient au freelance
    if (invitation.freelance_id !== freelanceId) {
      throw new Error("Vous n'êtes pas autorisé à accepter cette invitation");
    }

    // 3. Vérifier que l'invitation peut être acceptée
    if (
      invitation.status !== InvitationStatus.SENT &&
      invitation.status !== InvitationStatus.VIEWED
    ) {
      throw new Error("Cette invitation ne peut plus être acceptée");
    }

    // 4. Vérifier si l'invitation n'a pas expiré
    if (invitation.expires_at && new Date() > invitation.expires_at) {
      throw new Error("Cette invitation a expiré");
    }

    // 5. Mettre à jour l'invitation à "accepted"
    const updatedInvitation = await this.repository.updateInvitationStatus(
      invitationId,
      InvitationStatus.ACCEPTED,
      new Date(),
    );

    if (!updatedInvitation) {
      throw new Error("Erreur lors de la mise à jour de l'invitation");
    }

    // 6. Vérifier s'il existe déjà une candidature pour ce freelance sur ce projet
    const existingApplication =
      await this.applicationsService.getApplicationByFreelanceAndProject(
        freelanceId,
        invitation.project_id,
      );

    let application;
    if (existingApplication) {
      // Si une candidature existe déjà, on la réutilise
      application = existingApplication;
      console.log(
        `✅ Candidature existante trouvée (${existingApplication.status}) pour l'invitation ${invitationId}`,
      );
    } else {
      // Sinon, créer automatiquement une candidature
      try {
        application = await this.applicationsService.createApplication({
          project_id: invitation.project_id,
          freelance_id: freelanceId,
          proposed_rate: 0, // Tarif par défaut, peut être modifié après
          cover_letter:
            "Candidature créée automatiquement suite à l'acceptation d'une invitation.",
        });
        console.log(
          `✅ Nouvelle candidature créée pour l'invitation ${invitationId}`,
        );
      } catch (applicationError) {
        console.error(
          `❌ Erreur lors de la création de la candidature pour l'invitation ${invitationId}:`,
          applicationError,
        );
        // Si la création de candidature échoue, on annule la mise à jour de l'invitation
        await this.repository.updateInvitationStatus(
          invitationId,
          InvitationStatus.SENT,
          new Date(),
        );
        throw new Error(
          "Impossible de créer la candidature. L'invitation n'a pas été acceptée.",
        );
      }
    }

    // 7. Récupérer les informations pour la notification
    const project = await this.projectsRepository.getProjectById(
      invitation.project_id,
    );
    const freelance =
      await this.freelancesRepository.getFreelanceById(freelanceId);

    // 8. Notifier l'entreprise que l'invitation a été acceptée
    if (project && project.company?.id && freelance) {
      const notification = await this.notificationRepository.createNotification(
        {
          title: "Invitation acceptée",
          message: `${freelance.firstname} ${freelance.lastname} a accepté votre invitation pour le projet "${project.title}" et a postulé automatiquement.`,
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

    return {
      invitation: updatedInvitation,
      application,
    };
  }

  /**
   * Décline une invitation
   * @param invitationId - UUID de l'invitation
   * @param freelanceId - UUID du freelance qui décline
   * @returns L'invitation mise à jour
   */
  async declineInvitation(
    invitationId: string,
    freelanceId: string,
  ): Promise<ProjectInvitation | null> {
    // 1. Récupérer l'invitation
    const invitation = await this.repository.getInvitationById(invitationId);
    if (!invitation) {
      return null;
    }

    // 2. Vérifier que l'invitation appartient au freelance
    if (invitation.freelance_id !== freelanceId) {
      throw new Error("Vous n'êtes pas autorisé à décliner cette invitation");
    }

    // 3. Vérifier que l'invitation peut être déclinée
    if (
      invitation.status !== InvitationStatus.SENT &&
      invitation.status !== InvitationStatus.VIEWED
    ) {
      throw new Error("Cette invitation ne peut plus être déclinée");
    }

    // 4. Mettre à jour l'invitation à "declined"
    const updatedInvitation = await this.repository.updateInvitationStatus(
      invitationId,
      InvitationStatus.DECLINED,
      new Date(),
    );

    // 5. Récupérer les informations pour la notification
    const project = await this.projectsRepository.getProjectById(
      invitation.project_id,
    );
    const freelance =
      await this.freelancesRepository.getFreelanceById(freelanceId);

    // 6. Notifier l'entreprise que l'invitation a été déclinée
    if (project && project.company?.id && freelance) {
      const notification = await this.notificationRepository.createNotification(
        {
          title: "Invitation déclinée",
          message: `${freelance.firstname} ${freelance.lastname} a décliné votre invitation pour le projet "${project.title}".`,
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

    return updatedInvitation;
  }
}
