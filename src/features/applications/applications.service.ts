import { ApplicationsRepository } from "./applications.repository";
import { Application, ApplicationStatus } from "./applications.model";
import { FreelanceRepository } from "../freelance/freelance.repository";
import { ProjectsRepository } from "../projects/projects.repository";

export class ApplicationsService {
  private readonly repository: ApplicationsRepository;
  private readonly freelanceRepository: FreelanceRepository;
  private readonly projectsRepository: ProjectsRepository;

  constructor() {
    this.repository = new ApplicationsRepository();
    this.freelanceRepository = new FreelanceRepository();
    this.projectsRepository = new ProjectsRepository();
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

    // 3. Créer la candidature
    return this.repository.createApplication(data);
  }

  /**
   * Get an application by its ID
   * @param id - Application UUID
   * @returns The application or null if not found
   */
  async getApplicationById(id: string): Promise<Application | null> {
    return this.repository.getApplicationById(id);
  }

  /**
   * Get all applications for a given freelance
   * @param freelanceId - Freelance UUID
   * @returns Array of applications
   */
  async getApplicationsByFreelanceId(
    freelanceId: string,
  ): Promise<Application[]> {
    return this.repository.getApplicationsByFreelanceId(freelanceId);
  }

  /**
   * Get all applications for a given project
   * @param projectId - Project UUID
   * @returns Array of applications
   */
  async getApplicationsByProjectId(projectId: string): Promise<Application[]> {
    return this.repository.getApplicationsByProjectId(projectId);
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
    return {
      ...result,
      totalPages,
    };
  }
}
