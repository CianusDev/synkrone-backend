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
  "data": { ... },
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
  "data": [ ... ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5,
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
  "data": [ ... ],
  "total": 12,
  "page": 1,
  "limit": 10,
  "totalPages": 2,
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
  "data": [ ... ],
  "total": 7,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
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

### 7. Supprimer une candidature

`DELETE /applications/:id`

**Réponse :**
```json
{
  "success": true,
  "message": "Candidature supprimée avec succès"
}
```

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
