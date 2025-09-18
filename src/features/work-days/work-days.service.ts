import { WorkDaysRepository } from "./work-days.repository";
import { WorkDay, WorkDayStatus, CreateWorkDayData, UpdateWorkDayData } from "./work-days.model";

export class WorkDaysService {
  private readonly repository: WorkDaysRepository;

  constructor(repository: WorkDaysRepository) {
    this.repository = repository;
  }

  /**
   * Crée un jour de travail
   */
  async createWorkDay(data: CreateWorkDayData): Promise<WorkDay> {
    // Vérifier si un jour de travail existe déjà pour cette date et ce livrable
    const exists = await this.repository.workDayExistsForDate(
      data.deliverableId,
      data.workDate
    );

    if (exists) {
      throw new Error("Un jour de travail existe déjà pour cette date sur ce livrable");
    }

    // Vérifier que la date n'est pas dans le futur
    const workDate = new Date(data.workDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fin de journée aujourd'hui

    if (workDate > today) {
      throw new Error("Impossible de créer un jour de travail dans le futur");
    }

    // Vérifier que la date n'est pas trop ancienne (ex: max 30 jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (workDate < thirtyDaysAgo) {
      throw new Error("Impossible de créer un jour de travail de plus de 30 jours");
    }

    return this.repository.createWorkDay(data);
  }

  /**
   * Récupère un jour de travail par son id
   */
  async getWorkDayById(id: string): Promise<WorkDay | null> {
    return this.repository.getWorkDayById(id);
  }

  /**
   * Récupère tous les jours de travail d'un livrable
   */
  async getWorkDaysByDeliverable(deliverableId: string): Promise<WorkDay[]> {
    return this.repository.getWorkDaysByDeliverable(deliverableId);
  }

  /**
   * Récupère tous les jours de travail d'un freelance avec filtres
   */
  async getWorkDaysByFreelance(
    freelanceId: string,
    filters?: {
      status?: WorkDayStatus;
      dateFrom?: string;
      dateTo?: string;
      deliverableId?: string;
    }
  ): Promise<WorkDay[]> {
    return this.repository.getWorkDaysByFreelance(freelanceId, filters);
  }

  /**
   * Met à jour un jour de travail
   */
  async updateWorkDay(id: string, data: UpdateWorkDayData): Promise<WorkDay | null> {
    const existingWorkDay = await this.repository.getWorkDayById(id);
    if (!existingWorkDay) {
      return null;
    }

    // Vérifier que le jour de travail peut être modifié
    if (existingWorkDay.status === WorkDayStatus.VALIDATED) {
      throw new Error("Impossible de modifier un jour de travail validé");
    }

    // Si on change la date, vérifier l'unicité
    if (data.workDate && data.workDate !== existingWorkDay.workDate) {
      const exists = await this.repository.workDayExistsForDate(
        existingWorkDay.deliverableId,
        data.workDate
      );

      if (exists) {
        throw new Error("Un jour de travail existe déjà pour cette date sur ce livrable");
      }

      // Vérifier les contraintes de date
      const workDate = new Date(data.workDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (workDate > today) {
        throw new Error("Impossible de définir un jour de travail dans le futur");
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (workDate < thirtyDaysAgo) {
        throw new Error("Impossible de définir un jour de travail de plus de 30 jours");
      }
    }

    return this.repository.updateWorkDay(id, data);
  }

  /**
   * Supprime un jour de travail
   */
  async deleteWorkDay(id: string): Promise<boolean> {
    const workDay = await this.repository.getWorkDayById(id);
    if (!workDay) {
      return false;
    }

    // Vérifier que le jour de travail peut être supprimé
    if (workDay.status === WorkDayStatus.VALIDATED) {
      throw new Error("Impossible de supprimer un jour de travail validé");
    }

    return this.repository.deleteWorkDay(id);
  }

  /**
   * Soumet des jours de travail pour validation
   */
  async submitWorkDays(workDayIds: string[]): Promise<WorkDay[]> {
    // Vérifier que tous les jours existent et sont en draft
    const workDays = await Promise.all(
      workDayIds.map(id => this.repository.getWorkDayById(id))
    );

    const invalidWorkDays = workDays.filter(
      (wd, index) => !wd || wd.status !== WorkDayStatus.DRAFT
    );

    if (invalidWorkDays.length > 0) {
      throw new Error("Certains jours de travail ne peuvent pas être soumis (inexistants ou pas en brouillon)");
    }

    return this.repository.submitWorkDays(workDayIds);
  }

  /**
   * Valide un jour de travail (action entreprise)
   */
  async validateWorkDay(id: string): Promise<WorkDay | null> {
    const workDay = await this.repository.getWorkDayById(id);
    if (!workDay) {
      return null;
    }

    if (workDay.status !== WorkDayStatus.SUBMITTED) {
      throw new Error("Seuls les jours de travail soumis peuvent être validés");
    }

    return this.repository.validateWorkDay(id);
  }

  /**
   * Rejette un jour de travail (action entreprise)
   */
  async rejectWorkDay(id: string, rejectionReason: string): Promise<WorkDay | null> {
    const workDay = await this.repository.getWorkDayById(id);
    if (!workDay) {
      return null;
    }

    if (workDay.status !== WorkDayStatus.SUBMITTED) {
      throw new Error("Seuls les jours de travail soumis peuvent être rejetés");
    }

    return this.repository.rejectWorkDay(id, rejectionReason);
  }

  /**
   * Récupère les statistiques des jours de travail pour un livrable
   */
  async getWorkDayStatsByDeliverable(deliverableId: string): Promise<{
    totalDays: number;
    draftDays: number;
    submittedDays: number;
    validatedDays: number;
    rejectedDays: number;
    totalAmount: number;
    validatedAmount: number;
  }> {
    return this.repository.getWorkDayStatsByDeliverable(deliverableId);
  }

  /**
   * Valide plusieurs jours de travail en une fois
   */
  async bulkValidateWorkDays(workDayIds: string[]): Promise<WorkDay[]> {
    const results = [];
    for (const id of workDayIds) {
      const validated = await this.validateWorkDay(id);
      if (validated) {
        results.push(validated);
      }
    }
    return results;
  }

  /**
   * Rejette plusieurs jours de travail en une fois
   */
  async bulkRejectWorkDays(workDayIds: string[], rejectionReason: string): Promise<WorkDay[]> {
    const results = [];
    for (const id of workDayIds) {
      const rejected = await this.rejectWorkDay(id, rejectionReason);
      if (rejected) {
        results.push(rejected);
      }
    }
    return results;
  }
}
