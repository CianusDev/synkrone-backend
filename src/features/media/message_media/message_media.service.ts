import { MessageMediaRepository } from "./message_media.repository";

export class MessageMediaService {
  private readonly repository: MessageMediaRepository;

  constructor() {
    this.repository = new MessageMediaRepository();
  }

  /**
   * Associe un média à un message
   * @param messageId - L'ID du message
   * @param mediaId - L'ID du média
   */
  async addMediaToMessage(messageId: string, mediaId: string) {
    // Vérifier que le message existe
    const messageExists = await this.repository.messageExists(messageId);
    if (!messageExists) {
      throw new Error("Message introuvable");
    }

    // Vérifier que le média existe
    const mediaExists = await this.repository.mediaExists(mediaId);
    if (!mediaExists) {
      throw new Error("Media introuvable");
    }

    // Vérifier qu'il n'y a pas déjà une association
    const alreadyLinked = await this.repository.isMediaLinkedToMessage(
      messageId,
      mediaId,
    );
    if (alreadyLinked) {
      throw new Error("Ce média est déjà associé à ce message");
    }

    // Créer l'association
    return this.repository.addMediaToMessage(messageId, mediaId);
  }

  /**
   * Récupère tous les médias associés à un message
   * @param messageId - L'ID du message
   */
  async getMediaForMessage(messageId: string) {
    return this.repository.getMediaForMessage(messageId);
  }

  /**
   * Supprime l'association entre un média et un message
   * @param messageId - L'ID du message
   * @param mediaId - L'ID du média
   */
  async removeMediaFromMessage(messageId: string, mediaId: string) {
    return this.repository.removeMediaFromMessage(messageId, mediaId);
  }
}
