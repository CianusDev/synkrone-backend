import { ProjectCategory } from "./project-categories.model";
import { ProjectCategoriesRepository } from "./project-categories.repository";

export class ProjectCategoriesService {
  private readonly repository: ProjectCategoriesRepository;

  constructor() {
    this.repository = new ProjectCategoriesRepository();
  }

  async createCategory(
    data: Partial<ProjectCategory>,
  ): Promise<ProjectCategory> {
    if (!data.name) {
      throw new Error("Le nom de la catégorie est requis.");
    }
    return this.repository.createCategory(data);
  }

  async getAllCategories(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    data: ProjectCategory[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Valeurs par défaut
    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit = params?.limit && params.limit > 0 ? params.limit : 10;
    const search = params?.search ? params.search : "";

    // Calcul de l'offset
    const offset = (page - 1) * limit;

    // Appel du repository avec recherche et pagination
    const [data, total] = await this.repository.getAllCategories({
      limit,
      offset,
      search,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getCategoryById(id: string): Promise<ProjectCategory | null> {
    return this.repository.getCategoryById(id);
  }

  async updateCategory(
    id: string,
    data: Partial<ProjectCategory>,
  ): Promise<ProjectCategory | null> {
    return this.repository.updateCategory(id, data);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.repository.deleteCategory(id);
  }
}
