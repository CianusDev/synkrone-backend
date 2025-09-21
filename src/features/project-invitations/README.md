# 📄 Project Invitations (Invitations de projet)

Ce module gère les invitations envoyées par les entreprises aux freelances pour postuler à un projet.  
Il propose une API REST complète avec création, consultation, mise à jour, suppression et filtrage/pagination des invitations.

---

## Structure du module

- **project-invitations.model.ts** : Interface TypeScript et enum pour les invitations.
- **project-invitations.schema.ts** : Schémas Zod pour la validation des requêtes (body, params, filtres).
- **project-invitations.repository.ts** : Accès aux données (CRUD, filtres, pagination).
- **project-invitations.service.ts** : Logique métier (validation, pagination, etc.).
- **project-invitations.controller.ts** : Handlers Express, validation, réponses JSON.
- **project-invitations.route.ts** : Définition des routes Express.

---

## Modèle de données

```ts
export enum InvitationStatus {
  SENT = "sent",
  VIEWED = "viewed",
  ACCEPTED = "accepted",
  DECLINED = "declined",
  EXPIRED = "expired",
}

export interface ProjectInvitation {
  id: string;
  project_id: string;
  freelance_id: string;
  company_id: string;
  message?: string;
  status: InvitationStatus;
  sent_at: Date;
  responded_at?: Date | null;
  expires_at?: Date | null;
}
```

---

## Endpoints

### 1. Créer une invitation

`POST /api/project-invitations`

**Body :**
```json
{
  "project_id": "uuid",
  "freelance_id": "uuid",
  "company_id": "uuid",
  "message": "Je vous invite à postuler !",
  "status": "sent", // optionnel
  "expires_at": "2024-07-01T12:00:00.000Z" // optionnel
}
```

**Réponse :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Invitation créée avec succès"
}
```

---

### 2. Récupérer une invitation par ID

`GET /api/project-invitations/:id`

**Réponse :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Invitation récupérée avec succès"
}
```

---

### 3. Récupérer les invitations reçues par un freelance (avec filtres et pagination)

`GET /api/project-invitations/freelance/:freelanceId?page=1&limit=10&status=sent`

**Query params possibles :**
- `status`
- `page`
- `limit`

**Réponse :**
```json
{
  "success": true,
  "data": [ ... ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "message": "Liste des invitations reçues par le freelance récupérée avec succès"
}
```

---

### 4. Récupérer les invitations envoyées par une entreprise (avec filtres et pagination)

`GET /api/project-invitations/company/:companyId?page=1&limit=10&status=sent`

**Query params possibles :**
- `status`
- `page`
- `limit`

**Réponse :**
```json
{
  "success": true,
  "data": [ ... ],
  "total": 12,
  "page": 1,
  "limit": 10,
  "totalPages": 2,
  "message": "Liste des invitations envoyées par l'entreprise récupérée avec succès"
}
```

---

### 5. Récupérer les invitations pour un projet (avec filtres et pagination)

`GET /api/project-invitations/project/:projectId?page=1&limit=10&status=accepted`

**Query params possibles :**
- `status`
- `page`
- `limit`

**Réponse :**
```json
{
  "success": true,
  "data": [ ... ],
  "total": 7,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "message": "Liste des invitations pour le projet récupérée avec succès"
}
```

---

### 6. Filtrer les invitations (tous critères, via body)

`POST /api/project-invitations/filter`

**Body :**
```json
{
  "status": "declined",
  "freelanceId": "uuid",
  "companyId": "uuid",
  "projectId": "uuid",
  "page": 1,
  "limit": 10
}
```

**Réponse :**
```json
{
  "success": true,
  "data": [ ... ],
  "total": 3,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "message": "Liste des invitations filtrée récupérée avec succès"
}
```

---

### 7. Mettre à jour le statut d'une invitation

`PATCH /api/project-invitations/:id/status`

**Body :**
```json
{
  "status": "accepted",
  "responded_at": "2024-06-01T12:00:00.000Z"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Statut de l'invitation mis à jour avec succès"
}
```

---

### 8. Accepter une invitation (freelance)

`PATCH /api/project-invitations/:id/accept`

**Autorisations :** Freelance propriétaire de l'invitation

**Description :** Accepte une invitation et crée automatiquement une candidature pour le projet associé.

**Réponse :**
```json
{
  "success": true,
  "data": {
    "invitation": {
      "id": "uuid",
      "project_id": "uuid",
      "freelance_id": "uuid", 
      "company_id": "uuid",
      "message": "Je vous invite à postuler !",
      "status": "accepted",
      "sent_at": "2024-06-01T10:00:00.000Z",
      "responded_at": "2024-06-01T12:00:00.000Z",
      "expires_at": "2024-07-01T12:00:00.000Z"
    },
    "application": {
      "id": "uuid",
      "project_id": "uuid",
      "freelance_id": "uuid",
      "proposed_rate": 0,
      "cover_letter": "Candidature créée automatiquement suite à l'acceptation d'une invitation.",
      "status": "submitted",
      "submission_date": "2024-06-01T12:00:00.000Z",
      "response_date": null
    }
  },
  "message": "Invitation acceptée avec succès. Une candidature a été créée automatiquement."
}
```

**Restrictions :**
- Seul le freelance destinataire peut accepter l'invitation
- L'invitation doit avoir le statut `sent` ou `viewed`
- L'invitation ne doit pas être expirée
- Une candidature sera automatiquement créée pour le projet (sauf si elle existe déjà)

**Gestion des candidatures existantes :**
- Si une candidature existe déjà pour ce freelance sur ce projet, elle sera réutilisée ou réactivée
- Les candidatures `rejected` ou `withdrawn` sont réactivées avec mise à jour des données
- Les candidatures `submitted`, `under_review` ou `accepted` empêchent l'acceptation de l'invitation

---

### 9. Décliner une invitation (freelance)

`PATCH /api/project-invitations/:id/decline`

**Autorisations :** Freelance propriétaire de l'invitation

**Description :** Décline une invitation sans créer de candidature.

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "freelance_id": "uuid",
    "company_id": "uuid", 
    "message": "Je vous invite à postuler !",
    "status": "declined",
    "sent_at": "2024-06-01T10:00:00.000Z",
    "responded_at": "2024-06-01T12:00:00.000Z",
    "expires_at": "2024-07-01T12:00:00.000Z"
  },
  "message": "Invitation déclinée avec succès"
}
```

**Restrictions :**
- Seul le freelance destinataire peut décliner l'invitation
- L'invitation doit avoir le statut `sent` ou `viewed`

---

### 10. Supprimer une invitation

`DELETE /api/project-invitations/:id`

**Réponse :**
```json
{
  "success": true,
  "message": "Invitation supprimée avec succès"
}
```

---

## Notifications automatiques

Les endpoints d'acceptation et de déclinaison déclenchent automatiquement :

1. **Acceptation d'invitation :**
   - Mise à jour du statut à `accepted`
   - Création automatique d'une candidature (si aucune candidature n'existe)
   - Réactivation d'une candidature existante si elle a été `rejected` ou `withdrawn`
   - Gestion des erreurs si une candidature active existe déjà
   - Notification à l'entreprise
   - Utilisation des services `applications`, `notifications` et `user-notifications`

2. **Déclinaison d'invitation :**
   - Mise à jour du statut à `declined`
   - Notification à l'entreprise
   - Aucune candidature créée

## Gestion des contraintes de base de données

Le système respecte la contrainte unique `unique_application_per_project` qui empêche qu'un même freelance ait plusieurs candidatures actives pour le même projet :

- **Candidatures actives** : `submitted`, `under_review`, `accepted`
- **Candidatures inactives** : `rejected`, `withdrawn`

Lors de l'acceptation d'une invitation :
1. Vérification de l'existence d'une candidature
2. Si candidature active → erreur et annulation de l'acceptation
3. Si candidature inactive (`rejected`/`withdrawn`) → réactivation avec statut `submitted`
4. Si aucune candidature → création d'une nouvelle candidature

### Réactivation des candidatures inactives

Quand une invitation est acceptée et qu'une candidature `rejected` ou `withdrawn` existe :
- La candidature existante est réactivée (statut → `submitted`)
- Les données sont conservées (tarif proposé, lettre de motivation)
- La date de soumission est mise à jour
- La date de réponse est remise à null
- **L'historique est préservé** - aucune suppression de données

---

## Validation

- Toutes les entrées sont validées avec Zod (body, params, query).
- Les erreurs de validation retournent un code 400 et un message détaillé.

---

## Pagination & Filtres

- Les endpoints de liste acceptent `page`, `limit`, et `status` en query ou body.
- La réponse inclut toujours le nombre total d’éléments et de pages.

---

## Sécurité & Bonnes pratiques

- Les IDs sont validés (UUID).
- Les statuts sont limités aux valeurs de l’enum `InvitationStatus`.
- Les champs optionnels (`message`, `expires_at`, etc.) sont correctement typés et traités.
- Les middlewares d’authentification sont appliqués selon le rôle (freelance, company, admin).

---

## Exemple d’intégration

Dans ton app Express principale :

```ts
import projectInvitationsRoutes from "./src/features/project-invitations/project-invitations.route";
app.use("/api/project-invitations", projectInvitationsRoutes);
```

---

## Auteur & Contact

Pour toute question ou amélioration, contacte l’équipe backend.