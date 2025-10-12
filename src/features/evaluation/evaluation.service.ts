import { EvaluationRepository } from "./evaluation.repository";
import { ContractsRepository } from "../contracts/contracts.repository";
import { FreelanceRepository } from "../freelance/freelance.repository";
import { CompanyRepository } from "../company/company.repository";
import {
  Evaluation,
  CreateEvaluationData,
  UpdateEvaluationData,
  EvaluationStats,
  EvaluationFilters,
  UserType,
} from "./evaluation.model";
import { ContractStatus } from "../contracts/contracts.model";

export class EvaluationService {
  private readonly repository: EvaluationRepository;
  private readonly contractsRepository: ContractsRepository;
  private readonly freelanceRepository: FreelanceRepository;
  private readonly companyRepository: CompanyRepository;

  constructor() {
    this.repository = new EvaluationRepository();
    this.contractsRepository = new ContractsRepository();
    this.freelanceRepository = new FreelanceRepository();
    this.companyRepository = new CompanyRepository();
  }

  /**
   * Crée une nouvelle évaluation
   */
  async createEvaluation(data: CreateEvaluationData): Promise<Evaluation> {
    // 1. Vérifier que le contrat existe et est terminé
    const contract = await this.contractsRepository.getContractById(
      data.contract_id,
    );
    if (!contract) {
      throw new Error("Contrat non trouvé");
    }

    if (contract.status !== ContractStatus.COMPLETED) {
      throw new Error(
        "Les évaluations ne peuvent être créées que pour des contrats terminés",
      );
    }

    // 2. Vérifier que l'évaluateur fait partie du contrat
    const isEvaluatorValid =
      (data.evaluator_type === UserType.FREELANCE &&
        data.evaluator_id === contract.freelance_id) ||
      (data.evaluator_type === UserType.COMPANY &&
        data.evaluator_id === contract.company_id);

    if (!isEvaluatorValid) {
      throw new Error("L'évaluateur doit faire partie du contrat");
    }

    // 3. Vérifier que l'évalué fait partie du contrat et est différent de l'évaluateur
    const isEvaluatedValid =
      (data.evaluated_type === UserType.FREELANCE &&
        data.evaluated_id === contract.freelance_id) ||
      (data.evaluated_type === UserType.COMPANY &&
        data.evaluated_id === contract.company_id);

    if (!isEvaluatedValid) {
      throw new Error("L'évalué doit faire partie du contrat");
    }

    if (data.evaluator_id === data.evaluated_id) {
      throw new Error("L'évaluateur ne peut pas s'évaluer lui-même");
    }

    // 4. Vérifier qu'une évaluation n'existe pas déjà pour ce contrat et cet évaluateur
    const existingEvaluation = await this.repository.evaluationExists(
      data.contract_id,
      data.evaluator_id,
      data.evaluator_type,
    );

    if (existingEvaluation) {
      throw new Error(
        "Une évaluation existe déjà pour ce contrat et cet évaluateur",
      );
    }

    // 5. Vérifier que les utilisateurs existent
    if (data.evaluator_type === UserType.FREELANCE) {
      const freelance = await this.freelanceRepository.getFreelanceById(
        data.evaluator_id,
      );
      if (!freelance) {
        throw new Error("Freelance évaluateur non trouvé");
      }
    } else {
      const company = await this.companyRepository.getCompanyById(
        data.evaluator_id,
      );
      if (!company) {
        throw new Error("Entreprise évaluatrice non trouvée");
      }
    }

    if (data.evaluated_type === UserType.FREELANCE) {
      const freelance = await this.freelanceRepository.getFreelanceById(
        data.evaluated_id,
      );
      if (!freelance) {
        throw new Error("Freelance évalué non trouvé");
      }
    } else {
      const company = await this.companyRepository.getCompanyById(
        data.evaluated_id,
      );
      if (!company) {
        throw new Error("Entreprise évaluée non trouvée");
      }
    }

    // 6. Créer l'évaluation
    return this.repository.createEvaluation(data);
  }

  /**
   * Récupère une évaluation par son ID
   */
  async getEvaluationById(id: string): Promise<Evaluation | null> {
    return this.repository.getEvaluationById(id);
  }

  /**
   * Met à jour une évaluation
   */
  async updateEvaluation(
    id: string,
    data: UpdateEvaluationData,
    evaluatorId: string,
    evaluatorType: UserType,
  ): Promise<Evaluation | null> {
    // 1. Vérifier que l'évaluation existe
    const existingEvaluation = await this.repository.getEvaluationById(id);
    if (!existingEvaluation) {
      throw new Error("Évaluation non trouvée");
    }

    // 2. Vérifier que l'utilisateur est bien l'auteur de l'évaluation
    if (
      existingEvaluation.evaluator_id !== evaluatorId ||
      existingEvaluation.evaluator_type !== evaluatorType
    ) {
      throw new Error("Seul l'auteur de l'évaluation peut la modifier");
    }

    // 3. Vérifier que l'évaluation n'est pas trop ancienne (exemple: 7 jours)
    const evaluationAge = Date.now() - existingEvaluation.created_at.getTime();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours en millisecondes

    if (evaluationAge > maxAge) {
      throw new Error("L'évaluation ne peut plus être modifiée après 7 jours");
    }

    // 4. Mettre à jour l'évaluation
    return this.repository.updateEvaluation(id, data);
  }

  /**
   * Supprime une évaluation
   */
  async deleteEvaluation(
    id: string,
    evaluatorId: string,
    evaluatorType: UserType,
  ): Promise<boolean> {
    // 1. Vérifier que l'évaluation existe
    const existingEvaluation = await this.repository.getEvaluationById(id);
    if (!existingEvaluation) {
      throw new Error("Évaluation non trouvée");
    }

    // 2. Vérifier que l'utilisateur est bien l'auteur de l'évaluation
    if (
      existingEvaluation.evaluator_id !== evaluatorId ||
      existingEvaluation.evaluator_type !== evaluatorType
    ) {
      throw new Error("Seul l'auteur de l'évaluation peut la supprimer");
    }

    // 3. Vérifier que l'évaluation n'est pas trop ancienne
    const evaluationAge = Date.now() - existingEvaluation.created_at.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 heures en millisecondes

    if (evaluationAge > maxAge) {
      throw new Error(
        "L'évaluation ne peut plus être supprimée après 24 heures",
      );
    }

    // 4. Supprimer l'évaluation
    return this.repository.deleteEvaluation(id);
  }

  /**
   * Récupère les évaluations avec filtres et pagination
   */
  async getEvaluationsWithFilters(
    filters: EvaluationFilters & {
      page?: number;
      limit?: number;
    },
  ): Promise<{
    data: Evaluation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.repository.getEvaluationsWithFilters(filters);
    return result;
  }

  /**
   * Récupère les statistiques d'évaluation d'un utilisateur
   */
  async getUserEvaluationStats(
    userId: string,
    userType: UserType,
  ): Promise<EvaluationStats | null> {
    return this.repository.getUserEvaluationStats(userId, userType);
  }

  /**
   * Récupère les évaluations données par un utilisateur
   */
  async getEvaluationsByEvaluator(
    evaluatorId: string,
    evaluatorType: UserType,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Evaluation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.repository.getEvaluationsByEvaluator(
      evaluatorId,
      evaluatorType,
      page,
      limit,
    );
  }

  /**
   * Récupère les évaluations reçues par un utilisateur
   */
  async getEvaluationsByEvaluated(
    evaluatedId: string,
    evaluatedType: UserType,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Evaluation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.repository.getEvaluationsByEvaluated(
      evaluatedId,
      evaluatedType,
      page,
      limit,
    );
  }

  /**
   * Récupère les évaluations d'un contrat
   */
  async getEvaluationsByContract(contractId: string): Promise<Evaluation[]> {
    return this.repository.getEvaluationsByContract(contractId);
  }

  /**
   * Vérifie si un utilisateur peut évaluer dans le cadre d'un contrat
   */
  async canUserEvaluate(
    contractId: string,
    evaluatorId: string,
    evaluatorType: UserType,
  ): Promise<{
    canEvaluate: boolean;
    reason?: string;
    targetUser?: {
      id: string;
      type: UserType;
      name: string;
    };
  }> {
    // 1. Vérifier que le contrat existe et est terminé
    const contract = await this.contractsRepository.getContractById(contractId);
    if (!contract) {
      return {
        canEvaluate: false,
        reason: "Contrat non trouvé",
      };
    }

    if (contract.status !== ContractStatus.COMPLETED) {
      return {
        canEvaluate: false,
        reason: "Le contrat doit être terminé pour pouvoir évaluer",
      };
    }

    // 2. Vérifier que l'évaluateur fait partie du contrat
    const isEvaluatorValid =
      (evaluatorType === UserType.FREELANCE &&
        evaluatorId === contract.freelance_id) ||
      (evaluatorType === UserType.COMPANY &&
        evaluatorId === contract.company_id);

    if (!isEvaluatorValid) {
      return {
        canEvaluate: false,
        reason: "Vous devez faire partie du contrat pour pouvoir évaluer",
      };
    }

    // 3. Vérifier qu'une évaluation n'existe pas déjà
    const existingEvaluation = await this.repository.evaluationExists(
      contractId,
      evaluatorId,
      evaluatorType,
    );

    if (existingEvaluation) {
      return {
        canEvaluate: false,
        reason: "Vous avez déjà évalué ce contrat",
      };
    }

    // 4. Déterminer qui peut être évalué
    let targetUser: { id: string; type: UserType; name: string };

    if (evaluatorType === UserType.FREELANCE) {
      // Le freelance évalue l'entreprise
      targetUser = {
        id: contract.company_id,
        type: UserType.COMPANY,
        name: contract.project?.title || "Entreprise",
      };
    } else {
      // L'entreprise évalue le freelance
      if (contract.freelance) {
        targetUser = {
          id: contract.freelance_id,
          type: UserType.FREELANCE,
          name: `${contract.freelance.firstname} ${contract.freelance.lastname}`,
        };
      } else {
        targetUser = {
          id: contract.freelance_id,
          type: UserType.FREELANCE,
          name: "Freelance",
        };
      }
    }

    return {
      canEvaluate: true,
      targetUser,
    };
  }

  /**
   * Récupère un résumé des évaluations pour un utilisateur
   */
  async getUserEvaluationSummary(
    userId: string,
    userType: UserType,
  ): Promise<{
    stats: EvaluationStats;
    recentEvaluations: Evaluation[];
    canEvaluateContracts: Array<{
      contractId: string;
      projectTitle: string;
      targetUser: {
        id: string;
        type: UserType;
        name: string;
      };
    }>;
  }> {
    // 1. Récupérer les statistiques
    const stats = (await this.getUserEvaluationStats(userId, userType)) || {
      user_id: userId,
      user_type: userType,
      total_evaluations: 0,
      average_rating: 0,
      rating_distribution: {
        rating_1: 0,
        rating_2: 0,
        rating_3: 0,
        rating_4: 0,
        rating_5: 0,
      },
    };

    // 2. Récupérer les évaluations récentes reçues
    const recentEvaluationsResult = await this.getEvaluationsByEvaluated(
      userId,
      userType,
      1,
      5,
    );
    const recentEvaluations = recentEvaluationsResult.data;

    // 3. Récupérer les contrats terminés où l'utilisateur peut encore évaluer
    const canEvaluateContracts: Array<{
      contractId: string;
      projectTitle: string;
      targetUser: {
        id: string;
        type: UserType;
        name: string;
      };
    }> = [];

    // Cette logique pourrait être optimisée avec une requête SQL dédiée
    // Pour l'instant, on retourne un tableau vide - à implémenter selon les besoins

    return {
      stats,
      recentEvaluations,
      canEvaluateContracts,
    };
  }
}
