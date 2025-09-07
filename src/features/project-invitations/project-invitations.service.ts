import { ProjectInvitationsRepository } from "./project-invitations.repository";
import {
  ProjectInvitation,
  InvitationStatus,
} from "./project-invitations.model";
import { FreelanceRepository } from "../freelance/freelance.repository";
import { ProjectsRepository } from "../projects/projects.repository";
import { CompanyRepository } from "../company/company.repository";

export class ProjectInvitationsService {
  private readonly repository: ProjectInvitationsRepository;
  private readonly freelancesRepository: FreelanceRepository;
  private readonly projectsRepository: ProjectsRepository;
  private readonly companyRepository: CompanyRepository;

  constructor() {
    this.repository = new ProjectInvitationsRepository();
    this.freelancesRepository = new FreelanceRepository();
    this.projectsRepository = new ProjectsRepository();
    this.companyRepository = new CompanyRepository();
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
}
