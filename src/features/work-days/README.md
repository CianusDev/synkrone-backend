# 📅 Work Days Feature — Synkrone Backend

Gestion des jours de travail associés à un livrable sur la plateforme Synkrone.  
Cette feature permet aux freelances de tracker leur travail quotidien et aux entreprises de valider/rejeter ces jours pour le calcul des paiements basés sur le TJM.

---

## 🗂️ Structure des fichiers

- `work-days.model.ts` — Interfaces & enums TypeScript pour les jours de travail
- `work-days.repository.ts` — Accès BDD (CRUD, filtres, statistiques)
- `work-days.service.ts` — Logique métier (validation, contraintes métier)
- `work-days.controller.ts` — Handlers Express, validation, réponses JSON
- `work-days.route.ts` — Définition des routes Express + middlewares d'authentification
- `work-days.schema.ts` — Schémas Zod pour validation des payloads
- `README.md` — Documentation de la feature

---

## 🗄️ Structure de la table PostgreSQL

```sql
CREATE TABLE work_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
    freelance_id UUID NOT NULL REFERENCES freelances(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    description TEXT NOT NULL,
    status work_day_status_enum DEFAULT 'draft',
    tjm_applied DECIMAL(10,2),
    amount DECIMAL(12,2) GENERATED ALWAYS AS (COALESCE(tjm_applied, 0)) STORED,
    submitted_at TIMESTAMP NULL,
    validated_at TIMESTAMP NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    CONSTRAINT unique_work_day_per_deliverable UNIQUE (deliverable_id, work_date)
);
```

- Enum `work_day_status_enum` : `'draft'`, `'submitted'`, `'validated'`, `'rejected'`
- **Contrainte d'unicité** : Un seul jour de travail par date et par livrable
- **Amount calculé automatiquement** : `amount = tjm_applied` (colonne générée)

---

## 📝 Modèle TypeScript

```ts
export enum WorkDayStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted", 
  VALIDATED = "validated",
  REJECTED = "rejected",
}

export interface WorkDay {
  id: string;
  deliverableId: string;
  freelanceId: string;
  workDate: string;
  description: string;
  status: WorkDayStatus;
  tjmApplied?: number;
  amount?: number;
  submittedAt?: string;
  validatedAt?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

---

## 🎯 Logique métier et contraintes

### Workflow des jours de travail

1. **Freelance** : Crée ses jours de travail (`status: 'draft'`)
2. **Freelance** : Soumet les jours pour validation (`status: 'submitted'`)
3. **Entreprise** : Valide (`status: 'validated'`) ou rejette (`status: 'rejected'`)
4. **Paiement** : Seuls les jours validés sont comptabilisés

### Contraintes automatiques

- ✅ **Unicité** : Un seul jour de travail par date et par livrable
- ✅ **Date limite** : Impossible de créer un jour dans le futur
- ✅ **Historique** : Impossible de créer un jour de plus de 30 jours
- ✅ **Modification** : Impossible de modifier/supprimer un jour validé
- ✅ **Description** : Minimum 10 caractères pour justifier le travail

### États et transitions

```
DRAFT → (submit) → SUBMITTED → (validate/reject) → VALIDATED/REJECTED
  ↑                                                        ↓
  └─────────────────── (retour possible) ──────────────────┘
```

---

## 🚦 API Endpoints

### Gestion des jours de travail

| Méthode | URL                                     | Description                              | Authentification |
|---------|-----------------------------------------|------------------------------------------|------------------|
| POST    | `/work-days/deliverable/:deliverableId` | Crée un jour de travail                  | freelance       |
| GET     | `/work-days/:id`                        | Récupère un jour de travail par son id   | freelance/company |
| GET     | `/work-days/deliverable/:deliverableId` | Liste les jours d'un livrable            | freelance/company |
| GET     | `/work-days/freelance/:freelanceId`     | Liste les jours d'un freelance (filtres) | freelance/company |
| PATCH   | `/work-days/:id`                        | Met à jour un jour de travail            | freelance       |
| DELETE  | `/work-days/:id`                        | Supprime un jour de travail              | freelance       |

### Soumission et validation

| Méthode | URL                           | Description                              | Authentification |
|---------|-------------------------------|------------------------------------------|------------------|
| POST    | `/work-days/submit`           | Soumet des jours pour validation         | freelance       |
| PATCH   | `/work-days/:id/validate`     | Valide un jour de travail                | company         |
| PATCH   | `/work-days/:id/reject`       | Rejette un jour de travail               | company         |
| POST    | `/work-days/bulk-validate`    | Valide plusieurs jours en une fois       | company         |
| POST    | `/work-days/bulk-reject`      | Rejette plusieurs jours en une fois      | company         |

### Statistiques

| Méthode | URL                                           | Description                              | Authentification |
|---------|-----------------------------------------------|------------------------------------------|------------------|
| GET     | `/work-days/deliverable/:deliverableId/stats` | Statistiques des jours d'un livrable    | freelance/company |

---

## 📥 Payloads & Validation

### Création d'un jour de travail

```json
{
  "workDate": "2024-01-15",
  "description": "Développement du module d'authentification - implémentation JWT et middleware de sécurité",
  "tjmApplied": 500.00
}
```

- **workDate** : string YYYY-MM-DD, requis, unique par livrable
- **description** : string 10-1000 caractères, requis (justification du travail)
- **tjmApplied** : number positif, requis (peut différer du TJM contractuel)

### Mise à jour d'un jour de travail

```json
{
  "description": "Développement du module d'authentification - implémentation JWT, middleware et tests unitaires",
  "tjmApplied": 550.00
}
```

- Tous les champs optionnels
- Impossible si `status = 'validated'`

### Soumission pour validation

```json
{
  "workDayIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

### Validation d'un jour

```json
{
  "status": "validated"
}
```

### Rejet d'un jour

```json
{
  "status": "rejected",
  "rejectionReason": "Description insuffisante du travail effectué. Merci de détailler les tâches accomplies."
}
```

### Filtres de recherche

```
GET /work-days/freelance/:freelanceId?status=submitted&dateFrom=2024-01-01&dateTo=2024-01-31&deliverableId=uuid
```

---

## 📊 Exemples de réponses

### Jour de travail complet

```json
{
  "success": true,
  "data": {
    "id": "workday-uuid",
    "deliverableId": "livrable-uuid",
    "freelanceId": "freelance-uuid",
    "workDate": "2024-01-15",
    "description": "Développement du module d'authentification - implémentation JWT et middleware",
    "status": "validated",
    "tjmApplied": 500.00,
    "amount": 500.00,
    "submittedAt": "2024-01-16T09:00:00Z",
    "validatedAt": "2024-01-16T14:30:00Z",
    "createdAt": "2024-01-15T18:00:00Z",
    "updatedAt": "2024-01-16T14:30:00Z"
  }
}
```

### Statistiques d'un livrable

```json
{
  "success": true,
  "data": {
    "totalDays": 5,
    "draftDays": 1,
    "submittedDays": 2,
    "validatedDays": 2,
    "rejectedDays": 0,
    "totalAmount": 2500.00,
    "validatedAmount": 1000.00
  }
}
```

### Liste avec filtres

```json
{
  "success": true,
  "data": [
    {
      "id": "workday-1",
      "workDate": "2024-01-15",
      "description": "Développement module auth",
      "status": "validated",
      "tjmApplied": 500.00,
      "amount": 500.00
    },
    {
      "id": "workday-2", 
      "workDate": "2024-01-14",
      "description": "Mise en place architecture",
      "status": "submitted",
      "tjmApplied": 500.00,
      "amount": 500.00
    }
  ]
}
```

---

## ⚠️ Gestion des erreurs

### Erreurs de validation

```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": [
    {
      "path": ["description"],
      "message": "La description doit faire au moins 10 caractères."
    }
  ]
}
```

### Erreurs métier

```json
{
  "success": false,
  "message": "Un jour de travail existe déjà pour cette date sur ce livrable"
}
```

```json
{
  "success": false,
  "message": "Impossible de créer un jour de travail dans le futur"
}
```

```json
{
  "success": false,
  "message": "Impossible de modifier un jour de travail validé"
}
```

### Codes de statut HTTP

- `201` : Jour de travail créé
- `200` : Succès (lecture, mise à jour, validation)
- `204` : Suppression réussie
- `400` : Erreur de validation ou contrainte métier
- `404` : Jour de travail non trouvé
- `401/403` : Accès refusé

---

## 💰 Intégration avec les paiements

### Mode `daily_rate`

Les jours de travail validés sont utilisés pour calculer le montant du paiement :

```
Montant à payer = Σ (jours validés × TJM appliqué)
```

### Mode `fixed_price` et `by_milestone`

Les jours de travail servent de **justificatifs** mais ne déterminent pas le montant :
- Preuve du travail effectué
- Transparence pour l'entreprise  
- Suivi de l'avancement

### Exemple de calcul

```json
{
  "deliverableId": "livrable-uuid",
  "paymentMode": "daily_rate",
  "workDays": [
    {"workDate": "2024-01-15", "tjmApplied": 500, "status": "validated"},
    {"workDate": "2024-01-16", "tjmApplied": 500, "status": "validated"},
    {"workDate": "2024-01-17", "tjmApplied": 550, "status": "submitted"}
  ],
  "calculation": {
    "validatedDays": 2,
    "amountToPay": 1000.00,
    "pendingAmount": 550.00
  }
}
```

---

## 🔗 Relations avec les autres features

### Avec Deliverables
- Un livrable peut avoir plusieurs jours de travail
- Suppression en cascade : livrable supprimé → jours supprimés
- Les jours justifient l'avancement du livrable

### Avec Contracts
- Le TJM du contrat sert de référence
- Le freelance peut appliquer un TJM différent selon négociation
- Les modes de paiement déterminent l'usage des jours

### Avec Payments
- Les jours validés déclenchent les paiements (mode `daily_rate`)
- Les jours servent de justificatifs (autres modes)

---

## 🛡️ Sécurité & Bonnes pratiques

### Contrôles d'accès
- **Freelance** : CRUD sur ses propres jours (sauf validés)
- **Entreprise** : Lecture + validation/rejet des jours soumis
- **Admin** : Accès complet pour support/modération

### Validation des données
- Dates cohérentes (pas futur, max 30 jours)
- Description détaillée obligatoire
- TJM positif
- Unicité par date/livrable

### Audit trail
- Traçabilité des soumissions (`submitted_at`)
- Traçabilité des validations (`validated_at`)
- Raisons de rejet stockées
- Historique des modifications (`updated_at`)

---

## 🔗 Intégration

- **Import du router** dans le routeur principal Express :
  ```ts
  import workDaysRouter from "./features/work-days/work-days.route";
  app.use("/work-days", workDaysRouter);
  ```

---

## 📚 Liens utiles

- [Zod (validation)](https://zod.dev/)
- [Express](https://expressjs.com/)
- [PostgreSQL Generated Columns](https://www.postgresql.org/docs/current/ddl-generated-columns.html)

---

**Pour toute question ou extension, voir la documentation du backend Synkrone ou contacter l'équipe technique.**