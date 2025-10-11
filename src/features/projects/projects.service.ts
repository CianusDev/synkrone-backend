import { ProjectsRepository } from "./projects.repository";
import { Project, ProjectStatus, TypeWork } from "./projects.model";
import { ProjectSkillsService } from "../project-skills/project-skills.service";
import { ApplicationsRepository } from "../applications/applications.repository";
import { ApplicationStatus } from "../applications/applications.model";
export class ProjectsService {
  private readonly repository: ProjectsRepository;
  private readonly projectSkillsService: ProjectSkillsService;
  private readonly applicationsRepository: ApplicationsRepository;

  constructor() {
    this.repository = new ProjectsRepository();
    this.projectSkillsService = new ProjectSkillsService();
    this.applicationsRepository = new ApplicationsRepository();
  }

  /**
   * Crée un projet
   */
  async createProject(data: {
    title: string;
    description?: string;
    budgetMin?: number;
    budgetMax?: number;
    location?: string;
    deadline?: string;
    status?: ProjectStatus;
    typeWork?: TypeWork;
    categoryId?: string;
    companyId: string;
    durationDays?: number;
    levelExperience?: string;
    allowMultipleApplications?: boolean;
    tjmProposed?: number;
  }): Promise<Project> {
    // 1. Vérifier la catégorie si fournie
    if (data.categoryId) {
      const categoryExists = await this.repository.categoryExists?.(
        data.categoryId,
      );
      if (typeof categoryExists === "boolean" && !categoryExists) {
        throw new Error("Catégorie non trouvée");
      }
    }

    // 2. Vérifier la company
    const companyExists = await this.repository.companyExists?.(data.companyId);
    if (typeof companyExists === "boolean" && !companyExists) {
      throw new Error("Entreprise non trouvée");
    }

    // 3. Vérifier les budgets
    if (data.budgetMin !== undefined && data.budgetMin <= 0) {
      throw new Error("Le budget minimum doit être positif");
    }
    if (data.budgetMax !== undefined && data.budgetMax <= 0) {
      throw new Error("Le budget maximum doit être positif");
    }
    if (
      data.budgetMin !== undefined &&
      data.budgetMax !== undefined &&
      data.budgetMax < data.budgetMin
    ) {
      throw new Error(
        "Le budget maximum doit être supérieur ou égal au budget minimum",
      );
    }

    // 4. Vérifier la deadline
    if (data.deadline && new Date(data.deadline) < new Date()) {
      throw new Error("La deadline doit être une date future");
    }

    // 5. Statut par défaut
    const status = data.status ?? ProjectStatus.DRAFT;

    // 6. Créer le projet
    return this.repository.createProject({ ...data, status });
  }

  /**
   * Récupère un projet par son id
   */
  async getProjectById(
    id: string,
    freelanceId?: string,
  ): Promise<Project | null> {
    // Récupère le projet principal (avec counts)
    const project = await this.repository.getProjectById(id);
    if (!project) return null;

    // Récupère les compétences du projet
    const skills = await this.projectSkillsService.getSkillsByProjectId(id);
    project.skills = skills;

    // Ajout de isApplied et applicationId si freelanceId fourni
    if (freelanceId) {
      const applications =
        await this.applicationsRepository.getApplicationsWithFilters({
          projectId: id,
          freelanceId,
          limit: 1,
          page: 1,
          status: ApplicationStatus.SUBMITTED,
        });
      project.isApplied = applications.total > 0;
      project.applicationId = project.isApplied
        ? applications.data[0]?.id
        : undefined;

      // Vérifie si le freelance a été accepté
      const acceptedApplications =
        await this.applicationsRepository.getApplicationsWithFilters({
          projectId: id,
          freelanceId,
          limit: 1,
          page: 1,
          status: ApplicationStatus.ACCEPTED,
        });
      project.isAccepted = acceptedApplications.total > 0;
    }

    // Récupère le contrat actif si freelanceId fourni
    if (freelanceId) {
      try {
        const contract = await this.repository.getProjectContractByFreelance(
          id,
          freelanceId,
        );

        if (contract) {
          project.contract = contract;
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du contrat:", error);
      }
    }

    // Récupère tous les livrables du projet (tous contrats confondus)
    try {
      const deliverables = await this.repository.getDeliverablesByProject(id);
      project.deliverables = deliverables;
      project.deliverableCount = deliverables.length;
    } catch (error) {
      console.error("Erreur lors de la récupération des livrables:", error);
    }

    // Récupère les projets récemment publiés (hors celui en cours)
    const recentProjects =
      await this.repository.getRecentlyPublishedProjects(5);
    project.recentProjects = recentProjects.filter((p) => p.id !== id);

    // Les champs applicationsCount et invitationsCount sont déjà présents
    return project;
  }

  /**
   * Met à jour un projet
   */
  async updateProject(
    id: string,
    data: Partial<Omit<Project, "id" | "createdAt" | "updatedAt">>,
  ): Promise<Project | null> {
    // Logique métier additionnelle possible ici
    // Validation des budgets si présents
    if (data.budgetMin !== undefined && data.budgetMin <= 0) {
      throw new Error("Le budget minimum doit être positif");
    }
    if (data.budgetMax !== undefined && data.budgetMax <= 0) {
      throw new Error("Le budget maximum doit être positif");
    }
    if (
      data.budgetMin !== undefined &&
      data.budgetMax !== undefined &&
      data.budgetMax < data.budgetMin
    ) {
      throw new Error(
        "Le budget maximum doit être supérieur ou égal au budget minimum",
      );
    }
    // Validation de la deadline si présente
    if (data.deadline && new Date(data.deadline) < new Date()) {
      throw new Error("La deadline doit être une date future");
    }
    return this.repository.updateProject(id, data);
  }

  /**
   * Publier un projet (changer son statut à 'published')
   */
  async publishProject(id: string): Promise<Project | null> {
    // Vérifier que le projet existe
    const project = await this.getProjectById(id);
    if (!project) {
      throw new Error("Projet non trouvé");
    }
    // Si le projet est déjà publié, retourner le projet existant
    if (project.status === ProjectStatus.PUBLISHED) {
      return project;
    }
    // Mettre à jour le statut
    return this.repository.updateProject(id, {
      publishedAt: new Date().toISOString(),
      status: ProjectStatus.PUBLISHED,
    });
  }

  /**
   * Supprime un projet
   */
  async deleteProject(id: string): Promise<boolean> {
    return this.repository.deleteProject(id);
  }

  /**
   * Liste les projets (optionnel: filtres)
   */
  async listProjects(params?: {
    status?: ProjectStatus;
    typeWork?: TypeWork;
    companyId?: string;
    categoryId?: string;
    search?: string;
    page?: number;
    limit?: number;
    offset?: number;
    freelanceId?: string; // <-- Ajouté
  }): Promise<{
    data: Project[];
    total: number;
    limit: number;
    offset: number;
    totalPages: number;
    page?: number;
  }> {
    let finalOffset = params?.offset ?? 0;
    const finalLimit = params?.limit ?? 10;

    if (params?.page && params.page > 0) {
      finalOffset = (params.page - 1) * finalLimit;
    }

    const result = await this.repository.listProjects({
      ...params,
      limit: finalLimit,
      offset: finalOffset,
    });

    // Ajouter les skills à chaque projet
    const projectsWithSkills = await Promise.all(
      result.data.map(async (project) => {
        const skills = await this.projectSkillsService.getSkillsByProjectId(
          project.id,
        );
        return { ...project, skills };
      }),
    );

    // Ajout de isApplied si freelanceId fourni
    let projectsWithApplied = projectsWithSkills;
    if (params?.freelanceId) {
      projectsWithApplied = await Promise.all(
        projectsWithSkills.map(async (project) => {
          const applications =
            await this.applicationsRepository.getApplicationsWithFilters({
              projectId: project.id,
              freelanceId: params.freelanceId,
              limit: 1,
              page: 1,
            });
          // Vérifie si le freelance a été accepté
          const acceptedApplications =
            await this.applicationsRepository.getApplicationsWithFilters({
              projectId: project.id,
              freelanceId: params.freelanceId,
              limit: 1,
              page: 1,
              status: ApplicationStatus.ACCEPTED,
            });
          return {
            ...project,
            isApplied: applications.total > 0,
            isAccepted: acceptedApplications.total > 0,
          };
        }),
      );
    }

    const totalPages = Math.ceil(result.total / finalLimit);
    const currentPage =
      params?.page ?? Math.floor(finalOffset / finalLimit) + 1;

    return {
      ...result,
      data: projectsWithApplied,
      totalPages,
      page: currentPage,
    };
  }

  /**
   * Récupère les missions (projets avec candidatures acceptées) d'un freelance
   */
  async getFreelanceMissions(
    freelanceId: string,
    params?: {
      search?: string;
      page?: number;
      limit?: number;
      offset?: number;
    },
  ): Promise<{
    data: Project[];
    total: number;
    limit: number;
    offset: number;
    totalPages: number;
    page?: number;
  }> {
    let finalOffset = params?.offset ?? 0;
    const finalLimit = params?.limit ?? 10;

    if (params?.page && params.page > 0) {
      finalOffset = (params.page - 1) * finalLimit;
    }

    const result = await this.repository.getFreelanceMissions(freelanceId, {
      ...params,
      limit: finalLimit,
      offset: finalOffset,
    });

    // Ajouter les skills à chaque projet
    const projectsWithSkills = await Promise.all(
      result.data.map(async (project) => {
        const skills = await this.projectSkillsService.getSkillsByProjectId(
          project.id,
        );
        return { ...project, skills };
      }),
    );

    const totalPages = Math.ceil(result.total / finalLimit);
    const currentPage =
      params?.page ?? Math.floor(finalOffset / finalLimit) + 1;

    return {
      ...result,
      data: projectsWithSkills,
      totalPages,
      page: currentPage,
    };
  }
}
