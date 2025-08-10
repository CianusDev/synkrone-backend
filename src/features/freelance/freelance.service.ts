import { Freelance } from "./freelance.model";
import { FreelanceRepository } from "./freelance.repository";

export class FreelanceService {
  constructor(private readonly freelanceRepository: FreelanceRepository) {}

  async createFreelance(data: Partial<Freelance>): Promise<Freelance> {
    return this.freelanceRepository.createFreelance(data);
  }

  async getFreelanceById(id: string): Promise<Freelance | null> {
    return this.freelanceRepository.getFreelanceById(id);
  }

  async updateFreelanceProfile(
    id: string,
    data: Partial<Freelance>,
  ): Promise<Freelance | null> {
    return this.freelanceRepository.updateFreelanceProfile(id, data);
  }
}
