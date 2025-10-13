import { ContractStatus } from "../contracts/contracts.model";
import { ContractsRepository } from "../contracts/contracts.repository";
import { DeliverableMediaService } from "../media/deliverable_media/deliverable_media.service";
import { Media } from "../media/media.model";
import { MediaService } from "../media/media.service";
import { Deliverable, DeliverableStatus } from "./deliverables.model";
import { DeliverablesRepository } from "./deliverables.repository";
import { DeliverablesNotificationService } from "./notifications/deliverables-notification.service";
import { ProjectsRepository } from "../projects/projects.repository";
import { FreelanceRepository } from "../freelance/freelance.repository";
import { CompanyRepository } from "../company/company.repository";
import { ProjectStatus } from "../projects/projects.model";
import { Availability } from "../freelance/freelance.model";
import { ContractsNotificationService } from "../contracts/contracts-notification.service";

// Statuts autorisés pour les freelances
const FREELANCE_ALLOWED_STATUSES = [
  DeliverableStatus.PLANNED,
  DeliverableStatus.IN_PROGRESS,
  DeliverableStatus.SUBMITTED,
];

// Statuts réservés aux companies
const COMPANY_ONLY_STATUSES = [
  DeliverableStatus.VALIDATED,
  DeliverableStatus.REJECTED,
];

export class DeliverablesService {
  private readonly repository: DeliverablesRepository;
  private readonly deliverableMediaService: DeliverableMediaService;
  private readonly mediaService: MediaService;
  private readonly contractsRepository: ContractsRepository;
  private readonly projectsRepository: ProjectsRepository;
  private readonly freelancesRepository: FreelanceRepository;
  private readonly companiesRepository: CompanyRepository;
  private readonly notificationService: DeliverablesNotificationService;
  private readonly contractsNotificationService: ContractsNotificationService;

  constructor(repository: DeliverablesRepository) {
    this.repository = repository;
    this.deliverableMediaService = new DeliverableMediaService();
    this.mediaService = new MediaService();
    this.contractsRepository = new ContractsRepository();
    this.projectsRepository = new ProjectsRepository();
    this.freelancesRepository = new FreelanceRepository();
    this.companiesRepository = new CompanyRepository();
    this.notificationService = new DeliverablesNotificationService();
    this.contractsNotificationService = new ContractsNotificationService();
  }

  /**
   * Crée un livrable et associe les médias si fournis
   */
  async createDeliverable(
    data: Omit<Deliverable, "id" | "createdAt" | "updatedAt"> & {
      mediaIds?: string[];
    },
  ): Promise<Deliverable> {
    // Logique métier : exemple, vérifier unicité du titre, cohérence de l'ordre, etc.
    const { mediaIds, ...livrableData } = data;
    const deliverable = await this.repository.createDeliverable(livrableData);
    if (!deliverable) {
      throw new Error("Erreur lors de la création du livrable");
    }

    console.log("Created deliverable:", deliverable);

    // Mettre à jour le statut du contrat associé à "PENDING" lorsqu'un livrable est créé
    await this.contractsRepository.updateContractStatus(
      data.contractId,
      ContractStatus.PENDING,
    );

    // Vérifier le statut du contrat avant d'ajouter des médias
    if (mediaIds && mediaIds.length > 0) {
      const contract = await this.contractsRepository.getContractById(
        data.contractId,
      );
      if (!contract) {
        throw new Error("Contrat non trouvé");
      }

      if (
        contract.status !== ContractStatus.ACTIVE &&
        contract.status !== ContractStatus.PENDING
      ) {
        throw new Error(
          `Impossible d'ajouter des médias : le contrat doit être actif ou en attente. Statut actuel : ${contract.status}`,
        );
      }

      // Associer les médias si le contrat est dans un état valide
      await Promise.all(
        mediaIds.map((mediaId) =>
          this.deliverableMediaService.addMediaToDeliverable({
            deliverableId: deliverable.id,
            mediaId,
            createdAt: new Date(),
          }),
        ),
      );
    }

    // Récupérer les liens et enrichir avec les objets Media
    const links = await this.deliverableMediaService.getMediaForDeliverable(
      deliverable.id,
    );
    const medias: (Media & { createdAt: Date })[] = [];
    for (const link of links) {
      const media = await this.mediaService.getMediaById(link.mediaId);
      if (media) {
        medias.push({ ...media, createdAt: link.createdAt });
      }
    }

    const enrichedDeliverable = await this.enrichDeliverableWithEvaluationFlag({
      ...deliverable,
      medias,
    });

    // Vérifier si c'est le premier livrable milestone du contrat et gérer l'activation
    try {
      if (deliverable.isMilestone) {
        const allDeliverables = await this.repository.getDeliverablesByContract(
          data.contractId,
        );
        const milestoneDeliverables = allDeliverables.filter(
          (d) => d.isMilestone,
        );

        // Si c'est le premier livrable milestone créé
        if (milestoneDeliverables.length === 1) {
          // Notifier l'entreprise de la création des livrables
          // Le contrat reste en PENDING - il ne s'active que quand le freelance commence le travail
          await this.contractsNotificationService.notifyDeliverablesCreatedForContract(
            data.contractId,
          );
          console.log(
            `📋 Premier livrable milestone créé pour le contrat ${data.contractId} - contrat reste en PENDING`,
          );
          console.log(
            `📧 Notification de création de livrables envoyée pour le contrat ${data.contractId}`,
          );
        } else {
          // Si ce n'est pas le premier, juste logguer
          console.log(
            `📋 Livrable milestone ajouté au contrat ${data.contractId} (${milestoneDeliverables.length} au total)`,
          );
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors de la gestion automatique du contrat et des notifications:",
        error,
      );
      // Ne pas faire échouer la création du livrable si la gestion du contrat échoue
    }

    return enrichedDeliverable;
  }

  /**
   * Récupère un livrable par son id (avec ses médias)
   */
  async getDeliverableById(id: string): Promise<Deliverable | null> {
    const deliverable = await this.repository.getDeliverableById(id);
    if (!deliverable) return null;

    const links = await this.deliverableMediaService.getMediaForDeliverable(
      deliverable.id,
    );
    const medias: (Media & { createdAt: Date })[] = [];
    for (const link of links) {
      const media = await this.mediaService.getMediaById(link.mediaId);
      if (media) {
        medias.push({ ...media, createdAt: link.createdAt });
      }
    }

    const enrichedDeliverable = await this.enrichDeliverableWithEvaluationFlag({
      ...deliverable,
      medias,
    });

    return enrichedDeliverable;
  }

  /**
   * Récupère tous les livrables d'un contrat (avec leurs médias)
   */
  async getDeliverablesByContract(contractId: string): Promise<Deliverable[]> {
    const deliverables =
      await this.repository.getDeliverablesByContract(contractId);
    return Promise.all(
      deliverables.map(async (d) => {
        const links = await this.deliverableMediaService.getMediaForDeliverable(
          d.id,
        );
        const medias: (Media & { createdAt: Date })[] = [];
        for (const link of links) {
          const media = await this.mediaService.getMediaById(link.mediaId);
          if (media) {
            medias.push({ ...media, createdAt: link.createdAt });
          }
        }
        const enrichedDeliverable =
          await this.enrichDeliverableWithEvaluationFlag({ ...d, medias });
        return enrichedDeliverable;
      }),
    );
  }

  /**
   * Met à jour un livrable et associe les médias si fournis
   */
  async updateDeliverable(
    id: string,
    data: Partial<
      Omit<Deliverable, "id" | "contractId" | "createdAt" | "updatedAt">
    > & { mediaIds?: string[]; userType?: "freelance" | "company" },
  ): Promise<Deliverable | null> {
    // Validation de sécurité : vérifier les permissions selon le type d'utilisateur
    const { mediaIds, userType, ...updateData } = data;

    // Si un statut est fourni et que c'est un freelance, vérifier les restrictions
    if (updateData.status && userType === "freelance") {
      if (COMPANY_ONLY_STATUSES.includes(updateData.status)) {
        throw new Error(
          `Le statut '${updateData.status}' est réservé aux entreprises. Statuts autorisés pour les freelances : ${FREELANCE_ALLOWED_STATUSES.join(", ")}`,
        );
      }
    }

    const updated = await this.repository.updateDeliverable(id, updateData);
    if (!updated) return null;

    // Vérifier le statut du contrat avant d'ajouter des médias (freelances uniquement)
    if (mediaIds && mediaIds.length > 0 && userType === "freelance") {
      const contract = await this.contractsRepository.getContractById(
        updated.contractId,
      );
      if (!contract) {
        throw new Error("Contrat non trouvé");
      }

      if (
        contract.status !== ContractStatus.ACTIVE &&
        contract.status !== ContractStatus.PENDING
      ) {
        throw new Error(
          `Impossible d'ajouter des médias : le contrat doit être actif ou en attente. Statut actuel : ${contract.status}`,
        );
      }
    }

    // Associer les nouveaux médias si fournis
    if (mediaIds && mediaIds.length > 0) {
      await Promise.all(
        mediaIds.map((mediaId) =>
          this.deliverableMediaService.addMediaToDeliverable({
            deliverableId: id,
            mediaId,
            createdAt: new Date(),
          }),
        ),
      );

      // Marquer comme soumis automatiquement quand des médias sont ajoutés
      const updatedWithMedia = await this.repository.updateDeliverable(id, {
        status: DeliverableStatus.SUBMITTED,
        submittedAt: new Date().toISOString(),
      });

      // Envoyer notification de soumission à l'entreprise
      if (updatedWithMedia) {
        await this.sendDeliverableUpdateNotifications(updatedWithMedia);
      }

      // Retourner le livrable mis à jour avec médias au lieu de updated
      const links =
        await this.deliverableMediaService.getMediaForDeliverable(id);
      const medias: (Media & { createdAt: Date })[] = [];
      for (const link of links) {
        const media = await this.mediaService.getMediaById(link.mediaId);
        if (media) {
          medias.push({ ...media, createdAt: link.createdAt });
        }
      }

      const enrichedUpdatedDeliverable =
        await this.enrichDeliverableWithEvaluationFlag({
          ...updatedWithMedia!,
          medias,
        });

      return enrichedUpdatedDeliverable;
    }

    // Récupérer les liens et enrichir avec les objets Media
    const links = await this.deliverableMediaService.getMediaForDeliverable(id);
    const medias: (Media & { createdAt: Date })[] = [];
    for (const link of links) {
      const media = await this.mediaService.getMediaById(link.mediaId);
      if (media) {
        medias.push({ ...media, createdAt: link.createdAt });
      }
    }

    const enrichedDeliverable = await this.enrichDeliverableWithEvaluationFlag({
      ...updated,
      medias,
    });

    return enrichedDeliverable;
  }

  /**
   * Valide qu'un utilisateur freelance ne peut pas utiliser les statuts réservés
   */
  private validateFreelanceStatusRestriction(status: DeliverableStatus): void {
    if (COMPANY_ONLY_STATUSES.includes(status)) {
      throw new Error(
        `Accès refusé : Le statut '${status}' est réservé aux entreprises. ` +
          `Statuts autorisés : ${FREELANCE_ALLOWED_STATUSES.join(", ")}`,
      );
    }
  }

  /**
   * Met à jour un livrable avec validation de rôle freelance
   */
  async updateDeliverableAsFreelance(
    id: string,
    data: Partial<
      Omit<Deliverable, "id" | "contractId" | "createdAt" | "updatedAt">
    > & { mediaIds?: string[] },
  ): Promise<Deliverable | null> {
    // Valider les restrictions de statut pour les freelances
    if (data.status) {
      this.validateFreelanceStatusRestriction(data.status);
    }

    return this.updateDeliverable(id, { ...data, userType: "freelance" });
  }

  /**
   * Met à jour un livrable avec tous les droits (company)
   */
  async updateDeliverableAsCompany(
    id: string,
    data: Partial<
      Omit<Deliverable, "id" | "contractId" | "createdAt" | "updatedAt">
    > & { mediaIds?: string[] },
  ): Promise<Deliverable | null> {
    const deliverable = await this.repository.getDeliverableById(id);
    if (!deliverable) return null;

    // Si le statut passe à "rejected", supprimer tous les médias associés
    if (data.status === DeliverableStatus.REJECTED) {
      const removedCount =
        await this.deliverableMediaService.removeAllMediaFromDeliverable(id);
      console.log(
        `🗑️ ${removedCount} médias supprimés pour le livrable rejeté: ${id}`,
      );
    }

    const updated = await this.updateDeliverable(id, {
      ...data,
      userType: "company",
      ...(data.status === DeliverableStatus.VALIDATED && {
        validatedAt: new Date().toISOString(),
      }),
    });

    // Si le statut passe à "validated", vérifier si tous les livrables du contrat sont validés
    if (data.status === DeliverableStatus.VALIDATED && updated) {
      await this.checkAndCompleteContractIfAllDeliverablesValidated(
        updated.contractId,
      );
    }

    // Envoyer les notifications pour la mise à jour
    if (
      updated &&
      (data.status === DeliverableStatus.VALIDATED ||
        data.status === DeliverableStatus.REJECTED ||
        data.status === DeliverableStatus.SUBMITTED)
    ) {
      await this.sendDeliverableUpdateNotifications(updated, data.feedback);
    }

    return updated;
  }

  /**
   * Vérifie si tous les livrables d'un contrat sont validés et clôture le contrat si nécessaire
   */
  private async checkAndCompleteContractIfAllDeliverablesValidated(
    contractId: string,
  ): Promise<void> {
    try {
      const allDeliverables =
        await this.repository.getDeliverablesByContract(contractId);

      // Filtrer uniquement les livrables milestone (qui comptent pour la completion)
      const milestoneDeliverables = allDeliverables.filter(
        (d) => d.isMilestone,
      );

      if (milestoneDeliverables.length === 0) {
        console.log(
          `⚠️ Aucun livrable milestone trouvé pour le contrat ${contractId}`,
        );
        return;
      }

      // Vérifier si tous les milestones sont validés
      const allMilestonesValidated = milestoneDeliverables.every(
        (d) => d.status === DeliverableStatus.VALIDATED,
      );

      if (allMilestonesValidated) {
        // Clôturer le contrat
        await this.contractsRepository.updateContractStatus(
          contractId,
          ContractStatus.COMPLETED,
        );
        // Mettre à jour le statut du projet associé à "CLOSED"
        await this.projectsRepository.updateProjectStatusByContract(
          contractId,
          ProjectStatus.CLOSED,
        );
        console.log(
          `✅ Contrat ${contractId} automatiquement clôturé - tous les livrables milestone validés`,
        );

        // Envoyer les notifications de clôture automatique
        await this.sendContractCompletionNotifications(contractId);

        // Mettre à jour la disponibilité du freelance et retirer ses candidatures
        await this.updateFreelanceAvailabilityAndWithdrawApplications(
          contractId,
        );
      } else {
        const validatedCount = milestoneDeliverables.filter(
          (d) => d.status === DeliverableStatus.VALIDATED,
        ).length;
        console.log(
          `📊 Contrat ${contractId}: ${validatedCount}/${milestoneDeliverables.length} livrables milestone validés`,
        );
      }
    } catch (error) {
      console.error(
        `❌ Erreur lors de la vérification de completion du contrat ${contractId}:`,
        error,
      );
    }
  }

  /**
   * Supprime un livrable
   */
  async deleteDeliverable(id: string): Promise<boolean> {
    return this.repository.deleteDeliverable(id);
  }

  /**
   * Enrichit un livrable avec le flag canEvaluated
   */
  private async enrichDeliverableWithEvaluationFlag(
    deliverable: Deliverable,
  ): Promise<Deliverable & { canEvaluated?: boolean }> {
    try {
      // Récupérer le contrat associé
      const contract = await this.contractsRepository.getContractById(
        deliverable.contractId,
      );

      // Le livrable peut être évalué si le contrat est terminé (completed)
      const canEvaluated = contract?.status === ContractStatus.COMPLETED;

      return {
        ...deliverable,
        canEvaluated,
      };
    } catch (error) {
      console.error(
        `❌ Erreur lors de l'enrichissement du livrable ${deliverable.id}:`,
        error,
      );
      return {
        ...deliverable,
        canEvaluated: false,
      };
    }
  }

  /**
   * Envoie les notifications lors de la mise à jour d'un livrable
   */
  private async sendDeliverableUpdateNotifications(
    deliverable: Deliverable,
    feedback?: string,
  ): Promise<void> {
    try {
      // Récupérer les informations enrichies du contrat
      const contract = await this.contractsRepository.getContractById(
        deliverable.contractId,
      );
      if (!contract) return;

      // Note: Les propriétés du contract utilisent des noms de colonnes SQL (snake_case)
      // Il faudrait vérifier la structure exacte du modèle Contract
      const project = await this.projectsRepository.getProjectById(
        contract.project_id,
      );
      if (!project) return;

      // Récupérer les informations du freelance et de l'entreprise
      const freelance = await this.freelancesRepository.getFreelanceById(
        contract.freelance_id,
      );
      const company = await this.companiesRepository.getCompanyById(
        contract.company_id,
      );

      // Préparer les données pour les notifications
      const notificationData = {
        deliverableId: deliverable.id,
        deliverableTitle: deliverable.title,
        deliverableStatus: deliverable.status,
        contractId: deliverable.contractId,
        freelanceId: contract.freelance_id,
        companyId: contract.company_id,
        feedback,
        projectTitle: project.title,
        freelanceName: freelance
          ? `${freelance.firstname} ${freelance.lastname}`
          : "Freelance",
        companyName: company?.company_name || "Entreprise",
        freelanceEmail: freelance?.email,
        companyEmail: company?.company_email,
        avatar: freelance?.photo_url || company?.logo_url || null,
      };

      // Envoyer les notifications selon le statut du livrable
      if (deliverable.status === DeliverableStatus.SUBMITTED) {
        // Notification à l'entreprise pour nouveau livrable soumis
        await this.notificationService.notifyDeliverableUpdate({
          ...notificationData,
          deliverableStatus: DeliverableStatus.SUBMITTED,
        });
      } else if (deliverable.status === DeliverableStatus.VALIDATED) {
        // Notification au freelance pour livrable validé
        await this.notificationService.notifyDeliverableUpdate({
          ...notificationData,
          deliverableStatus: DeliverableStatus.VALIDATED,
        });
      } else if (deliverable.status === DeliverableStatus.REJECTED) {
        // Notification au freelance pour livrable rejeté
        await this.notificationService.notifyDeliverableUpdate({
          ...notificationData,
          deliverableStatus: DeliverableStatus.REJECTED,
          feedback,
        });
      }
    } catch (error) {
      console.error("❌ Erreur envoi notifications livrable:", error);
    }
  }

  /**
   * Envoie les notifications lors de la clôture automatique d'un contrat
   */
  private async sendContractCompletionNotifications(
    contractId: string,
  ): Promise<void> {
    try {
      // Récupérer les informations enrichies du contrat
      const contract =
        await this.contractsRepository.getContractById(contractId);
      if (!contract) return;

      // Note: Les propriétés du contract utilisent des noms de colonnes SQL (snake_case)
      const project = await this.projectsRepository.getProjectById(
        contract.project_id,
      );
      if (!project) return;

      // Récupérer les informations du freelance et de l'entreprise
      const freelance = await this.freelancesRepository.getFreelanceById(
        contract.freelance_id,
      );
      const company = await this.companiesRepository.getCompanyById(
        contract.company_id,
      );

      // Préparer les données pour les notifications
      const notificationData = {
        contractId: contract.id,
        projectId: project.id,
        projectTitle: project.title,
        freelanceId: contract.freelance_id,
        companyId: contract.company_id,
        freelanceName: freelance
          ? `${freelance.firstname} ${freelance.lastname}`
          : "Freelance",
        companyName: company?.company_name || "Entreprise",
        completionDate: new Date().toISOString().split("T")[0],
        freelanceEmail: freelance?.email,
        companyEmail: company?.company_email,
      };

      // Envoyer les notifications de clôture
      await this.notificationService.notifyContractCompletion(notificationData);
    } catch (error) {
      console.error("❌ Erreur envoi notifications clôture contrat:", error);
    }
  }

  /**
   * Met à jour la disponibilité du freelance à "available" et retire toutes ses candidatures actives
   * quand un contrat est terminé
   */
  private async updateFreelanceAvailabilityAndWithdrawApplications(
    contractId: string,
  ): Promise<void> {
    try {
      // Récupérer les informations du contrat
      const contract =
        await this.contractsRepository.getContractById(contractId);
      if (!contract) {
        console.log(
          `⚠️ Contrat ${contractId} non trouvé pour mise à jour disponibilité`,
        );
        return;
      }

      const freelanceId = contract.freelance_id;

      // 1. Mettre à jour la disponibilité du freelance à "available"
      await this.freelancesRepository.updateFreelanceProfile(freelanceId, {
        availability: Availability.AVAILABLE,
      });

      console.log(
        `✅ Disponibilité du freelance ${freelanceId} mise à jour : available`,
      );

      // 2. Retirer toutes les candidatures actives du freelance
      // Importer dynamiquement pour éviter la dépendance circulaire
      const { ApplicationsService } = await import(
        "../applications/applications.service"
      );
      const applicationsService = new ApplicationsService();

      // Récupérer toutes les candidatures du freelance avec des statuts actifs
      const activeApplicationsResult =
        await applicationsService.getApplicationsWithFilters({
          freelanceId: freelanceId,
          limit: 100, // Limite élevée pour récupérer toutes les candidatures
          includeAll: false, // Exclut déjà les candidatures rejetées/retirées
        });

      // Retirer chaque candidature active
      let withdrawnCount = 0;
      for (const application of activeApplicationsResult.data) {
        try {
          // Utiliser la méthode de retrait existante qui gère les notifications
          await applicationsService.withdrawApplication(
            application.id,
            freelanceId,
          );
          withdrawnCount++;
          console.log(
            `✅ Candidature ${application.id} retirée automatiquement`,
          );
        } catch (error) {
          console.error(
            `❌ Erreur retrait candidature ${application.id}:`,
            error,
          );
          // Continuer avec les autres candidatures même si une échoue
        }
      }

      console.log(
        `✅ ${withdrawnCount} candidatures retirées automatiquement pour le freelance ${freelanceId}`,
      );
    } catch (error) {
      console.error(
        `❌ Erreur lors de la mise à jour de disponibilité et retrait candidatures pour le contrat ${contractId}:`,
        error,
      );
      // Ne pas faire échouer la clôture du contrat si cette étape échoue
    }
  }
}
