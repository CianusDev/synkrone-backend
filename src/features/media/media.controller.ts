import { Request, Response } from "express";
import { MediaService } from "./media.service";
import { MediaType } from "./media.model";
import { createMediaSchema, updateMediaSchema } from "./media.schema";

export class MediaController {
  private readonly service: MediaService;

  constructor() {
    this.service = new MediaService();
  }

  /**
   * Liste les médias (optionnel: filtrer par type ou uploader)
   */
  async listMedia(req: Request, res: Response) {
    try {
      const { type, uploadedBy } = req.query;
      const params: { type?: MediaType; uploadedBy?: string } = {};

      if (type && typeof type === "string") {
        params.type = type as MediaType;
      }
      if (uploadedBy && typeof uploadedBy === "string") {
        params.uploadedBy = uploadedBy;
      }

      const medias = await this.service.listMedia(params);
      res.json(medias);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des médias." });
    }
  }

  /**
   * Récupère un média par son id
   */
  async getMediaById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const media = await this.service.getMediaById(id);
      if (!media) {
        return res.status(404).json({ error: "Media non trouvé." });
      }
      res.json(media);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération du média." });
    }
  }

  /**
   * Crée un média
   */
  async createMedia(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const parsed = createMediaSchema.safeParse({
        ...req.body,
        uploadedBy: userId,
      });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues });
      }
      const data = parsed.data;

      const media = await this.service.createMedia(data);
      res.status(201).json(media);
    } catch (error: any) {
      if (error.code === "23505") {
        // unique_url violation
        return res
          .status(409)
          .json({ error: "Ce média existe déjà (url unique)." });
      }
      res.status(500).json({ error: "Erreur lors de la création du média." });
    }
  }

  /**
   * Met à jour un média
   */
  async updateMedia(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = updateMediaSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues });
      }
      const data = parsed.data;

      const updated = await this.service.updateMedia(id, data);
      if (!updated) {
        return res.status(404).json({ error: "Media non trouvé." });
      }
      res.json(updated);
    } catch (error: any) {
      if (error.code === "23505") {
        // unique_url violation
        return res
          .status(409)
          .json({ error: "Ce média existe déjà (url unique)." });
      }
      res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour du média." });
    }
  }

  /**
   * Supprime un média
   */
  async deleteMedia(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await this.service.deleteMedia(id);
      if (!deleted) {
        return res.status(404).json({ error: "Media non trouvé." });
      }
      res.status(204).send();
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la suppression du média." });
    }
  }
}
