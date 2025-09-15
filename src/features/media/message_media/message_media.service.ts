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
    console.log(
      `🔗 MessageMediaService.addMediaToMessage called: messageId=${messageId}, mediaId=${mediaId}`,
    );

    // Vérifier que le message existe
    console.log(`🔍 Checking if message exists: ${messageId}`);
    const messageExists = await this.repository.messageExists(messageId);
    console.log(`📊 Message exists: ${messageExists}`);
    if (!messageExists) {
      console.log(`❌ Message not found: ${messageId}`);
      throw new Error("Message introuvable");
    }

    // Vérifier que le média existe
    console.log(`🔍 Checking if media exists: ${mediaId}`);
    const mediaExists = await this.repository.mediaExists(mediaId);
    console.log(`📊 Media exists: ${mediaExists}`);
    if (!mediaExists) {
      console.log(`❌ Media not found: ${mediaId}`);
      throw new Error("Media introuvable");
    }

    // Vérifier qu'il n'y a pas déjà une association
    console.log(`🔍 Checking if media is already linked to message`);
    const alreadyLinked = await this.repository.isMediaLinkedToMessage(
      messageId,
      mediaId,
    );
    console.log(`📊 Already linked: ${alreadyLinked}`);
    if (alreadyLinked) {
      console.log(
        `⚠️ Media ${mediaId} is already associated to message ${messageId}`,
      );
      throw new Error("Ce média est déjà associé à ce message");
    }

    // Créer l'association
    console.log(
      `✅ Creating association between message ${messageId} and media ${mediaId}`,
    );
    const result = await this.repository.addMediaToMessage(messageId, mediaId);
    console.log(`✅ Association created successfully:`, result);
    return result;
  }

  /**
   * Récupère tous les médias associés à un message
   * @param messageId - L'ID du message
   */
  async getMediaForMessage(messageId: string) {
    console.log(
      `🔍 MessageMediaService.getMediaForMessage called for messageId: ${messageId}`,
    );
    const result = await this.repository.getMediaForMessage(messageId);
    console.log(
      `📊 MessageMediaService.getMediaForMessage returning ${result?.length || 0} links:`,
      result,
    );
    return result;
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
