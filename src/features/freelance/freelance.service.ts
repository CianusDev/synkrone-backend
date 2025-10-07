import { FreelanceRepository } from "./freelance.repository";
import { Freelance } from "./freelance.model";
import { FreelanceSkillsService } from "../freelance-skills/freelance-skills.service";
import { FreelanceSkillsRepository } from "../freelance-skills/freelance-skills.repository";
import { SkillRepository } from "../skills/skill.repository";
import { FreelanceSkills } from "../freelance-skills/freelance-skills.model";

export class FreelanceService {
  private readonly repository: FreelanceRepository;
  private readonly freelanceSkillsService: FreelanceSkillsService;

  constructor() {
    this.repository = new FreelanceRepository();
    this.freelanceSkillsService = new FreelanceSkillsService(
      new FreelanceSkillsRepository(),
      new SkillRepository(),
    );
  }

  async createFreelance(data: Partial<Freelance>): Promise<Freelance> {
    // Ici, on pourrait ajouter des vérifications supplémentaires (unicité email, etc.)
    return this.repository.createFreelance(data);
  }

  async getFreelanceById(id: string): Promise<Freelance | null> {
    const freelance = await this.repository.getFreelanceById(id);
    const isBlocked = await this.repository.isFreelanceBlocked(id);
    if (!freelance) return null;
    const skills =
      await this.freelanceSkillsService.getFreelanceSkillsByFreelanceId(id);
    return { ...freelance, skills, isBlocked };
  }

  async getFreelanceByEmail(email: string): Promise<Freelance | null> {
    const freelance = await this.repository.getFreelanceByEmail(email);
    if (!freelance) return null;
    const skills =
      await this.freelanceSkillsService.getFreelanceSkillsByFreelanceId(
        freelance.id,
      );
    return { ...freelance, skills };
  }

  async updateFreelanceProfile(
    id: string,
    data: Partial<Freelance>,
  ): Promise<Freelance | null> {
    return this.repository.updateFreelanceProfile(id, data);
  }

  async verifyEmail(email: string): Promise<Freelance | null> {
    return this.repository.verifyEmail(email);
  }

  async updateFreelancePassword(
    email: string,
    password_hashed: string,
  ): Promise<Freelance | null> {
    return this.repository.updateFreelancePassword(email, password_hashed);
  }

  async updateFreelanceFirstLogin(id: string): Promise<Freelance | null> {
    return this.repository.updateFreelanceFirstLogin(id);
  }

  /**
   * Récupère une liste paginée de freelances avec recherche et filtres.
   * @param params - { page, limit, search, skills, experience, tjmMin, tjmMax }
   * @returns { data: Freelance[], total: number, page: number, limit: number }
   */
  async getFreelancesWithFilters(params: {
    page?: number;
    limit?: number;
    search?: string;
    skills?: string[];
    experience?: string[];
    tjmMin?: number;
    tjmMax?: number;
  }): Promise<{
    data: Freelance[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.repository.getFreelancesWithFilters(params);
    const totalPages = Math.ceil(result.total / (result.limit || 1));
    // Enrich each freelance with their skills
    const dataWithSkills = await Promise.all(
      result.data.map(async (freelance) => {
        const skills =
          await this.freelanceSkillsService.getFreelanceSkillsByFreelanceId(
            freelance.id,
          );
        return { ...freelance, skills };
      }),
    );
    return {
      ...result,
      data: dataWithSkills,
      totalPages,
    };
  }
}
