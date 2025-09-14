import {
  ConversationRepository,
  ConversationWithDetails,
} from "./conversation.repository";
import { Conversation } from "./conversation.model";

export class ConversationService {
  private readonly repository: ConversationRepository;

  constructor() {
    this.repository = new ConversationRepository();
  }

  /**
   * Crée une conversation ou retourne l'existante (évite les doublons)
   */
  async createOrGetConversation(
    data: Partial<Conversation>,
  ): Promise<ConversationWithDetails> {
    let conversation = await this.repository.findConversation(
      data.freelanceId!,
      data.companyId!,
    );
    if (!conversation) {
      const created = await this.repository.createConversation(data);
      conversation = await this.repository.findConversation(
        created.freelanceId,
        created.companyId,
      );
    }
    return conversation!;
  }

  /**
   * Récupère une conversation par son ID
   */
  async getConversationById(id: string): Promise<Conversation | null> {
    return this.repository.getConversationById(id);
  }

  /**
   * Trouve une conversation existante entre un freelance et une entreprise (avec détails)
   */
  async findConversation(
    freelanceId: string,
    companyId: string,
  ): Promise<ConversationWithDetails | null> {
    return this.repository.findConversation(freelanceId, companyId);
  }

  /**
   * Récupère toutes les conversations d'un utilisateur (avec détails, pagination supportée)
   * @param userId - ID de l'utilisateur
   * @param limit - Nombre d'éléments par page (défaut : 20)
   * @param offset - Décalage (défaut : 0)
   */
  async getConversationsForUser(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<ConversationWithDetails[]> {
    return this.repository.getConversationsForUser(userId, limit, offset);
  }
}
