# 🔗 Project Skills Feature — Synkrone Backend

Gestion des associations entre projets et compétences sur la plateforme Synkrone.
Cette feature permet d'associer, supprimer, consulter et gérer les compétences requises pour chaque projet.

---

## 🗂️ Structure des fichiers

- `project-skills.model.ts` — Interfaces TypeScript pour les associations projet-compétence
- `project-skills.repository.ts` — Accès BDD (CRUD, associations many-to-many)
- `project-skills.service.ts` — Logique métier (validation, gestion des associations)
- `project-skills.controller.ts` — Handlers Express, validation, réponses JSON
- `project-skills.route.ts` — Définition des routes Express + middleware d'authentification
- `project-skills.schema.ts` — Schémas Zod pour validation des payloads
- `README.md` — Documentation de la feature

---

## 🗄️ Structure de la table PostgreSQL

```sql
CREATE TABLE project_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    CONSTRAINT unique_project_skill UNIQUE (project_id, skill_id)
);
```

---

## 📝 Modèles TypeScript

```ts
export interface ProjectSkill {
  id: string;
  projectId: string;
  skillId: string;
}

export interface ProjectSkillWithDetails {
  id: string;
  projectId: string;
  skillId: string;
  skill: {
    id: string;
    name: string;
    description?: string;
    categoryId: string;
  };
}
```

---

## 🔒 Sécurité & Accès

Toutes les routes sont protégées par le middleware :
- `AuthCompanyMiddleware` (seules les entreprises authentifiées peuvent gérer les compétences de leurs projets)

---

## 🚦 API Endpoints

| Méthode | URL                                    | Description                              | Authentification |
|---------|----------------------------------------|------------------------------------------|------------------|
| POST    | `/projects/:projectId/skills`          | Ajoute une compétence à un projet        | company          |
| GET     | `/projects/:projectId/skills`          | Récupère les compétences d'un projet     | company          |
| PUT     | `/projects/:projectId/skills`          | Met à jour toutes les compétences        | company          |
| DELETE  | `/projects/:projectId/skills`          | Supprime toutes les compétences          | company          |
| DELETE  | `/projects/:projectId/skills/:skillId` | Supprime une compétence spécifique       | company          |
| GET     | `/skills/:skillId/projects`            | Récupère les projets utilisant une skill | company          |

---

## 📥 Payloads & Validation

### Ajouter une compétence à un projet

**POST** `/projects/:projectId/skills`

```json
{
  "skillId": "uuid-skill"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "projectId": "uuid-project",
    "skillId": "uuid-skill"
  },
  "message": "Compétence ajoutée au projet avec succès"
}
```

---

### Récupérer les compétences d'un projet

**GET** `/projects/:projectId/skills`

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "projectId": "uuid-project",
      "skillId": "uuid-skill",
      "skill": {
        "id": "uuid-skill",
        "name": "React.js",
        "description": "Framework JavaScript",
        "categoryId": "uuid-category"
      }
    }
  ],
  "message": "Compétences du projet récupérées avec succès"
}
```

---

### Mettre à jour toutes les compétences d'un projet

**PUT** `/projects/:projectId/skills`

```json
{
  "skillIds": ["uuid-skill-1", "uuid-skill-2", "uuid-skill-3"]
}
```

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "projectId": "uuid-project",
      "skillId": "uuid-skill-1",
      "skill": { ... }
    }
  ],
  "message": "Compétences du projet mises à jour avec succès"
}
```

---

### Supprimer une compétence d'un projet

**DELETE** `/projects/:projectId/skills/:skillId`

**Réponse :**
```json
{
  "success": true,
  "message": "Compétence supprimée du projet avec succès"
}
```

---

### Récupérer les projets utilisant une compétence

**GET** `/skills/:skillId/projects`

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "projectId": "uuid-project-1",
      "skillId": "uuid-skill"
    },
    {
      "id": "uuid",
      "projectId": "uuid-project-2",
      "skillId": "uuid-skill"
    }
  ],
  "message": "Projets utilisant cette compétence récupérés avec succès"
}
```

---

## ⚠️ Erreurs possibles

- `400 Bad Request` : Payload invalide (validation Zod)
- `400 Bad Request` : Association déjà existante
- `404 Not Found` : Projet ou compétence non trouvé
- `404 Not Found` : Association non trouvée
- `401/403 Unauthorized/Forbidden` : Accès refusé
- `500 Internal Server Error` : Erreur serveur

---

## 🔗 Intégration

**Import du router** dans le routeur principal Express :
```ts
import projectSkillsRouter from "./features/project-skills/project-skills.route";
app.use("/api", projectSkillsRouter);
```

---

## 🛡️ Fonctionnalités avancées

### Gestion des transactions
- Les mises à jour complètes (`PUT /projects/:projectId/skills`) utilisent des transactions pour garantir la cohérence
- En cas d'erreur, toutes les modifications sont annulées (ROLLBACK)

### Validation des doublons
- Le service vérifie automatiquement l'existence des associations avant création
- Les tableaux de compétences sont dédoublonnés automatiquement

### Contraintes de base de données
- Contrainte UNIQUE `unique_project_skill` sur `(project_id, skill_id)` pour éviter les doublons
- Références CASCADE pour maintenir l'intégrité référentielle
- Index automatiques sur les clés étrangères pour optimiser les performances

---

## 🧪 Exemples d'utilisation

### Ajouter des compétences à un nouveau projet
```bash
# Ajouter React.js
curl -X POST /api/projects/uuid-project/skills \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"skillId": "uuid-react"}'

# Ajouter Node.js
curl -X POST /api/projects/uuid-project/skills \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"skillId": "uuid-node"}'
```

### Mettre à jour toutes les compétences d'un coup
```bash
curl -X PUT /api/projects/uuid-project/skills \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"skillIds": ["uuid-react", "uuid-node", "uuid-typescript"]}'
```

---

## 📚 Liens utiles

- [Zod (validation)](https://zod.dev/)
- [Express](https://expressjs.com/)
- [PostgreSQL Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)

---

**Pour toute question ou extension, voir la documentation du backend Synkrone ou contacter l'équipe technique.**
