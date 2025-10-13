import { FreelanceRepository } from "./freelance.repository";
import { Freelance } from "./freelance.model";
import { FreelanceSkillsService } from "../freelance-skills/freelance-skills.service";
import { FreelanceSkillsRepository } from "../freelance-skills/freelance-skills.repository";
import { SkillRepository } from "../skills/skill.repository";
import { FreelanceSkills } from "../freelance-skills/freelance-skills.model";
import { EvaluationService } from "../evaluation/evaluation.service";
import { UserType } from "../evaluation/evaluation.model";
import { ContractsRepository } from "../contracts/contracts.repository";
import { ContractStatus } from "../contracts/contracts.model";

export class FreelanceService {
  private readonly repository: FreelanceRepository;
  private readonly freelanceSkillsService: FreelanceSkillsService;
  private readonly evaluationService: EvaluationService;
  private readonly contractsRepository: ContractsRepository;

  constructor() {
    this.repository = new FreelanceRepository();
    this.freelanceSkillsService = new FreelanceSkillsService(
      new FreelanceSkillsRepository(),
      new SkillRepository(),
    );
    this.evaluationService = new EvaluationService();
    this.contractsRepository = new ContractsRepository();
  }

  async createFreelance(data: Partial<Freelance>): Promise<Freelance> {
    // Ici, on pourrait ajouter des vérifications supplémentaires (unicité email, etc.)
    return this.repository.createFreelance(data);
  }

  async getFreelanceById(id: string): Promise<Freelance | null> {
    const freelance = await this.repository.getFreelanceById(id);
    const isBlocked = await this.repository.isFreelanceBlocked(id);
    if (!freelance) return null;

    // Récupérer les compétences
    const skills =
      await this.freelanceSkillsService.getFreelanceSkillsByFreelanceId(id);

    // Récupérer les évaluations reçues (avec pagination limitée pour le profil)
    const evaluationsResult =
      await this.evaluationService.getEvaluationsByEvaluated(
        id,
        UserType.FREELANCE,
        1,
        10,
      );

    // Récupérer les statistiques d'évaluation
    const evaluationStats = await this.evaluationService.getUserEvaluationStats(
      id,
      UserType.FREELANCE,
    );

    // Récupérer les missions réalisées (contrats terminés)
    const completedMissions = await this.getCompletedMissions(id);

    return {
      ...freelance,
      skills,
      isBlocked,
      evaluations: {
        stats: evaluationStats,
        recent: evaluationsResult.data,
        total: evaluationsResult.total,
      },
      completedMissions,
    };
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

  /**
   * Récupère les missions réalisées par un freelance (projets avec contrats terminés)
   */
  private async getCompletedMissions(freelanceId: string): Promise<any[]> {
    try {
      // Récupérer tous les contrats terminés du freelance
      const contractsResult =
        await this.contractsRepository.getContractsWithFilters({
          freelanceId,
          status: ContractStatus.COMPLETED,
          limit: 50, // Limite pour éviter trop de données
        });

      // Formater les données pouCr ne retourner que les infos essentielles
      const missions = contractsResult.data.map((contract) => ({
        id: contract.id,
        project: contract.project
          ? {
              id: contract.project.id,
              title: contract.project.title,
              description: contract.project.description,
              budget: {
                min: contract.project.budgetMin,
                max: contract.project.budgetMax,
              },
              company: {
                id: contract.company_id,
                name: contract.company?.company_name || null,
                logo_url: contract.company?.logo_url || null,
                industry: contract.company?.industry || null,
              },
            }
          : null,
        contract: {
          paymentMode: contract.payment_mode,
          totalAmount: contract.total_amount,
          tjm: contract.tjm,
          startDate: contract.start_date,
          endDate: contract.end_date,
          completedAt: contract.created_at, // Approximation, pourrait être amélioré
        },
      }));

      return missions;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des missions terminées:",
        error,
      );
      return [];
    }
  }
}
