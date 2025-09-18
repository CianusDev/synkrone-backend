# 📦 Deliverables Feature — Synkrone Backend

Gestion des livrables associés à un contrat sur la plateforme Synkrone.  
Cette feature permet la création, la consultation, la modification, la suppression et l’enrichissement des livrables avec des fichiers médias.

---

## 🗂️ Structure des fichiers

- `deliverables.model.ts` — Interfaces & enums TypeScript pour les livrables
- `deliverables.repository.ts` — Accès BDD (CRUD, filtres)
- `deliverables.service.ts` — Logique métier (validation, association médias)
- `deliverables.controller.ts` — Handlers Express, validation, réponses JSON
- `deliverables.route.ts` — Définition des routes Express + middlewares d’authentification
- `deliverables.schema.ts` — Schémas Zod pour validation des payloads
- `README.md` — Documentation de la feature

---

## 🗄️ Structure de la table PostgreSQL

```sql
CREATE TABLE deliverables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status deliverable_status_enum DEFAULT 'planned',
    is_milestone BOOLEAN DEFAULT FALSE,
    amount DECIMAL(12,2) DEFAULT 0,
    due_date DATE,
    submitted_at TIMESTAMP NULL,
    validated_at TIMESTAMP NULL,
    feedback TEXT,
    "order" INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

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
    updated_at TIMESTAMP NULL
);
```

- Enum `deliverable_status_enum` : `'planned'`, `'in_progress'`, `'submitted'`, `'validated'`, `'rejected'`
- Enum `work_day_status_enum` : `'draft'`, `'submitted'`, `'validated'`, `'rejected'`

### 🎯 Modes de paiement supportés

Les contrats peuvent avoir 3 modes de paiement :

- **`fixed_price`** : Prix fixe pour tout le projet
- **`daily_rate`** : Basé sur TJM × jours travaillés validés
- **`by_milestone`** : Paiement par étapes/livrables validés

---

## 📝 Modèle TypeScript

```ts
import { Media } from "../media/media.model";

export enum DeliverableStatus {
  PLANNED = "planned",
  IN_PROGRESS = "in_progress",
  SUBMITTED = "submitted",
  VALIDATED = "validated",
  REJECTED = "rejected",
}

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

export interface Deliverable {
  id: string;
  contractId: string;
  title: string;
  description?: string;
  status: DeliverableStatus;
  isMilestone?: boolean;
  amount?: number;
  dueDate?: string;
  submittedAt?: string;
  validatedAt?: string;
  feedback?: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
  medias?: Array<Media & { createdAt: Date }>;
  workDays?: WorkDay[];
}
```

---

## 📦 Médias et jours de travail

Chaque livrable retourné par l'API inclut les propriétés :

```ts
medias: Array<{
  id: string;
  url: string;
  type: string;
  description?: string;
  uploadedAt: Date;
  uploadedBy?: string;
  createdAt: Date; // Date d'association au livrable
}>

workDays: Array<{
  id: string;
  workDate: string;
  description: string;
  status: WorkDayStatus;
  tjmApplied?: number;
  amount?: number;
  submittedAt?: string;
  validatedAt?: string;
}>
```

- **`medias`** contient la liste complète des objets `Media` associés au livrable (preuves visuelles/documents).
- **`workDays`** contient les jours de travail associés au livrable (preuves d'activité + calcul TJM).
- **`createdAt`** indique la date d'association du média au livrable.

### Exemple de réponse enrichie

```json
{
  "id": "livrable-uuid",
  "contractId": "contrat-uuid",
  "title": "Livrable 1 - Phase développement",
  "status": "submitted",
  "isMilestone": true,
  "amount": 2500.00,
  "medias": [
    {
      "id": "media-uuid",
      "url": "https://exemple.com/mockup.png",
      "type": "image",
      "description": "Maquette finale",
      "uploadedAt": "2024-06-01T12:00:00Z"
    }
  ],
  "workDays": [
    {
      "id": "workday-1",
      "workDate": "2024-06-01",
      "description": "Développement du module d'authentification",
      "status": "validated",
      "tjmApplied": 500.00,
      "amount": 500.00
    },
    {
      "id": "workday-2", 
      "workDate": "2024-06-02",
      "description": "Tests unitaires et intégration",
      "status": "submitted",
      "tjmApplied": 500.00,
      "amount": 500.00
    }
  ]
}
```

---

## 🚦 API Endpoints

### Livrables

| Méthode | URL                                 | Description                              | Authentification |
|---------|-------------------------------------|------------------------------------------|------------------|
| POST    | `/deliverables`                     | Crée un livrable                         | freelance/company |
| GET     | `/deliverables/:id`                 | Récupère un livrable par son id          | freelance/company |
| GET     | `/deliverables/contract/:contractId`| Liste tous les livrables d'un contrat    | freelance/company |
| PATCH   | `/deliverables/:id`                 | Met à jour un livrable                   | freelance/company |
| DELETE  | `/deliverables/:id`                 | Supprime un livrable                     | freelance/company |

### Jours de travail (Work Days)

| Méthode | URL                                 | Description                              | Authentification |
|---------|-------------------------------------|------------------------------------------|------------------|
| POST    | `/deliverables/:id/work-days`       | Ajoute un jour de travail à un livrable  | freelance       |
| GET     | `/deliverables/:id/work-days`       | Liste les jours de travail d'un livrable | freelance/company |
| PATCH   | `/work-days/:id`                    | Met à jour un jour de travail            | freelance       |
| DELETE  | `/work-days/:id`                    | Supprime un jour de travail              | freelance       |
| PATCH   | `/work-days/:id/validate`           | Valide un jour de travail                | company         |
| PATCH   | `/work-days/:id/reject`             | Rejette un jour de travail               | company         |

---

## 📥 Payloads & Validation

### Création de livrable

```json
{
  "contractId": "uuid-contrat",
  "title": "Livrable 1 - Développement Frontend",
  "description": "Maquette et développement de l'interface utilisateur",
  "status": "planned",
  "isMilestone": true,
  "amount": 1500.00,
  "dueDate": "2024-02-15",
  "order": 1,
  "mediaIds": ["media-uuid-1", "media-uuid-2"]
}
```

- Validation par Zod (`createDeliverableSchema`)
- `title` : string, requis
- `contractId` : UUID, requis
- `isMilestone` : boolean, détermine si le livrable déclenche un paiement
- `amount` : number ≥ 0, requis si `isMilestone = true`
- `dueDate` : string format YYYY-MM-DD, optionnel
- `mediaIds` : tableau d'UUID de médias à associer (optionnel)

### Mise à jour de livrable

```json
{
  "title": "Livrable modifié",
  "description": "Nouvelle maquette avec feedback client",
  "status": "submitted",
  "amount": 2000.00,
  "dueDate": "2024-03-01",
  "mediaIds": ["media-uuid-3"]
}
```

### Ajout d'un jour de travail

```json
{
  "workDate": "2024-01-15",
  "description": "Développement du module d'authentification - implémentation JWT",
  "tjmApplied": 500.00
}
```

- `workDate` : string format YYYY-MM-DD, requis, unique par livrable
- `description` : string, requis (minimum 10 caractères pour justifier le travail)
- `tjmApplied` : number, TJM appliqué pour ce jour (peut différer du TJM contractuel)

### Validation/Rejet d'un jour de travail

```json
// Validation
{
  "status": "validated"
}

// Rejet  
{
  "status": "rejected",
  "rejectionReason": "Description insuffisante du travail effectué"
}
```

---

## 📤 Association des médias et jours de travail

### Médias
- Lors de la création ou la mise à jour d'un livrable, les médias dont les IDs sont passés dans `mediaIds` sont associés au livrable.
- La propriété `medias` dans la réponse contient les objets `Media` enrichis avec la date d'association (`createdAt`).

### Jours de travail
- Les jours de travail sont directement liés à un livrable spécifique pour justifier le travail effectué.
- Chaque jour doit avoir une description détaillée du travail accompli.
- Les jours sont soumis par le freelance puis validés/rejetés par l'entreprise.
- Le montant calculé = `tjmApplied` (peut être différent du TJM contractuel selon négociation).

### Workflow des jours de travail

1. **Freelance** : Ajoute ses jours avec description détaillée (`status: 'draft'`)
2. **Freelance** : Soumet les jours pour validation (`status: 'submitted'`)  
3. **Entreprise** : Valide (`status: 'validated'`) ou rejette (`status: 'rejected'`)
4. **Paiement** : Seuls les jours validés sont comptabilisés pour le paiement

---

## ⚠️ Erreurs possibles

- `400 Bad Request` : Payload invalide (validation Zod)
- `404 Not Found` : Livrable non trouvé
- `401/403 Unauthorized/Forbidden` : Accès refusé
- `500 Internal Server Error` : Erreur serveur

---

## 🔗 Intégration

- **Import du router** dans le routeur principal Express :
  ```ts
  import deliverablesRouter from "./features/deliverables/deliverables.route";
  app.use("/deliverables", deliverablesRouter);
  ```

---

## 💰 Gestion financière selon le mode de paiement

### Mode `fixed_price`
Prix fixe défini au contrat, réparti sur les livrables milestone :

```json
{
  "contractId": "contrat-fixed-5000euros",
  "paymentMode": "fixed_price",
  "totalAmount": 5000.00,
  "deliverables": [
    {
      "title": "Phase 1 - Analyse",
      "amount": 1500.00,
      "isMilestone": true
    },
    {
      "title": "Phase 2 - Développement", 
      "amount": 2500.00,
      "isMilestone": true
    },
    {
      "title": "Phase 3 - Tests",
      "amount": 1000.00,
      "isMilestone": true
    },
    {
      "title": "Documentation",
      "isMilestone": false  // Pas de paiement, juste suivi
    }
  ]
}
```

### Mode `daily_rate`
Paiement basé sur TJM × jours travaillés validés :

```json
{
  "contractId": "contrat-tjm",
  "paymentMode": "daily_rate", 
  "tjm": 500.00,
  "estimatedDays": 20,
  "deliverables": [
    {
      "title": "Module Auth",
      "isMilestone": true,
      "workDays": [
        {"workDate": "2024-01-15", "tjmApplied": 500.00, "status": "validated"},
        {"workDate": "2024-01-16", "tjmApplied": 500.00, "status": "validated"}
      ]
      // Montant calculé = 2 jours × 500€ = 1000€
    }
  ]
}
```

### Mode `by_milestone`
Paiement par étapes avec montants prédéfinis :

```json
{
  "contractId": "contrat-milestones",
  "paymentMode": "by_milestone",
  "totalAmount": 8000.00,
  "deliverables": [
    {
      "title": "Milestone 1",
      "amount": 3000.00,
      "isMilestone": true
    },
    {
      "title": "Milestone 2", 
      "amount": 5000.00,
      "isMilestone": true
    }
  ]
}
```

### Règles de validation
- **fixed_price** : Somme des `amount` des milestones ≤ `totalAmount` du contrat
- **daily_rate** : Montant calculé = jours validés × TJM
- **by_milestone** : Paiement selon les montants prédéfinis des milestones
- Les `dueDate` doivent être cohérentes avec les dates du contrat

### Alertes et notifications
- Notification 3 jours avant `dueDate` si statut != 'submitted'
- Alerte si livrable en retard (`dueDate` dépassée et statut != 'validated')
- Notification quand des jours de travail sont soumis pour validation

---

## 🛡️ Sécurité & Bonnes pratiques

- Les routes sont protégées par des middlewares d’authentification adaptés (freelance, company, admin).
- Les IDs sont validés (UUID).
- Les livrables sont enrichis avec les médias associés pour faciliter l’affichage frontend.
- La date d’association des médias permet de trier ou filtrer les fichiers par ordre d’ajout.

---

## 📚 Liens utiles

- [Zod (validation)](https://zod.dev/)
- [Express](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/)

---

**Pour toute question ou extension, voir la documentation du backend Synkrone ou contacter l’équipe technique.**