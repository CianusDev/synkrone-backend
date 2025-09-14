import { UserPresence, TypingStatus } from "./presence.model";

export class PresenceService {
  private connectedUsers: Map<string, UserPresence> = new Map();
  private typingUsers: Map<string, TypingStatus> = new Map();
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  /**
   * Ajoute un utilisateur comme connecté
   */
  setUserOnline(userId: string, socketId: string): UserPresence {
    const now = new Date();

    // Ajouter le socketId à la liste des sockets de l'utilisateur
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);

    // Créer ou mettre à jour la présence
    const presence: UserPresence = {
      userId,
      socketId,
      isOnline: true,
      lastSeen: now,
      connectedAt: now,
    };

    this.connectedUsers.set(userId, presence);
    console.log(`🟢 User ${userId} is now online (socket: ${socketId})`);

    return presence;
  }

  /**
   * Marque un utilisateur comme hors ligne
   */
  setUserOffline(userId: string, socketId?: string): UserPresence | null {
    const presence = this.connectedUsers.get(userId);
    if (!presence) return null;

    // Retirer le socketId spécifique
    if (socketId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(socketId);

      // Si l'utilisateur a encore d'autres sockets connectées, ne pas le marquer offline
      if (this.userSockets.get(userId)!.size > 0) {
        console.log(`🔶 Socket ${socketId} disconnected for user ${userId}, but user still has other connections`);
        return presence;
      }
    }

    // Marquer comme offline
    const updatedPresence: UserPresence = {
      ...presence,
      isOnline: false,
      lastSeen: new Date(),
    };

    this.connectedUsers.set(userId, updatedPresence);

    // Nettoyer les sockets
    this.userSockets.delete(userId);

    // Arrêter le typing si l'utilisateur était en train de taper
    this.stopUserTyping(userId);

    console.log(`🔴 User ${userId} is now offline`);
    return updatedPresence;
  }

  /**
   * Récupère le statut de présence d'un utilisateur
   */
  getUserPresence(userId: string): UserPresence | null {
    return this.connectedUsers.get(userId) || null;
  }

  /**
   * Récupère tous les utilisateurs connectés
   */
  getAllOnlineUsers(): UserPresence[] {
    return Array.from(this.connectedUsers.values()).filter(u => u.isOnline);
  }

  /**
   * Vérifie si un utilisateur est en ligne
   */
  isUserOnline(userId: string): boolean {
    const presence = this.connectedUsers.get(userId);
    return presence?.isOnline || false;
  }

  /**
   * Démarre l'indicateur de typing pour un utilisateur
   */
  startUserTyping(userId: string, conversationId: string): TypingStatus {
    const typingKey = `${userId}_${conversationId}`;
    const typing: TypingStatus = {
      userId,
      conversationId,
      isTyping: true,
      startedAt: new Date(),
    };

    this.typingUsers.set(typingKey, typing);
    console.log(`✍️ User ${userId} started typing in conversation ${conversationId}`);

    return typing;
  }

  /**
   * Arrête l'indicateur de typing pour un utilisateur
   */
  stopUserTyping(userId: string, conversationId?: string): void {
    if (conversationId) {
      const typingKey = `${userId}_${conversationId}`;
      this.typingUsers.delete(typingKey);
      console.log(`✋ User ${userId} stopped typing in conversation ${conversationId}`);
    } else {
      // Arrêter le typing dans toutes les conversations pour cet utilisateur
      const keysToDelete: string[] = [];
      this.typingUsers.forEach((typing, key) => {
        if (typing.userId === userId) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => {
        this.typingUsers.delete(key);
      });

      if (keysToDelete.length > 0) {
        console.log(`✋ User ${userId} stopped typing in all conversations`);
      }
    }
  }

  /**
   * Récupère les utilisateurs qui tapent dans une conversation
   */
  getTypingUsersInConversation(conversationId: string): TypingStatus[] {
    return Array.from(this.typingUsers.values()).filter(
      typing => typing.conversationId === conversationId
    );
  }

  /**
   * Récupère le statut de typing d'un utilisateur dans une conversation
   */
  getUserTypingStatus(userId: string, conversationId: string): TypingStatus | null {
    const typingKey = `${userId}_${conversationId}`;
    return this.typingUsers.get(typingKey) || null;
  }

  /**
   * Nettoie les anciennes sessions de typing (appelé périodiquement)
   */
  cleanupOldTypingSessions(maxAge: number = 10000): void {
    const now = new Date();
    const keysToDelete: string[] = [];

    this.typingUsers.forEach((typing, key) => {
      if (now.getTime() - typing.startedAt.getTime() > maxAge) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      const typing = this.typingUsers.get(key);
      this.typingUsers.delete(key);
      console.log(`🧹 Cleaned up old typing session for user ${typing?.userId}`);
    });
  }

  /**
   * Nettoie la présence d'un socket spécifique
   */
  cleanupSocket(socketId: string): string[] {
    const affectedUsers: string[] = [];

    // Trouver tous les utilisateurs affectés par cette déconnexion
    this.userSockets.forEach((sockets, userId) => {
      if (sockets.has(socketId)) {
        affectedUsers.push(userId);
        this.setUserOffline(userId, socketId);
      }
    });

    return affectedUsers;
  }

  /**
   * Récupère les statistiques de présence
   */
  getPresenceStats() {
    const totalUsers = this.connectedUsers.size;
    const onlineUsers = this.getAllOnlineUsers().length;
    const typingUsers = this.typingUsers.size;

    return {
      totalUsers,
      onlineUsers,
      offlineUsers: totalUsers - onlineUsers,
      typingUsers,
      activeSockets: Array.from(this.userSockets.values()).reduce(
        (total, sockets) => total + sockets.size, 0
      ),
    };
  }
}

// Instance singleton
export const presenceService = new PresenceService();

// Nettoyage périodique des sessions de typing
setInterval(() => {
  presenceService.cleanupOldTypingSessions();
}, 30000); // Nettoyage toutes les 30 secondes
