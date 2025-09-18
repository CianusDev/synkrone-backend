import { Request, Response } from "express";
import { DeliverableMediaService } from "./deliverable_media.service";
import { DeliverableMedia } from "./deliverable_media.model";
import {
  addMediaToDeliverableSchema,
  removeMediaFromDeliverableSchema,
  getDeliverableMediaParamsSchema,
  getMediaForDeliverableParamsSchema,
} from "./deliverable_media.schema";

export class DeliverableMediaController {
  private readonly service: DeliverableMediaService;

  constructor() {
    this.service = new DeliverableMediaService();
  }

  /**
   * Ajoute un média à un livrable.
   * Expects: { deliverableId, mediaId }
   */
  async addMediaToDeliverable(req: Request, res: Response) {
    try {
      const parseResult = addMediaToDeliverableSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.issues });
      }
      const { deliverableId, mediaId } = parseResult.data;
      const created: DeliverableMedia =
        await this.service.addMediaToDeliverable({
          deliverableId,
          mediaId,
          createdAt: new Date(),
        });
      res.status(201).json(created);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de l’ajout du média au livrable." });
    }
  }

  /**
   * Récupère tous les médias associés à un livrable.
   * Params: deliverableId
   */
  async getMediaForDeliverable(req: Request, res: Response) {
    try {
      const parseResult = getMediaForDeliverableParamsSchema.safeParse(
        req.params,
      );
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.issues });
      }
      const { deliverableId } = parseResult.data;
      const medias = await this.service.getMediaForDeliverable(deliverableId);
      res.json(medias);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des médias." });
    }
  }

  /**
   * Supprime (soft delete) la liaison entre un livrable et un média.
   * Expects: { deliverableId, mediaId }
   */
  async removeMediaFromDeliverable(req: Request, res: Response) {
    try {
      const parseResult = removeMediaFromDeliverableSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.issues });
      }
      const { deliverableId, mediaId } = parseResult.data;
      const success = await this.service.removeMediaFromDeliverable(
        deliverableId,
        mediaId,
      );
      res.json({ success });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la suppression du média du livrable." });
    }
  }

  /**
   * Récupère une liaison livrable-média précise.
   * Params: deliverableId, mediaId
   */
  async getDeliverableMedia(req: Request, res: Response) {
    try {
      const parseResult = getDeliverableMediaParamsSchema.safeParse(req.params);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.issues });
      }
      const { deliverableId, mediaId } = parseResult.data;
      const media = await this.service.getDeliverableMedia(
        deliverableId,
        mediaId,
      );
      if (!media) {
        return res
          .status(404)
          .json({ error: "Liaison livrable-média non trouvée." });
      }
      res.json(media);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération de la liaison." });
    }
  }
}
