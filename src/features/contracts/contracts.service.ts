import { ApplicationsRepository } from "../applications/applications.repository";
import { CompanyRepository } from "../company/company.repository";
import { FreelanceRepository } from "../freelance/freelance.repository";
import { ProjectsRepository } from "../projects/projects.repository";
import {
  Contract,
  ContractStatus,
  PaymentMode,
  CreateContractData,
} from "./contracts.model";
import { ContractsRepository } from "./contracts.repository";

export class ContractsService {
  private readonly repository: ContractsRepository;
  private readonly applicationsRepository: ApplicationsRepository;
  private readonly freelanceRepository: FreelanceRepository;
  private readonly projectsRepository: ProjectsRepository;
  private readonly companyRepository: CompanyRepository;

  constructor() {
    this.repository = new ContractsRepository();
    this.applicationsRepository = new ApplicationsRepository();
    this.freelanceRepository = new FreelanceRepository();
    this.projectsRepository = new ProjectsRepository();
    this.companyRepository = new CompanyRepository();
  }

  /**
   * Crée un nouveau contrat
   * @param data - Données du contrat
   * @returns Le contrat créé
   */
  async createContract(data: CreateContractData): Promise<Contract> {
    // 1. Vérifier qu'il n'existe pas déjà un contrat pour la même application
    if (data.application_id) {
      const existing = await this.applicationsRepository.getApplicationById(
        data.application_id,
      );
      if (existing && existing.status === "accepted") {
        throw new Error("Un contrat existe déjà pour cette candidature.");
      }
    }

    const project = await this.projectsRepository.getProjectById(
      data.project_id || "",
    );
    if (!project) throw new Error("Projet introuvable.");
    const freelance = await this.freelanceRepository.getFreelanceById(
      data.freelance_id || "",
    );
    if (!freelance) throw new Error("Freelance introuvable.");
    const company = await this.companyRepository.getCompanyById(
      data.company_id || "",
    );
    if (!company) throw new Error("Entreprise introuvable.");

    // 3. Vérifier la cohérence selon le mode de paiement
    if (
      data.payment_mode === PaymentMode.FIXED_PRICE ||
      data.payment_mode === PaymentMode.BY_MILESTONE
    ) {
      if (!data.total_amount || data.total_amount <= 0) {
        throw new Error(
          "Le montant total est requis et doit être positif pour les modes fixed_price et by_milestone.",
        );
      }
    }

    if (data.payment_mode === PaymentMode.DAILY_RATE) {
      if (!data.tjm || data.tjm <= 0) {
        throw new Error(
          "Le TJM est requis et doit être positif pour le mode daily_rate.",
        );
      }
      if (!data.estimated_days || data.estimated_days <= 0) {
        throw new Error(
          "Le nombre de jours estimé est requis et doit être positif pour le mode daily_rate.",
        );
      }
    }

    // 4. Vérifier la cohérence des dates
    if (data.start_date && data.end_date && data.start_date > data.end_date) {
      throw new Error(
        "La date de début doit être antérieure à la date de fin.",
      );
    }

    // 5. Créer le contrat
    return this.repository.createContract(data);
  }

  /**
   * Récupère un contrat par son ID
   * @param id - UUID du contrat
   * @returns Le contrat ou null si non trouvé
   */
  async getContractById(id: string): Promise<Contract | null> {
    return this.repository.getContractById(id);
  }

  /**
   * Récupère les contrats d'un freelance avec pagination
   */
  async getContractsByFreelanceId(
    freelanceId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: Contract[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.repository.getContractsByFreelanceId(
      freelanceId,
      page,
      limit,
    );
    const totalPages = Math.ceil(result.total / (result.limit || 1));
    return {
      ...result,
      totalPages,
    };
  }

  /**
   * Récupère les contrats d'une entreprise avec pagination
   */
  async getContractsByCompanyId(
    companyId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: Contract[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.repository.getContractsByCompanyId(
      companyId,
      page,
      limit,
    );
    const totalPages = Math.ceil(result.total / (result.limit || 1));
    return {
      ...result,
      totalPages,
    };
  }

  /**
   * Récupère les contrats d'un projet avec pagination
   */
  async getContractsByProjectId(
    projectId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: Contract[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.repository.getContractsByProjectId(
      projectId,
      page,
      limit,
    );
    const totalPages = Math.ceil(result.total / (result.limit || 1));
    return {
      ...result,
      totalPages,
    };
  }

  /**
   * Met à jour le statut d'un contrat
   */
  async updateContractStatus(
    id: string,
    status: ContractStatus,
  ): Promise<Contract | null> {
    return this.repository.updateContractStatus(id, status);
  }

  /**
   * Supprime un contrat par son ID
   */
  async deleteContract(id: string): Promise<boolean> {
    return this.repository.deleteContract(id);
  }

  /**
   * Récupère les contrats avec filtres et pagination
   */
  async getContractsWithFilters(params: {
    status?: ContractStatus;
    freelanceId?: string;
    companyId?: string;
    projectId?: string;
    paymentMode?: PaymentMode;
    limit?: number;
    page?: number;
  }): Promise<{
    data: Contract[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.repository.getContractsWithFilters(params);
    const totalPages = Math.ceil(result.total / (result.limit || 1));
    return {
      ...result,
      totalPages,
    };
  }
}
