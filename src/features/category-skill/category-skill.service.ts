import { CategorySkillRepository } from "./category-skill.repository";
import { CategorySkill } from "./category-skill.model";

export class CategorySkillService {
  private readonly repository: CategorySkillRepository;

  constructor() {
    this.repository = new CategorySkillRepository();
  }

  async createCategorySkill(
    data: Partial<CategorySkill>,
  ): Promise<CategorySkill> {
    if (!data.name || !data.slug) {
      throw new Error("Le nom et le slug de la catégorie sont requis.");
    }
    // Optionally, you could check for slug uniqueness here
    return this.repository.createCategorySkill(data);
  }

  async updateCategorySkill(
    id: string,
    data: Partial<CategorySkill>,
  ): Promise<void> {
    // Optionally, you could check if the category exists before updating
    await this.repository.updateCategorySkill(id, data);
  }

  async getCategorySkillById(id: string): Promise<CategorySkill | null> {
    return this.repository.getCategorySkillById(id);
  }

  async getCategorySkillBySlug(slug: string): Promise<CategorySkill | null> {
    return this.repository.getCategorySkillBySlug(slug);
  }

  async getAllCategorySkills(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    data: CategorySkill[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit = params?.limit && params.limit > 0 ? params.limit : 10;
    const search = params?.search ? params.search : "";

    const offset = (page - 1) * limit;

    const [data, total] = await this.repository.getAllCategorySkills({
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

  async deleteCategorySkill(id: string): Promise<void> {
    await this.repository.deleteCategorySkill(id);
  }
}
