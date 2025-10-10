import { DeliverableMedia } from "./deliverable_media.model";
import { DeliverableMediaRepository } from "./deliverable_media.repository";

export class DeliverableMediaService {
  private readonly repository: DeliverableMediaRepository;

  constructor() {
    this.repository = new DeliverableMediaRepository();
  }

  /**
   * Ajoute un média à un livrable.
   */
  async addMediaToDeliverable(
    data: DeliverableMedia,
  ): Promise<DeliverableMedia> {
    return this.repository.createDeliverableMedia(data);
  }

  /**
   * Récupère tous les médias associés à un livrable.
   */
  async getMediaForDeliverable(
    deliverableId: string,
  ): Promise<DeliverableMedia[]> {
    return this.repository.getAllByDeliverable(deliverableId);
  }

  /**
   * Supprime (soft delete) la liaison entre un livrable et un média.
   */
  async removeMediaFromDeliverable(
    deliverableId: string,
    mediaId: string,
  ): Promise<boolean> {
    return this.repository.deleteDeliverableMedia(deliverableId, mediaId);
  }

  /**
   * Récupère une liaison livrable-média précise.
   */
  async getDeliverableMedia(
    deliverableId: string,
    mediaId: string,
  ): Promise<DeliverableMedia | null> {
    return this.repository.getDeliverableMedia(deliverableId, mediaId);
  }

  /**
   * Supprime tous les médias associés à un livrable (soft delete).
   */
  async removeAllMediaFromDeliverable(deliverableId: string): Promise<number> {
    const mediaLinks = await this.getMediaForDeliverable(deliverableId);
    let removedCount = 0;

    for (const link of mediaLinks) {
      const removed = await this.removeMediaFromDeliverable(
        deliverableId,
        link.mediaId,
      );
      if (removed) {
        removedCount++;
      }
    }

    return removedCount;
  }
}
