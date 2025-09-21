import { ApplicationsRepository } from "../applications/applications.repository";
import { CompanyRepository } from "../company/company.repository";
import { DeliverablesRepository } from "../deliverables/deliverables.repository";
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
  private readonly deliverablesRepository: DeliverablesRepository;
  private readonly freelanceRepository: FreelanceRepository;
  private readonly projectsRepository: ProjectsRepository;
  private readonly companyRepository: CompanyRepository;

  constructor() {
    this.repository = new ContractsRepository();
    this.applicationsRepository = new ApplicationsRepository();
    this.freelanceRepository = new FreelanceRepository();
    this.projectsRepository = new ProjectsRepository();
    this.companyRepository = new CompanyRepository();
    this.deliverablesRepository = new DeliverablesRepository();
  }

  /**
   * Crée un nouveau contrat
   * @param data - Données du contrat
   * @returns Le contrat créé
   */
  async createContract(data: CreateContractData): Promise<Contract> {
    // 1. Vérifier qu'il n'existe pas déjà un contrat pour la même application
    if (data.application_id) {
      const existingContract = await this.repository.getContractByApplicationId(
        data.application_id,
      );
      if (existingContract) {
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
    const newContract = await this.repository.createContract(data);

    // 6. Vérifier s'il y a des livrables milestone associés au contrat
    const hasMilestones = await this.checkContractHasMilestones(newContract.id);

    // 7. Déterminer le statut selon la présence de livrables milestone
    const newStatus = hasMilestones
      ? ContractStatus.PENDING
      : ContractStatus.DRAFT;
    await this.repository.updateContractStatus(newContract.id, newStatus);

    return newContract;
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
   * Récupère les contrats d'un freelance avec pagination et filtres
   */
  async getContractsByFreelanceId(
    freelanceId: string,
    page?: number,
    limit?: number,
    filters?: {
      status?: ContractStatus;
      paymentMode?: PaymentMode;
    },
  ): Promise<{
    data: Contract[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.getContractsWithFilters({
      freelanceId,
      page,
      limit,
      status: filters?.status,
      paymentMode: filters?.paymentMode,
    });
  }

  /**
   * Récupère les contrats d'une entreprise avec pagination et filtres
   */
  async getContractsByCompanyId(
    companyId: string,
    page?: number,
    limit?: number,
    filters?: {
      status?: ContractStatus;
      paymentMode?: PaymentMode;
    },
  ): Promise<{
    data: Contract[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.getContractsWithFilters({
      companyId,
      page,
      limit,
      status: filters?.status,
      paymentMode: filters?.paymentMode,
    });
  }

  /**
   * Récupère les contrats d'un projet avec pagination et filtres
   */
  async getContractsByProjectId(
    projectId: string,
    page?: number,
    limit?: number,
    filters?: {
      status?: ContractStatus;
      paymentMode?: PaymentMode;
    },
  ): Promise<{
    data: Contract[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.getContractsWithFilters({
      projectId,
      page,
      limit,
      status: filters?.status,
      paymentMode: filters?.paymentMode,
    });
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

  /**
   * Met à jour un contrat (pour l'entreprise, seulement si statut draft)
   */
  async updateContract(
    id: string,
    data: Partial<Omit<Contract, "id" | "created_at">>,
  ): Promise<Contract | null> {
    // 1. Vérifier que le contrat existe et est en statut draft
    const existingContract = await this.repository.getContractById(id);
    if (!existingContract) {
      throw new Error("Contrat non trouvé");
    }

    // if (existingContract.status === ContractStatus.SUSPENDED) {
    //   throw new Error("Les contrats suspendus ne peuvent pas être modifiés.");
    // }

    // 2. Vérifier la cohérence selon le mode de paiement (si modifié)
    const paymentMode = data.payment_mode || existingContract.payment_mode;
    const totalAmount =
      data.total_amount !== undefined
        ? data.total_amount
        : existingContract.total_amount;
    const tjm = data.tjm !== undefined ? data.tjm : existingContract.tjm;
    const estimatedDays =
      data.estimated_days !== undefined
        ? data.estimated_days
        : existingContract.estimated_days;

    if (
      paymentMode === PaymentMode.FIXED_PRICE ||
      paymentMode === PaymentMode.BY_MILESTONE
    ) {
      if (!totalAmount || totalAmount <= 0) {
        throw new Error(
          "Le montant total est requis et doit être positif pour les modes fixed_price et by_milestone.",
        );
      }
    }

    if (paymentMode === PaymentMode.DAILY_RATE) {
      if (!tjm || tjm <= 0) {
        throw new Error(
          "Le TJM est requis et doit être positif pour le mode daily_rate.",
        );
      }
      if (!estimatedDays || estimatedDays <= 0) {
        throw new Error(
          "Le nombre de jours estimé est requis et doit être positif pour le mode daily_rate.",
        );
      }
    }

    // 3. Vérifier la cohérence des dates
    const startDate =
      data.start_date !== undefined
        ? data.start_date
        : existingContract.start_date;
    const endDate =
      data.end_date !== undefined ? data.end_date : existingContract.end_date;

    if (startDate && endDate && startDate > endDate) {
      throw new Error(
        "La date de début doit être antérieure à la date de fin.",
      );
    }

    // 4. Mettre à jour le contrat
    const updatedContract = this.repository.updateContract(id, {
      ...data,
      status: ContractStatus.PENDING,
    });

    return updatedContract;
  }

  /**
   * Accepte un contrat (pour le freelance, seulement si statut draft)
   */
  async acceptContract(id: string): Promise<Contract | null> {
    // 1. Vérifier que le contrat existe et est en statut pending
    const existingContract = await this.repository.getContractById(id);
    if (!existingContract) {
      throw new Error("Contrat non trouvé");
    }
    if (existingContract.status !== ContractStatus.PENDING) {
      throw new Error(
        "Seuls les contrats en statut attente peuvent être acceptés",
      );
    }

    // 2. Vérifier s'il y a des livrables milestone associés au contrat
    const hasMilestones = await this.checkContractHasMilestones(id);

    // 3. Déterminer le statut selon la présence de livrables milestone
    const newStatus = hasMilestones
      ? ContractStatus.ACTIVE
      : ContractStatus.PENDING;

    return this.repository.updateContractStatus(id, newStatus);
  }

  /**
   * Vérifie si un contrat a des livrables milestone associés
   */
  private async checkContractHasMilestones(
    contractId: string,
  ): Promise<boolean> {
    // TODO: Implémenter la vérification des livrables milestone
    // Pour l'instant, retourne false par défaut (pas de livrables = PENDING)
    // Cette méthode devra être mise à jour quand le module milestones sera disponible
    try {
      const milestones =
        await this.deliverablesRepository.getDeliverablesByContract(contractId);
      if (milestones && milestones.length > 0) {
        return true; // Il y a au moins un livrable milestone
      }
      return false; // Par défaut, pas de livrables milestone
    } catch (error) {
      console.error("Erreur lors de la vérification des milestones:", error);
      return false; // En cas d'erreur, on considère qu'il n'y a pas de milestones
    }
  }

  /**
   * Refuse un contrat (pour le freelance, seulement si statut pending)
   */
  async refuseContract(id: string): Promise<Contract | null> {
    // 1. Vérifier que le contrat existe et est en statut pending
    const existingContract = await this.repository.getContractById(id);
    if (!existingContract) {
      throw new Error("Contrat non trouvé");
    }
    if (existingContract.status !== ContractStatus.PENDING) {
      throw new Error("Seuls les contrats en attente peuvent être refusés");
    }

    // 2. Passer le statut à cancelled
    return this.repository.updateContractStatus(id, ContractStatus.CANCELLED);
  }

  /**
   * Active un contrat en statut PENDING (quand des milestones sont ajoutés)
   */
  async activatePendingContract(id: string): Promise<Contract | null> {
    // 1. Vérifier que le contrat existe et est en statut pending
    const existingContract = await this.repository.getContractById(id);
    if (!existingContract) {
      throw new Error("Contrat non trouvé");
    }
    if (existingContract.status !== ContractStatus.PENDING) {
      throw new Error(
        "Seuls les contrats en statut pending peuvent être activés",
      );
    }

    // 2. Vérifier qu'il y a maintenant des livrables milestone
    const hasMilestones = await this.checkContractHasMilestones(id);
    if (!hasMilestones) {
      throw new Error(
        "Impossible d'activer le contrat : aucun livrable milestone associé",
      );
    }

    // 3. Passer le statut à active
    return this.repository.updateContractStatus(id, ContractStatus.ACTIVE);
  }

  /**
   * Met un contrat ACTIVE en PENDING (si tous les milestones sont supprimés)
   */
  async setPendingFromActive(id: string): Promise<Contract | null> {
    // 1. Vérifier que le contrat existe et est en statut active
    const existingContract = await this.repository.getContractById(id);
    if (!existingContract) {
      throw new Error("Contrat non trouvé");
    }
    if (existingContract.status !== ContractStatus.ACTIVE) {
      throw new Error(
        "Seuls les contrats en statut active peuvent être mis en pending",
      );
    }

    // 2. Vérifier qu'il n'y a plus de livrables milestone
    const hasMilestones = await this.checkContractHasMilestones(id);
    if (hasMilestones) {
      throw new Error(
        "Impossible de mettre en pending : des livrables milestone sont encore associés",
      );
    }

    // 3. Passer le statut à pending
    return this.repository.updateContractStatus(id, ContractStatus.PENDING);
  }
}
