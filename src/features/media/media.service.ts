import { MediaRepository } from "./media.repository";
import { Media, MediaType } from "./media.model";

export class MediaService {
  private readonly repository: MediaRepository;

  constructor() {
    this.repository = new MediaRepository();
  }

  /**
   * Crée un média
   */
  async createMedia(data: {
    url: string;
    type: MediaType;
    uploadedBy?: string;
    description?: string;
  }): Promise<Media> {
    // Ici, tu peux ajouter des vérifications métier si besoin
    return this.repository.createMedia(data);
  }

  /**
   * Récupère un média par son id
   */
  async getMediaById(id: string): Promise<Media | null> {
    return this.repository.getMediaById(id);
  }

  /**
   * Met à jour un média
   */
  async updateMedia(id: string, data: Partial<Omit<Media, "id" | "uploadedAt">>): Promise<Media | null> {
    // Vérifications métier possibles ici
    return this.repository.updateMedia(id, data);
  }

  /**
   * Supprime un média
   */
  async deleteMedia(id: string): Promise<boolean> {
    return this.repository.deleteMedia(id);
  }

  /**
   * Liste les médias (optionnel: filtrer par type ou uploader)
   */
  async listMedia(params?: { type?: MediaType; uploadedBy?: string }): Promise<Media[]> {
    return this.repository.listMedia(params);
  }
}
