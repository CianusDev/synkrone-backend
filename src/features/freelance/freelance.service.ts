import { FreelanceRepository } from "./freelance.repository";
import { Freelance } from "./freelance.model";

export class FreelanceService {
  private readonly repository: FreelanceRepository;

  constructor() {
    this.repository = new FreelanceRepository();
  }

  async createFreelance(data: Partial<Freelance>): Promise<Freelance> {
    // Ici, on pourrait ajouter des vérifications supplémentaires (unicité email, etc.)
    return this.repository.createFreelance(data);
  }

  async getFreelanceById(id: string): Promise<Freelance | null> {
    return this.repository.getFreelanceById(id);
  }

  async getFreelanceByEmail(email: string): Promise<Freelance | null> {
    return this.repository.getFreelanceByEmail(email);
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
  }> {
    return this.repository.getFreelancesWithFilters(params);
  }
}
