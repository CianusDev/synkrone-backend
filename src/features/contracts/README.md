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
  PENDING = "pending",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  SUSPENDED = "suspended",
}

export enum PaymentMode {
  FIXED_PRICE = "fixed_price",
  DAILY_RATE = "daily_rate", 
  BY_MILESTONE = "by_milestone",
}

export interface Contract {
  id: string;
  application_id: string;
  project_id: string;
  freelance_id: string;
  company_id: string;
  payment_mode: PaymentMode;
  total_amount?: number;
  tjm?: number;
  estimated_days?: number;
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
  "payment_mode": "fixed_price",
  "total_amount": 5000.00,
  "tjm": 500.00,
  "estimated_days": 10,
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
  "paymentMode": "daily_rate",
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

### 7. Modifier un contrat

`PATCH /api/contracts/:id`

**Body :**
```json
{
  "payment_mode": "daily_rate",
  "tjm": 600.00,
  "estimated_days": 15,
  "terms": "Nouvelles conditions...",
  "start_date": "2024-08-01",
  "end_date": "2024-09-01"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Contrat mis à jour avec succès"
}
```

---

### 8. Accepter un contrat

`PATCH /api/contracts/:id/accept`

**Réponse :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Contrat accepté avec succès"
}
```

---

### 9. Refuser un contrat

`PATCH /api/contracts/:id/refuse`

**Réponse :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Contrat refusé avec succès"
}
```

---

### 10. Activer un contrat pending

`PATCH /api/contracts/:id/activate`

**Réponse :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Contrat activé avec succès"
}
```

---

### 11. Mettre un contrat en pending

`PATCH /api/contracts/:id/set-pending`

**Réponse :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Contrat mis en pending avec succès"
}
```

---

### 12. Mettre à jour le statut d'un contrat

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

### 13. Supprimer un contrat

`DELETE /api/contracts/:id`

**Réponse :**
```json
{
  "success": true,
  "message": "Contrat supprimé avec succès"
}
```

---

## Modes de paiement supportés

### 1. Prix fixe (`fixed_price`)
Montant total défini à l'avance pour tout le projet.
- **Requis** : `total_amount`
- **Optionnel** : `tjm`, `estimated_days` (pour information)

```json
{
  "payment_mode": "fixed_price",
  "total_amount": 5000.00
}
```

### 2. Taux journalier (`daily_rate`)  
Paiement basé sur TJM × nombre de jours travaillés.
- **Requis** : `tjm`, `estimated_days`
- **Optionnel** : `total_amount` (calculé automatiquement)

```json
{
  "payment_mode": "daily_rate", 
  "tjm": 500.00,
  "estimated_days": 10
}
```

### 3. Par étapes (`by_milestone`)
Paiement échelonné selon les livrables validés.
- **Requis** : `total_amount`
- **Logique** : Le montant est réparti sur les livrables milestone

```json
{
  "payment_mode": "by_milestone",
  "total_amount": 8000.00
}
```

---

## Validation

- Toutes les entrées sont validées avec Zod (body, params, query).
- Validation automatique de la cohérence selon le mode de paiement.
- Les erreurs de validation retournent un code 400 et un message détaillé.

---

## Pagination & Filtres

- Les endpoints de liste acceptent `page`, `limit`, `status`, `paymentMode` en query ou body.
- La réponse inclut toujours le nombre total d'éléments et de pages.
- Modes de paiement supportés : `fixed_price`, `daily_rate`, `by_milestone`

---

## Logique métier

### Workflow de validation des contrats
1. **Création** : L'entreprise crée un contrat avec le statut `draft`
2. **Modification** : L'entreprise peut modifier le contrat tant qu'il est en statut `draft`
3. **Acceptation/Refus** : Le freelance peut accepter ou refuser le contrat :
   - **Acceptation avec livrables milestone** : statut → `active`
   - **Acceptation sans livrables milestone** : statut → `pending`
   - **Refus** : statut → `cancelled`
4. **Gestion des livrables** :
   - **Ajout de milestones** : `pending` → `active`
   - **Suppression de tous les milestones** : `active` → `pending`
5. **Verrouillage** : Une fois accepté ou refusé, le contrat n'est plus modifiable (sauf transitions milestone)

### Validation automatique
- **fixed_price** / **by_milestone** : `total_amount` obligatoire et positif
- **daily_rate** : `tjm` et `estimated_days` obligatoires et positifs  
- **Dates** : `start_date` doit être antérieure à `end_date`
- **Unicité** : Un seul contrat par candidature acceptée
- **Modification** : Seuls les contrats en statut `draft` peuvent être modifiés
- **Acceptation/Refus** : Seuls les contrats en statut `draft` peuvent être acceptés/refusés

### Calculs automatiques
- **daily_rate** : `montant_estimé = tjm × estimated_days`
- **Statuts** : Workflow `draft` → `active`/`pending` → `completed`/`cancelled`
- **Transitions automatiques** : Basculement `pending` ↔ `active` selon la présence de livrables milestone

---

## Sécurité & Bonnes pratiques

- Les IDs sont validés (UUID).
- Les statuts et modes de paiement sont limités aux valeurs des enums.
- Validation de la cohérence métier selon le mode de paiement.
- Les champs optionnels (`terms`, `start_date`, `end_date`, etc.) sont correctement typés et traités.
- Les middlewares d'authentification sont appliqués selon le rôle :
  - **Création** : entreprise ou admin
  - **Modification** : entreprise ou admin (statut draft uniquement)
  - **Acceptation/Refus** : freelance concerné uniquement
  - **Transitions milestone** : admin ou système (activation/suspension selon milestones)
  - **Consultation** : freelance, entreprise ou admin
  - **Suppression/Statut** : admin uniquement

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