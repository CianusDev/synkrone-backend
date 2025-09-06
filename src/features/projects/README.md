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
    budget DECIMAL(12,2),
    deadline DATE,
    status project_status_enum DEFAULT 'draft',
    type_work type_work_enum,
    category_id UUID REFERENCES project_categories(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
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
  budget?: number;
  deadline?: string; // ISO date string
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
  "budget": 12000,
  "deadline": "2024-09-30",
  "typeWork": "remote",
  "categoryId": "uuid-category",
  "companyId": "uuid-company"
}
```

- Validation par Zod (`createProjectSchema`)
- `title` : string, requis
- `budget` : number, positif
- `deadline` : date future
- `typeWork` : enum
- `categoryId` : UUID optionnel
- `companyId` : UUID (injecté par le middleware)

### Mise à jour

```json
{
  "title": "Nouveau titre",
  "description": "Nouvelle description"
}
```

- Validation par Zod (`updateProjectSchema`)
- Tous les champs sont optionnels

---

## 📤 Publication d’un projet

**Endpoint** :  
`PATCH /projects/:id/publish`

- Change le statut du projet à `published`
- Vérifie que le projet existe et n’est pas déjà publié

---

## 📄 Pagination & Recherche

- Paramètres `limit`, `offset`, `search`, `status`, `typeWork`, `companyId`, `categoryId`
- Réponse inclut :
  - `data` : liste des projets
  - `total` : nombre total de projets trouvés
  - `limit` : taille de page
  - `offset` : offset
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