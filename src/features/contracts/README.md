# 📄 Contracts (Contrats)

Ce module gère les contrats entre freelances et entreprises pour les projets de la plateforme.  
Il propose une API REST complète avec création, consultation, mise à jour, suppression et filtrage/pagination des contrats.

---

## Structure du module

- **contracts.model.ts** : Interface TypeScript et enums pour les contrats.
- **contracts.schema.ts** : Schémas Zod pour la validation des requêtes (body, params, filtres).
- **contracts.repository.ts** : Accès aux données (CRUD, filtres, pagination).
- **contracts.service.ts** : Logique métier (validation, pagination, etc.).
- **contracts.controller.ts** : Handlers Express, validation, réponses JSON.
- **contracts.route.ts** : Définition des routes Express.

---

## Modèle de données

```ts
export enum ContractStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  SUSPENDED = "suspended",
}

export enum PaymentMode {
  BY_MILESTONE = "by_milestone",
  FINAL_PAYMENT = "final_payment",
}

export interface Contract {
  id: string;
  application_id: string;
  project_id: string;
  freelance_id: string;
  company_id: string;
  agreed_rate?: number;
  payment_mode: PaymentMode;
  terms?: string;
  start_date?: Date;
  end_date?: Date;
  status: ContractStatus;
  created_at: Date;
}
```

---

## Endpoints

### 1. Créer un contrat

`POST /api/contracts`

**Body :**
```json
{
  "application_id": "uuid",
  "project_id": "uuid",
  "freelance_id": "uuid",
  "company_id": "uuid",
  "agreed_rate": 1200,
  "payment_mode": "by_milestone",
  "terms": "Conditions du contrat...",
  "start_date": "2024-07-01",
  "end_date": "2024-08-01",
  "status": "draft" // optionnel
}
```

**Réponse :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Contrat créé avec succès"
}
```

---

### 2. Récupérer un contrat par ID

`GET /api/contracts/:id`

**Réponse :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Contrat récupéré avec succès"
}
```

---

### 3. Récupérer les contrats d'un freelance (avec filtres et pagination)

`GET /api/contracts/freelance/:freelanceId?page=1&limit=10&status=active`

**Query params possibles :**
- `status`
- `page`
- `limit`
- `paymentMode`

**Réponse :**
```json
{
  "success": true,
  "data": [ ... ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "message": "Liste des contrats du freelance récupérée avec succès"
}
```

---

### 4. Récupérer les contrats d'une entreprise (avec filtres et pagination)

`GET /api/contracts/company/:companyId?page=1&limit=10&status=completed`

**Query params possibles :**
- `status`
- `page`
- `limit`
- `paymentMode`

**Réponse :**
```json
{
  "success": true,
  "data": [ ... ],
  "total": 12,
  "page": 1,
  "limit": 10,
  "totalPages": 2,
  "message": "Liste des contrats de l'entreprise récupérée avec succès"
}
```

---

### 5. Récupérer les contrats d'un projet (avec filtres et pagination)

`GET /api/contracts/project/:projectId?page=1&limit=10&status=draft`

**Query params possibles :**
- `status`
- `page`
- `limit`
- `paymentMode`

**Réponse :**
```json
{
  "success": true,
  "data": [ ... ],
  "total": 7,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "message": "Liste des contrats du projet récupérée avec succès"
}
```

---

### 6. Filtrer les contrats (tous critères, via body)

`POST /api/contracts/filter`

**Body :**
```json
{
  "status": "active",
  "freelanceId": "uuid",
  "companyId": "uuid",
  "projectId": "uuid",
  "paymentMode": "final_payment",
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
  "message": "Liste des contrats filtrée récupérée avec succès"
}
```

---

### 7. Mettre à jour le statut d'un contrat

`PATCH /api/contracts/:id/status`

**Body :**
```json
{
  "status": "completed"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Statut du contrat mis à jour avec succès"
}
```

---

### 8. Supprimer un contrat

`DELETE /api/contracts/:id`

**Réponse :**
```json
{
  "success": true,
  "message": "Contrat supprimé avec succès"
}
```

---

## Validation

- Toutes les entrées sont validées avec Zod (body, params, query).
- Les erreurs de validation retournent un code 400 et un message détaillé.

---

## Pagination & Filtres

- Les endpoints de liste acceptent `page`, `limit`, `status`, `paymentMode` en query ou body.
- La réponse inclut toujours le nombre total d’éléments et de pages.

---

## Sécurité & Bonnes pratiques

- Les IDs sont validés (UUID).
- Les statuts et modes de paiement sont limités aux valeurs des enums.
- Les champs optionnels (`terms`, `start_date`, `end_date`, etc.) sont correctement typés et traités.
- Les middlewares d’authentification sont appliqués selon le rôle (freelance, company, admin).

---

## Exemple d’intégration

Dans ton app Express principale :

```ts
import contractsRoutes from "./src/features/contracts/contracts.route";
app.use("/api/contracts", contractsRoutes);
```

---

## Auteur & Contact

Pour toute question ou amélioration, contacte l’équipe backend.