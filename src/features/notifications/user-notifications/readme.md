# 📬 User Notifications - Synkrone Backend

Ce module gère les notifications utilisateur pour la plateforme Synkrone. Il permet à chaque utilisateur (freelance ou entreprise) de recevoir, consulter, marquer comme lue et supprimer ses notifications, en temps réel grâce à Socket.IO.

---

## Fonctionnement général

- Les notifications sont créées par l’admin ou le backend dans la table `notifications`.
- La table `user_notifications` fait le lien entre chaque notification et chaque utilisateur ciblé.
- Chaque notification utilisateur possède un statut lu/non lu (`is_read`).
- Les notifications sont envoyées en temps réel au front via Socket.IO dès leur création.

---

## API REST

### Authentification

Toutes les routes sont protégées par les middlewares :
- `AuthFreelanceMiddleware` (pour les freelances)
- `AuthCompanyMiddleware` (pour les entreprises)

---

### Endpoints principaux

#### 1. Récupérer les notifications utilisateur

```
GET /api/user-notifications?user_id=USER_UUID&page=1&limit=10
```
- Retourne la liste paginée des notifications pour l’utilisateur.
- Inclut les données de la notification liée.

#### 2. Marquer une notification comme lue

```
PATCH /api/user-notifications/:id/read
```
- Marque la notification utilisateur (user_notification) comme lue.

#### 3. Supprimer une notification utilisateur

```
DELETE /api/user-notifications/:id
```
- Supprime la notification utilisateur (ne supprime pas la notification globale).

#### 4. Marquer toutes les notifications comme lues

```
PATCH /api/user-notifications/read-all?user_id=USER_UUID
```
- Marque toutes les notifications de l’utilisateur comme lues.

---

## Temps réel avec Socket.IO

### Connexion

- Le front se connecte à Socket.IO en envoyant le token JWT dans `auth.token`.
- Le backend authentifie l’utilisateur et le place dans une room dédiée à son `user_id`.

```js
const socket = io("http://localhost:5000", {
  auth: { token: "USER_JWT_TOKEN" }
});
```

### Réception des notifications

- Lorsqu’une notification utilisateur est créée, le backend émet l’événement :

```js
socket.on("notification:new", (data) => {
  // Affiche la notification en temps réel
});
```

- Le front reçoit instantanément la notification et peut l’afficher à l’utilisateur.

---

## Structure des données

### Modèle UserNotification

```ts
export interface UserNotification {
  id: string;
  user_id: string;
  notification_id: string;
  is_read: boolean;
  created_at: Date;
  updated_at: Date | null;
  notification?: Notification; // Données de la notification liée
}
```

---

## Sécurité

- Seuls les utilisateurs authentifiés peuvent accéder à leurs notifications.
- Les notifications sont isolées par utilisateur (room Socket.IO = user_id).

---

## Extensibilité

- Possibilité d’ajouter des événements temps réel pour le marquage comme lu, suppression, etc.
- Facile à intégrer avec le front pour une UX moderne et réactive.

---

## Pour aller plus loin

- Ajouter des filtres (par type, par date, etc.) dans la récupération des notifications.
- Gérer les notifications push (mobile) en complément du temps réel web.
- Ajouter des tests automatisés pour garantir la fiabilité du module.

---

**Contact :**  
Pour toute question ou évolution, contactez l’équipe backend Synkrone.