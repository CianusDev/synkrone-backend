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
  metadata?: Record<string, any> | null;
  created_at: Date;
  updated_at: Date | null;
}
```

- Les types de notification sont : `project`, `application`, `payment`, `message`, `system`.
- Le champ `metadata` (JSONB) permet de stocker des données contextuelles liées à la notification.

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
  "is_global": true,
  "metadata": {
    "priority": "high",
    "category": "maintenance"
  }
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
  "is_global": false,
  "metadata": {
    "user_id": "uuid-123",
    "action": "profile_update"
  }
}
```

#### 5. Supprimer une notification

```
DELETE /api/notifications/:id
Authorization: Bearer ADMIN_TOKEN
```

---

## Usage des métadonnées (metadata)

Le champ `metadata` permet de stocker des informations contextuelles structurées :

### Exemples d'usage

**Notification de projet** :
```json
{
  "type": "project",
  "title": "Nouveau projet disponible",
  "message": "Un projet correspond à vos compétences",
  "metadata": {
    "project_id": "uuid-project",
    "company_name": "TechCorp",
    "budget_range": "2000-5000",
    "skills": ["React", "Node.js"],
    "deadline": "2024-03-15"
  }
}
```

**Notification de paiement** :
```json
{
  "type": "payment",
  "title": "Paiement reçu",
  "message": "Votre paiement de 1500€ a été traité",
  "metadata": {
    "contract_id": "uuid-contract",
    "amount": 1500.00,
    "currency": "EUR",
    "payment_method": "bank_transfer",
    "transaction_id": "TXN-123456"
  }
}
```

**Notification système** :
```json
{
  "type": "system",
  "title": "Maintenance programmée",
  "message": "La plateforme sera indisponible de 2h à 4h",
  "metadata": {
    "priority": "high",
    "affected_services": ["payments", "messaging"],
    "start_time": "2024-01-15T02:00:00Z",
    "end_time": "2024-01-15T04:00:00Z"
  }
}
```

### Avantages des métadonnées

- **Contexte riche** : Informations détaillées sans surcharger le message
- **Filtrage avancé** : Possibilité de filtrer les notifications par métadonnées
- **Actions dynamiques** : Le frontend peut proposer des actions basées sur les métadonnées
- **Analytics** : Suivi des performances par type de notification ou contexte

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