import { ProjectsRepository } from "./projects.repository";
import { Project, ProjectStatus, TypeWork } from "./projects.model";

export class ProjectsService {
  private readonly repository: ProjectsRepository;

  constructor() {
    this.repository = new ProjectsRepository();
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
  async getProjectById(id: string): Promise<Project | null> {
    return this.repository.getProjectById(id);
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
    // Vérifier qu'il n'est pas déjà publié
    if (project.status === ProjectStatus.PUBLISHED) {
      throw new Error("Projet déjà publié");
    }
    // Mettre à jour le statut
    return this.repository.updateProject(id, {
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
    limit?: number;
    offset?: number;
  }): Promise<{
    data: Project[];
    total: number;
    limit: number;
    offset: number;
    totalPages: number;
  }> {
    const result = await this.repository.listProjects(params);
    const totalPages = Math.ceil(result.total / (result.limit || 1));
    return {
      ...result,
      totalPages,
    };
  }
}
