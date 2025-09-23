# 📦 Projects Feature — Synkrone Backend

Gestion des projets publiés par les entreprises sur la plateforme Synkrone.  
Cette feature permet la création, la consultation, la modification, la suppression, la publication et la recherche paginée des projets.

---

## 🗂️ Structure des fichiers

- `projects.model.ts` — Interfaces & enums TypeScript pour les projets
- `projects.repository.ts` — Accès BDD (CRUD, filtres, publication)
- `projects.service.ts` — Logique métier (vérifications, publication)
- `projects.controller.ts` — Handlers Express, validation, pagination, publication
- `projects.route.ts` — Définition des routes Express + middleware d’authentification
- `projects.schema.ts` — Schémas Zod pour validation des payloads
- `README.md` — Documentation de la feature

---

## 🗄️ Structure de la table PostgreSQL

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    budget_min DECIMAL(12,2),
    budget_max DECIMAL(12,2),
    deadline DATE,
    duration_days INTEGER CHECK (duration_days >= 0),
    status project_status_enum DEFAULT 'draft',
    type_work type_work_enum,
    category_id UUID REFERENCES project_categories(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    level_experience experience_level_enum,
    tjm_proposed DECIMAL(10,2) CHECK (tjm_proposed > 0),
    allow_multiple_applications BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    published_at TIMESTAMP NULL
);
```

- Enum `project_status_enum` : `'draft'`, `'published'`, `'is_pending'`
- Enum `type_work_enum` : `'remote'`, `'hybride'`, `'presentiel'`

---

## 📝 Modèle TypeScript

```ts
export enum ProjectStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  IS_PENDING = "is_pending",
}

export enum TypeWork {
  REMOTE = "remote",
  HYBRIDE = "hybride",
  PRESENTIEL = "presentiel",
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  budgetMin?: number;
  budgetMax?: number;
  deadline?: string; // ISO date string
  durationDays?: number;
  status: ProjectStatus;
  typeWork?: TypeWork;
  categoryId?: string;
  companyId: string;
  createdAt: string;
  updatedAt?: string;
}
```

---

## 🔒 Sécurité & Accès

Toutes les routes sont protégées par le middleware :
- `AuthCompanyMiddleware` (seules les entreprises authentifiées peuvent créer, modifier, publier ou supprimer leurs projets)

---

## 🚦 API Endpoints

| Méthode | URL                        | Description                        | Authentification |
|---------|----------------------------|------------------------------------|------------------|
| GET     | `/projects`                | Liste paginée des projets          | company          |
| GET     | `/projects/my-projects`    | Projets de l'entreprise connectée  | company          |
| GET     | `/projects/my-missions`    | Missions du freelance connecté     | freelance        |
| GET     | `/projects/:id`            | Récupère un projet par son id      | company          |
| POST    | `/projects`                | Crée un projet                     | company          |
| PATCH   | `/projects/:id`            | Met à jour un projet               | company          |
| PATCH   | `/projects/:id/publish`    | Publie un projet                   | company          |
| DELETE  | `/projects/:id`            | Supprime un projet                 | company          |

---

## 📥 Payloads & Validation

### Création

```json
{
  "title": "Application mobile React Native",
  "description": "Développement d'une app mobile",
  "budgetMin": 10000,
  "budgetMax": 15000,
  "deadline": "2024-09-30",
  "durationDays": 60,
  "typeWork": "remote",
  "categoryId": "uuid-category",
  "companyId": "uuid-company"
}
```

- Validation par Zod (`createProjectSchema`)
- `title` : string, requis
- `budgetMin` : number, positif
- `budgetMax` : number, positif
- `deadline` : date future
- `durationDays` : number, positif (durée en jours)
- `typeWork` : enum
- `categoryId` : UUID optionnel
- `companyId` : UUID (injecté par le middleware)

### Mise à jour

```json
{
  "title": "Nouveau titre",
  "description": "Nouvelle description",
  "budgetMin": 11000,
  "budgetMax": 16000,
  "durationDays": 45
}
```

- Validation par Zod (`updateProjectSchema`)
- Tous les champs sont optionnels

---

## 📤 Publication d’un projet

**Endpoint** :  
`PATCH /projects/:id/publish`

- Change le statut du projet à `published`
- Vérifie que le projet existe et n'est pas déjà publié

---

## 📋 Récupération des projets de l'entreprise connectée

**Endpoint** :  
`GET /projects/my-projects`

- Récupère automatiquement les projets de l'entreprise connectée via le token
- Support des mêmes paramètres de pagination et filtres que `/projects`
- Le `companyId` est automatiquement extrait du token d'authentification
- Paramètres disponibles : `page`, `limit`, `offset`, `search`, `status`, `typeWork`, `categoryId`

---

## 📋 Récupération des missions du freelance connecté

**Endpoint** :  
`GET /projects/my-missions`

- Récupère automatiquement les missions (projets avec contrats actifs) du freelance connecté via le token
- Une mission est un projet pour lequel le freelance a un contrat actif
- Support des paramètres de pagination et recherche
- Le `freelanceId` est automatiquement extrait du token d'authentification
- Paramètres disponibles : `page`, `limit`, `offset`, `search`
- Chaque projet retourné inclut les informations du contrat associé dans le champ `contract`

**Réponse exemple** :
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-project",
      "title": "Développement API REST",
      "description": "API pour plateforme e-commerce",
      "status": "published",
      "company": {
        "id": "uuid-company",
        "company_name": "TechCorp",
        "logo_url": "https://...",
        "industry": "E-commerce"
      },
      "contract": {
        "id": "uuid-contract",
        "status": "active",
        "payment_mode": "daily_rate",
        "tjm": 500,
        "estimated_days": 20,
        "start_date": "2024-01-15",
        "end_date": "2024-02-15"
      },
      "skills": [...]
    }
  ],
  "total": 3,
  "limit": 10,
  "offset": 0,
  "page": 1,
  "totalPages": 1,
  "message": "Liste de vos missions récupérée avec succès"
}
```

---

## 📄 Pagination & Recherche

- Paramètres `page`, `limit`, `offset`, `search`, `status`, `typeWork`, `companyId`, `categoryId`, `levelExperience`, `allowMultipleApplications`
- Réponse inclut :
  - `data` : liste des projets
  - `total` : nombre total de projets trouvés
  - `limit` : taille de page
  - `offset` : offset
  - `page` : numéro de page actuelle
  - `totalPages` : nombre total de pages

---

## ⚠️ Erreurs possibles

- `400 Bad Request` : Payload invalide (validation Zod)
- `404 Not Found` : Projet non trouvé
- `409 Conflict` : Projet déjà publié
- `401/403 Unauthorized/Forbidden` : Accès refusé
- `500 Internal Server Error` : Erreur serveur

---

## 🔗 Intégration

- **Import du router** dans le routeur principal Express :
  ```ts
  import projectsRouter from "./features/projects/projects.route";
  app.use("/projects", projectsRouter);
  ```

---

## 🛡️ Extensibilité

- Ajout de nouveaux champs (tags, livrables, etc.)
- Ajout de filtres avancés (par date, budget…)
- Intégration avec d’autres modules (candidatures, contrats…)

---

## 🧪 Exemple de réponse paginée

```json
{
  "success": true,
  "data": [ /* projets */ ],
  "total": 42,
  "limit": 10,
  "offset": 0,
  "page": 1,
  "totalPages": 5,
  "message": "Liste des projets récupérée avec succès"
}
```

---

## 📚 Liens utiles

- [Zod (validation)](https://zod.dev/)
- [Express](https://expressjs.com/)

---

**Pour toute question ou extension, voir la documentation du backend Synkrone ou contacter l’équipe technique.**