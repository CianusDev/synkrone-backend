import { DeliverablesRepository } from "./deliverables.repository";
import { Deliverable } from "./deliverables.model";
import { DeliverableMediaService } from "../media/deliverable_media/deliverable_media.service";
import { MediaService } from "../media/media.service";
import { Media } from "../media/media.model";

export class DeliverablesService {
  private readonly repository: DeliverablesRepository;
  private readonly deliverableMediaService: DeliverableMediaService;
  private readonly mediaService: MediaService;

  constructor(repository: DeliverablesRepository) {
    this.repository = repository;
    this.deliverableMediaService = new DeliverableMediaService();
    this.mediaService = new MediaService();
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

    // Associer les médias si fournis
    if (mediaIds && mediaIds.length > 0) {
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

    return {
      ...deliverable,
      medias,
    };
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

    return {
      ...deliverable,
      medias,
    };
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
        return { ...d, medias };
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
    > & { mediaIds?: string[] },
  ): Promise<Deliverable | null> {
    // Logique métier : exemple, vérifier droits, cohérence, etc.
    const { mediaIds, ...updateData } = data;
    const updated = await this.repository.updateDeliverable(id, updateData);
    if (!updated) return null;

    // Associer les nouveaux médias si fournis
    if (mediaIds) {
      // Optionnel : supprimer tous les anciens médias avant d'ajouter les nouveaux
      // (à adapter selon la logique métier souhaitée)
      // await this.deliverableMediaService.removeAllMediaFromDeliverable(id);

      await Promise.all(
        mediaIds.map((mediaId) =>
          this.deliverableMediaService.addMediaToDeliverable({
            deliverableId: id,
            mediaId,
            createdAt: new Date(),
          }),
        ),
      );
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

    return {
      ...updated,
      medias,
    };
  }

  /**
   * Supprime un livrable
   */
  async deleteDeliverable(id: string): Promise<boolean> {
    return this.repository.deleteDeliverable(id);
  }
}
