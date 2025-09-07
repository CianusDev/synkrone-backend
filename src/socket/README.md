# Module Socket - Notifications en Temps Réel

Ce module gère la connexion des utilisateurs au serveur Socket.IO pour la réception des notifications en temps réel sur la plateforme Synkrone.

---

## Fonctionnalité principale

- **Authentification du socket** : Lorsqu'un client se connecte, il doit fournir un token JWT via `socket.handshake.auth.token`.
- **Vérification du token** : Le token est vérifié pour tous les types d'utilisateurs (`freelance`, `company`, `admin`, etc.) grâce à la fonction unifiée `verifyUserToken`.
- **Room dédiée** : Chaque utilisateur est placé dans une "room" correspondant à son `user.id`. Cela permet d'envoyer des notifications ciblées à un utilisateur précis.
- **Sécurité** : Si le token est absent ou invalide, la connexion est immédiatement rejetée (`socket.disconnect()`).

---

## Exemple de workflow

1. **Connexion du client**  
   Le client Next.js (ou autre) se connecte au serveur Socket.IO en passant le token JWT dans l'objet `auth` :
   ```js
   const socket = io('https://backend-url', {
     auth: { token: 'JWT_TOKEN' }
   });
   ```

2. **Vérification côté serveur**  
   Le serveur vérifie le token :
   ```js
   const { user, role } = verifyUserToken(token);
   ```

3. **Placement dans la room**  
   Si le token est valide, l'utilisateur est placé dans la room :
   ```js
   socket.join(user.id);
   ```

4. **Emission d'une notification**  
   Pour envoyer une notification à un utilisateur :
   ```js
   io.to(user.id).emit('notification.new', notificationPayload);
   ```

---

## Exemple de code

```ts
import { io } from "../server";
import { verifyUserToken } from "../utils/utils";

io.on("connection", async (socket) => {
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
    `Utilisateur (${type}) ${user.id} connecté au socket de notifications`,
  );
});
```

---

## Bonnes pratiques

- **Toujours vérifier le token à la connexion** pour éviter les connexions non autorisées.
- **Utiliser les rooms** pour envoyer des notifications ciblées et éviter le broadcast inutile.
- **Déconnecter immédiatement les sockets non authentifiés** pour garantir la sécurité.

---

## Utilisation côté client

```js
import { io } from "socket.io-client";

const socket = io("https://backend-url", {
  auth: { token: "JWT_TOKEN" }
});

socket.on("notification.new", (data) => {
  // Afficher la notification en temps réel
  console.log("Nouvelle notification reçue :", data);
});
```

---

## Pour aller plus loin

- Gérer la reconnexion automatique côté client.
- Ajouter des événements pour marquer les notifications comme lues.
- Gérer les déconnexions et les erreurs côté serveur et client.

---

**Auteur** : Synkrone Backend Team  
**Dernière mise à jour** : 2024-06
