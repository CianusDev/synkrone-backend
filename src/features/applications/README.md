# 📄 Feature Applications (Candidatures)

Ce module gère les candidatures des freelances sur les projets de la plateforme.  
Il propose une API REST complète avec création, consultation, mise à jour, suppression et filtrage/pagination des candidatures.

---

## Structure du module

- **applications.model.ts** : Interface TypeScript et enum pour les candidatures.
- **applications.schema.ts** : Schémas Zod pour la validation des requêtes (body, params, filtres).
- **applications.repository.ts** : Accès aux données (CRUD, filtres, pagination).
- **applications.service.ts** : Logique métier (validation, pagination, etc.).
- **applications.controller.ts** : Handlers Express, validation, réponses JSON.
- **applications.route.ts** : Définition des routes Express.

---

## Modèle de données

```ts
export enum ApplicationStatus {
  SUBMITTED = "submitted",
  UNDER_REVIEW = "under_review",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  WITHDRAWN = "withdrawn",
}

export interface Application {
  id: string;
  project_id: string;
  freelance_id: string;
  proposed_rate?: number;
  cover_letter?: string;
  status: ApplicationStatus;
  submission_date: Date;
  response_date?: Date | null;
  
  // Relations incluses dans les réponses GET
  freelance?: Partial<Freelance>;
  project?: Project;
  freelanceStats?: ApplicationStats;
  projectStats?: ApplicationStats;
}

export interface ApplicationStats {
  submitted: number;
  accepted: number;
  rejected: number;
  under_review: number;
  withdrawn: number;
  total: number;
}
```

---

## Endpoints

### 1. Créer une candidature

`POST /applications`

**Body :**
```json
{
  "project_id": "uuid",
  "freelance_id": "uuid",
  "proposed_rate": 500,
  "cover_letter": "Je suis motivé !",
  "status": "submitted" // optionnel
}
```

**Réponse :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Candidature créée avec succès"
}
```

---

### 2. Récupérer une candidature par ID

`GET /applications/:id`

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "freelance_id": "uuid",
    "proposed_rate": 500,
    "cover_letter": "Je suis motivé !",
    "status": "submitted",
    "submission_date": "2024-06-01T10:00:00.000Z",
    "response_date": null,
    "freelance": {
      "id": "uuid",
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      // ... autres infos freelance (sans password)
    },
    "project": {
      "id": "uuid",
      "title": "Application mobile React Native",
      "description": "Développement d'une app mobile",
      "budgetMin": 10000,
      "budgetMax": 15000,
      "status": "published",
      "company": {
        "id": "uuid",
        "company_name": "Tech Corp",
        "company_email": "contact@techcorp.com",
        "logo_url": "https://...",
        "industry": "Technology",
        "company_size": "medium",
        "is_verified": true
        // ... infos entreprise complètes
      }
      // ... autres infos projet
    },
    "freelanceStats": {
      "submitted": 5,
      "accepted": 2,
      "rejected": 1,
      "under_review": 1,
      "withdrawn": 1,
      "total": 10
    },
    "projectStats": {
      "submitted": 12,
      "accepted": 1,
      "rejected": 3,
      "under_review": 8,
      "withdrawn": 0,
      "total": 24
    }
  },
  "message": "Candidature récupérée avec succès"
}
```

---

### 3. Récupérer les candidatures d'un freelance (avec filtres et pagination)

`GET /applications/freelance/:freelanceId?page=1&limit=10&status=submitted`

**Query params possibles :**
- `status`
- `page`
- `limit`

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "freelance_id": "uuid",
      "proposed_rate": 500,
      "cover_letter": "Je suis motivé !",
      "status": "submitted",
      "submission_date": "2024-06-01T10:00:00.000Z",
      "response_date": null,
      "freelance": {
        "id": "uuid",
        "firstname": "John",
        "lastname": "Doe",
        // ... infos freelance
      },
      "project": {
        "id": "uuid", 
        "title": "Application mobile React Native",
        "description": "Développement d'une app mobile",
        "budgetMin": 10000,
        "budgetMax": 15000,
        "company": {
          "id": "uuid",
          "company_name": "Tech Corp",
          "company_email": "contact@techcorp.com",
          "industry": "Technology",
          "is_verified": true
          // ... infos entreprise complètes
        }
        // ... autres infos projet complètes
      }
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "stats": {
    "submitted": 15,
    "accepted": 8,
    "rejected": 12,
    "under_review": 5,
    "withdrawn": 2,
    "total": 42
  },
  "message": "Liste des candidatures du freelance récupérée avec succès"
}
```

---

### 4. Récupérer les candidatures d'un projet (avec filtres et pagination)

`GET /applications/project/:projectId?page=1&limit=10&status=accepted`

**Query params possibles :**
- `status`
- `page`
- `limit`

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "freelance_id": "uuid",
      "proposed_rate": 500,
      "cover_letter": "Je suis motivé !",
      "status": "submitted",
      "submission_date": "2024-06-01T10:00:00.000Z",
      "response_date": null,
      "freelance": {
        "id": "uuid",
        "firstname": "John",
        "lastname": "Doe",
        "email": "john@example.com",
        // ... infos complètes du freelance (sans password)
      },
      "project": {
        "id": "uuid",
        "title": "Application mobile React Native", 
        "description": "Développement d'une app mobile",
        "budgetMin": 10000,
        "budgetMax": 15000,
        "company": {
          "id": "uuid",
          "company_name": "Tech Corp",
          "company_email": "contact@techcorp.com",
          "logo_url": "https://...",
          "industry": "Technology",
          "company_size": "medium",
          "is_verified": true
          // ... infos entreprise complètes
        }
        // ... autres infos projet complètes
      }
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 10,
  "totalPages": 2,
  "stats": {
    "submitted": 8,
    "accepted": 1,
    "rejected": 2,
    "under_review": 1,
    "withdrawn": 0,
    "total": 12
  },
  "message": "Liste des candidatures du projet récupérée avec succès"
}
```

---

### 5. Filtrer les candidatures (tous critères, via body)

`POST /applications/filter`

**Body :**
```json
{
  "status": "under_review",
  "freelanceId": "uuid",
  "projectId": "uuid",
  "page": 1,
  "limit": 10
}
```

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "freelance_id": "uuid",
      "proposed_rate": 500,
      "cover_letter": "Je suis motivé !",
      "status": "under_review",
      "submission_date": "2024-06-01T10:00:00.000Z",
      "response_date": null,
      "freelance": {
        "id": "uuid",
        "firstname": "John",
        "lastname": "Doe",
        // ... infos freelance complètes
      },
      "project": {
        "id": "uuid",
        "title": "Application mobile React Native",
        "description": "Développement d'une app mobile",
        "budgetMin": 10000,
        "budgetMax": 15000,
        "company": {
          "id": "uuid",
          "company_name": "Tech Corp",
          "company_email": "contact@techcorp.com",
          "logo_url": "https://...",
          "industry": "Technology",
          "company_size": "medium",
          "is_verified": true
          // ... infos entreprise complètes
        }
        // ... autres infos projet complètes
      }
    }
  ],
  "total": 7,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "stats": {
    "submitted": 4,
    "accepted": 1,
    "rejected": 1,
    "under_review": 1,
    "withdrawn": 0,
    "total": 7
  },
  "message": "Liste des candidatures filtrée récupérée avec succès"
}
```

---

### 6. Mettre à jour le statut d'une candidature

`PATCH /applications/:id/status`

**Body :**
```json
{
  "status": "accepted",
  "response_date": "2024-06-01T12:00:00.000Z"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Statut de la candidature mis à jour avec succès"
}
```

---

### 7. Mettre à jour le contenu d'une candidature (freelance)

`PATCH /applications/:id/update`

**Body :**
```json
{
  "proposed_rate": 600,
  "cover_letter": "Nouvelle lettre de motivation mise à jour"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Candidature mise à jour avec succès"
}
```

**Restrictions :**
- Seul le freelance propriétaire peut modifier sa candidature
- Uniquement les candidatures avec le statut `submitted`
- Les candidatures `accepted`, `rejected`, `withdrawn` ou `under_review` ne peuvent pas être modifiées

---

### 8. Initialiser une négociation

`POST /applications/:id/initialize-negotiate`

**Description :** Crée ou récupère une conversation pour permettre la négociation entre l'entreprise et le freelance sur une candidature spécifique.

**Autorisations :** Entreprise ou Admin

**Réponse :**
```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": "uuid",
      "freelanceId": "uuid",
      "companyId": "uuid",
      "applicationId": "uuid",
      "createdAt": "2024-06-01T10:00:00.000Z",
      "updatedAt": null
    },
    "freelance": {
      "id": "uuid",
      "firstname": "John",
      "lastname": "Doe",
      "photoUrl": "https://..."
    },
    "company": {
      "id": "uuid",
      "companyName": "Tech Corp",
      "logoUrl": "https://..."
    },
    "lastMessage": null,
    "unreadCount": 0
  },
  "message": "Négociation initialisée avec succès"
}
```

---

### 9. Supprimer une candidature

`DELETE /applications/:id`

**Réponse :**
```json
{
  "success": true,
  "message": "Candidature supprimée avec succès"
}
```

---

## Gestion des candidatures multiples

Le système gère intelligemment les tentatives de candidatures multiples pour un même projet :

### Candidatures actives (bloquent la nouvelle candidature)
- `submitted` : "Une candidature est déjà en cours pour ce projet"
- `under_review` : "Une candidature est déjà en cours d'examen pour ce projet"
- `accepted` : "Vous avez déjà été accepté sur cette mission et ne pouvez pas repostuler"

### Candidatures inactives (permettent la réactivation)
- `rejected` : La candidature existante est réactivée avec les nouvelles données
- `withdrawn` : La candidature existante est réactivée avec les nouvelles données

### Comportement de réactivation
Quand un freelance tente de postuler à nouveau sur un projet où sa candidature a été rejetée ou retirée :
1. La candidature existante est mise à jour avec les nouvelles données (tarif, lettre de motivation)
2. Le statut passe automatiquement à `submitted`
3. La date de soumission est mise à jour à la date actuelle
4. La date de réponse est remise à null
5. **Aucune nouvelle entrée n'est créée** - l'historique est préservé

---

## Validation

- Toutes les entrées sont validées avec Zod (body, params, query).
- Les erreurs de validation retournent un code 400 et un message détaillé.

---

## Enrichissement des données

- **Tous les endpoints GET** incluent automatiquement :
  - Les informations complètes du **freelance** (sans mot de passe)
  - Les informations complètes du **projet** (avec entreprise intégrée)
  - Les **statistiques des candidatures** :
    - `freelanceStats` : pour `GET /applications/:id` - statistiques du freelance
    - `projectStats` : pour `GET /applications/:id` - statistiques du projet
    - `stats` : pour les endpoints de liste - statistiques contextuelles
- Optimisation : pour les listes par projet, les infos projet ne sont récupérées qu'une fois

## Statistiques des candidatures

Les statistiques incluent le nombre de candidatures par statut :
- `submitted` : candidatures soumises
- `accepted` : candidatures acceptées  
- `rejected` : candidatures rejetées
- `under_review` : candidatures en cours d'examen
- `withdrawn` : candidatures retirées
- `total` : nombre total de candidatures

**Contexte des statistiques :**
- `GET /applications/freelance/:freelanceId` → statistiques du freelance
- `GET /applications/project/:projectId` → statistiques du projet
- `POST /applications/filter` → statistiques selon les filtres (freelance ou projet)

## Pagination & Filtres

- Les endpoints de liste acceptent `page`, `limit`, et `status` en query ou body.
- La réponse inclut toujours le nombre total d'éléments et de pages.

---

## Sécurité & Bonnes pratiques

- Les IDs sont validés (UUID).
- Les statuts sont limités aux valeurs de l’enum `ApplicationStatus`.
- Les champs optionnels (`cover_letter`, etc.) sont correctement typés et traités.

---

## Exemple d’intégration

Dans ton app Express principale :

```ts
import applicationsRouter from "./src/features/applications/applications.route";
app.use("/applications", applicationsRouter);
```

---

## Auteur & Contact

Pour toute question ou amélioration, contacte l’équipe backend.
