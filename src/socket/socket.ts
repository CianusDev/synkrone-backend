import { io } from "../server";
import { verifyUserToken } from "../utils/utils";
import { presenceService } from "../features/presence/presence.service";
import { PresenceEvent } from "../features/presence/presence.model";

io.on("connection", (socket) => {
  console.log("Nouvelle connexion socket !", socket.id);

  const token = socket.handshake.auth?.token;
  if (!token) {
    socket.disconnect();
    return;
  }

  // Vérifie le token pour n'importe quel type d'utilisateur
  const { user, role } = verifyUserToken(token);
  const type = role;

  if (!user || !user.id) {
    socket.disconnect();
    return;
  }

  // Place l'utilisateur dans une room dédiée à son user_id
  socket.join(user.id);
  console.log(
    `Utilisateur (${type}) ${user.id} connecté au socket - ID: ${socket.id}`,
  );

  // Gérer les événements de présence
  socket.on(PresenceEvent.UserOnline, (data) => {
    try {
      const { userId } = data;
      if (userId !== user.id) {
        console.warn(
          `Tentative de présence pour un autre utilisateur: ${userId} != ${user.id}`,
        );
        return;
      }

      const presence = presenceService.setUserOnline(userId, socket.id);

      // Notifier tous les autres utilisateurs que cet utilisateur est en ligne
      socket.broadcast.emit(PresenceEvent.UserOnline, {
        userId: presence.userId,
        isOnline: presence.isOnline,
        lastSeen: presence.lastSeen,
      });

      console.log(`📢 User ${userId} presence broadcasted as online`);
    } catch (error) {
      console.error("Erreur lors de la gestion user_online:", error);
    }
  });

  socket.on(PresenceEvent.UserOffline, (data) => {
    try {
      const { userId } = data;
      if (userId !== user.id) {
        console.warn(
          `Tentative de présence pour un autre utilisateur: ${userId} != ${user.id}`,
        );
        return;
      }

      const presence = presenceService.setUserOffline(userId, socket.id);
      if (presence && !presence.isOnline) {
        // Notifier tous les autres utilisateurs que cet utilisateur est hors ligne
        socket.broadcast.emit(PresenceEvent.UserOffline, {
          userId: presence.userId,
          isOnline: presence.isOnline,
          lastSeen: presence.lastSeen,
        });

        console.log(`📢 User ${userId} presence broadcasted as offline`);
      }
    } catch (error) {
      console.error("Erreur lors de la gestion user_offline:", error);
    }
  });

  // Gérer les événements de typing
  socket.on(PresenceEvent.UserTypingStart, (data) => {
    try {
      const { userId, conversationId } = data;
      if (userId !== user.id) {
        console.warn(
          `Tentative de typing pour un autre utilisateur: ${userId} != ${user.id}`,
        );
        return;
      }

      if (!conversationId) {
        console.warn("conversationId manquant pour user_typing_start");
        return;
      }

      const typing = presenceService.startUserTyping(userId, conversationId);

      // Notifier tous les autres participants de la conversation
      socket.broadcast.emit(PresenceEvent.UserTypingStart, {
        userId: typing.userId,
        conversationId: typing.conversationId,
        isTyping: typing.isTyping,
      });

      console.log(
        `⌨️ User ${userId} started typing in conversation ${conversationId}`,
      );
    } catch (error) {
      console.error("Erreur lors de la gestion user_typing_start:", error);
    }
  });

  socket.on(PresenceEvent.UserTypingStop, (data) => {
    try {
      const { userId } = data;
      if (userId !== user.id) {
        console.warn(
          `Tentative de typing pour un autre utilisateur: ${userId} != ${user.id}`,
        );
        return;
      }

      // Arrêter le typing dans toutes les conversations
      presenceService.stopUserTyping(userId);

      // Notifier tous les autres utilisateurs
      socket.broadcast.emit(PresenceEvent.UserTypingStop, {
        userId: userId,
      });

      console.log(`✋ User ${userId} stopped typing`);
    } catch (error) {
      console.error("Erreur lors de la gestion user_typing_stop:", error);
    }
  });

  // Gérer la demande de statut d'un utilisateur
  socket.on("get_user_status", (data) => {
    try {
      const { userId } = data;
      if (!userId) {
        console.warn("userId manquant pour get_user_status");
        return;
      }

      const presence = presenceService.getUserPresence(userId);

      // Répondre avec le statut actuel
      socket.emit("user_status", {
        userId: userId,
        isOnline: presence?.isOnline || false,
        lastSeen: presence?.lastSeen || new Date(),
      });

      console.log(
        `📊 Statut envoyé pour ${userId}: ${presence?.isOnline ? "online" : "offline"}`,
      );
    } catch (error) {
      console.error("Erreur lors de la gestion get_user_status:", error);
    }
  });

  // Gérer la déconnexion
  socket.on("disconnect", (reason) => {
    try {
      console.log(
        `❌ Socket ${socket.id} disconnected (${reason}) - User: ${user.id}`,
      );

      // Marquer l'utilisateur comme hors ligne et nettoyer
      const affectedUsers = presenceService.cleanupSocket(socket.id);

      // Notifier les autres utilisateurs des changements de présence
      affectedUsers.forEach((userId) => {
        const presence = presenceService.getUserPresence(userId);
        if (presence && !presence.isOnline) {
          // Utiliser io.emit pour diffuser à tous les sockets connectés
          io.emit(PresenceEvent.UserOffline, {
            userId: presence.userId,
            isOnline: presence.isOnline,
            lastSeen: presence.lastSeen,
          });
          console.log(`📢 User ${userId} disconnection broadcasted to all`);
        }
      });

      // Logs des statistiques
      const stats = presenceService.getPresenceStats();
      console.log(`📊 Presence stats:`, stats);
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  });

  // Marquer automatiquement l'utilisateur comme en ligne à la connexion
  const presence = presenceService.setUserOnline(user.id, socket.id);

  // Notifier les autres de la connexion immédiatement
  socket.broadcast.emit(PresenceEvent.UserOnline, {
    userId: presence.userId,
    isOnline: presence.isOnline,
    lastSeen: presence.lastSeen,
  });

  console.log(`✅ User ${user.id} automatically marked as online`);
  console.log("Rooms du socket après join :", Array.from(socket.rooms));
});
