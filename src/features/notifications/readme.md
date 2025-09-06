# 📢 Notifications - Synkrone Backend

Ce module gère la création et la gestion des notifications globales ou ciblées pour la plateforme Synkrone. Il est conçu pour être scalable, sécurisé et facilement intégrable avec la feature user-notifications pour le suivi utilisateur et le temps réel.

---

## Fonctionnement général

- Les notifications sont créées par l’admin ou le backend dans la table `notifications`.
- Chaque notification peut être globale (`is_global: true`) ou ciblée (`is_global: false`).
- La liaison entre une notification et les utilisateurs ciblés se fait via la table `user_notifications` (voir le module dédié).
- Les notifications ne contiennent pas d’information sur le statut lu/non lu : cette gestion est déléguée à `user_notifications`.

---

## Structure des données

### Modèle Notification

```ts
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationTypeEnum;
  is_global: boolean;
  created_at: Date;
  updated_at: Date | null;
}
```

- Les types de notification sont : `project`, `application`, `payment`, `message`, `system`.

---

## API REST (admin uniquement)

Toutes les routes sont protégées par le middleware `AuthAdminMiddleware`.

### Endpoints principaux

#### 1. Créer une notification

```
POST /api/notifications
Content-Type: application/json
Authorization: Bearer ADMIN_TOKEN

{
  "title": "Titre de la notification",
  "message": "Contenu du message",
  "type": "system",
  "is_global": true
}
```

#### 2. Récupérer la liste paginée des notifications

```
GET /api/notifications?page=1&limit=10
Authorization: Bearer ADMIN_TOKEN
```

#### 3. Récupérer une notification par ID

```
GET /api/notifications/:id
Authorization: Bearer ADMIN_TOKEN
```

#### 4. Mettre à jour une notification

```
PATCH /api/notifications/:id
Content-Type: application/json
Authorization: Bearer ADMIN_TOKEN

{
  "title": "Nouveau titre",
  "message": "Nouveau message",
  "type": "system",
  "is_global": false
}
```

#### 5. Supprimer une notification

```
DELETE /api/notifications/:id
Authorization: Bearer ADMIN_TOKEN
```

---

## Structure scalable & intégration

- Les notifications sont stockées dans une table dédiée, sans information utilisateur.
- La table `user_notifications` permet de lier chaque notification à un ou plusieurs utilisateurs, et de suivre le statut lu/non lu.
- Cette architecture permet :
  - Les notifications globales (envoyées à tous)
  - Les notifications ciblées (envoyées à certains utilisateurs)
  - Un suivi efficace et scalable côté utilisateur

---

## Sécurité

- Seuls les administrateurs authentifiés peuvent créer, modifier ou supprimer des notifications.
- Les utilisateurs ne peuvent pas accéder directement à la table `notifications` : ils passent par `user_notifications` pour consulter leurs notifications.

---

## Extensibilité

- Facile à intégrer avec le module user-notifications pour le temps réel (Socket.IO).
- Possibilité d’ajouter des filtres, des types personnalisés, des notifications programmées, etc.
- Prêt pour la gestion de gros volumes et la croissance de la plateforme.

---

## Pour aller plus loin

- Ajouter des filtres avancés (par type, par date, etc.) dans la récupération des notifications.
- Intégrer des notifications push (mobile) en complément du temps réel web.
- Ajouter des logs et des audits pour le suivi des notifications envoyées.

---

**Contact :**  
Pour toute question ou évolution, contactez l’équipe backend Synkrone.