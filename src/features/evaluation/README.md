# 📊 Evaluations (Évaluations)

Ce module gère le système d'évaluation mutuelle entre freelances et entreprises après la completion des contrats sur la plateforme Synkrone.

---

## Structure du module

- **evaluation.model.ts** : Interfaces TypeScript et enums pour les évaluations.
- **evaluation.schema.ts** : Schémas Zod pour la validation des requêtes.
- **evaluation.repository.ts** : Accès aux données (CRUD, filtres, statistiques).
- **evaluation.service.ts** : Logique métier (validation, permissions, business rules).
- **evaluation.controller.ts** : Handlers Express, validation, réponses JSON.
- **evaluation.route.ts** : Définition des routes Express avec authentification.

---

## Modèle de données

```ts
export enum UserType {
  FREELANCE = "freelance",
  COMPANY = "company",
}

export interface Evaluation {
  id: string;
  contract_id: string;
  evaluator_id: string;
  evaluated_id: string;
  evaluator_type: UserType;
  evaluated_type: UserType;
  rating: number;        // 1-5 étoiles
  comment?: string;      // Commentaire optionnel
  created_at: Date;
  updated_at?: Date;
  // Relations enrichies
  contract?: {
    id: string;
    project_id: string;
    project?: {
      id: string;
      title: string;
    };
  };
  evaluator?: {
    id: string;
    name: string;
    email: string;
    type: UserType;
  };
  evaluated?: {
    id: string;
    name: string;
    email: string;
    type: UserType;
  };
}

export interface EvaluationStats {
  user_id: string;
  user_type: UserType;
  total_evaluations: number;
  average_rating: number;
  rating_distribution: {
    rating_1: number;
    rating_2: number;
    rating_3: number;
    rating_4: number;
    rating_5: number;
  };
}
```

---

## Endpoints essentiels

### 1. Créer une évaluation

`POST /api/evaluations`

**Body :**
```json
{
  "contract_id": "uuid",
  "evaluator_id": "uuid",
  "evaluated_id": "uuid",
  "evaluator_type": "freelance",
  "evaluated_type": "company",
  "rating": 5,
  "comment": "Excellente collaboration, projet bien géré et paiements rapides."
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": "eval-uuid",
    "contract_id": "contract-uuid",
    "evaluator_id": "freelance-uuid",
    "evaluated_id": "company-uuid",
    "evaluator_type": "freelance",
    "evaluated_type": "company",
    "rating": 5,
    "comment": "Excellente collaboration...",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "message": "Évaluation créée avec succès"
}
```

---

### 2. Récupérer une évaluation par ID

`GET /api/evaluations/:id`

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": "eval-uuid",
    "rating": 5,
    "comment": "Excellente collaboration...",
    "created_at": "2024-01-15T10:30:00Z",
    "contract": {
      "id": "contract-uuid",
      "project_id": "project-uuid",
      "project": {
        "id": "project-uuid",
        "title": "Développement Application Mobile"
      }
    },
    "evaluator": {
      "id": "freelance-uuid",
      "name": "Marie Dubois",
      "email": "marie@example.com",
      "type": "freelance"
    },
    "evaluated": {
      "id": "company-uuid",
      "name": "TechCorp",
      "email": "contact@techcorp.com",
      "type": "company"
    }
  },
  "message": "Évaluation récupérée avec succès"
}
```

---

### 3. Récupérer les statistiques d'un utilisateur

`GET /api/evaluations/user/:userId/stats?userType=freelance`

**Réponse :**
```json
{
  "success": true,
  "data": {
    "user_id": "user-uuid",
    "user_type": "freelance",
    "total_evaluations": 28,
    "average_rating": 4.6,
    "rating_distribution": {
      "rating_1": 0,
      "rating_2": 1,
      "rating_3": 2,
      "rating_4": 8,
      "rating_5": 17
    }
  },
  "message": "Statistiques d'évaluation récupérées avec succès"
}
```

---

### 4. Récupérer les évaluations reçues par un utilisateur

`GET /api/evaluations/user/:userId/received?page=1&limit=10`

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": "eval-uuid-1",
      "rating": 5,
      "comment": "Travail exceptionnel, très professionnel",
      "created_at": "2024-01-15T10:30:00Z",
      "evaluator": {
        "name": "TechCorp",
        "type": "company"
      },
      "contract": {
        "project": {
          "title": "Développement API REST"
        }
      }
    }
  ],
  "total": 28,
  "page": 1,
  "limit": 10,
  "totalPages": 3,
  "message": "Évaluations reçues récupérées avec succès"
}
```

---

### 5. Récupérer les évaluations d'un contrat

`GET /api/evaluations/contract/:contractId`

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": "eval-uuid-1",
      "evaluator_type": "freelance",
      "evaluated_type": "company",
      "rating": 5,
      "comment": "Excellente collaboration",
      "evaluator": {
        "name": "Marie Dubois",
        "type": "freelance"
      }
    },
    {
      "id": "eval-uuid-2",
      "evaluator_type": "company",
      "evaluated_type": "freelance",
      "rating": 5,
      "comment": "Travail remarquable, très professionnel",
      "evaluator": {
        "name": "TechCorp",
        "type": "company"
      }
    }
  ],
  "total": 2,
  "message": "Évaluations du contrat récupérées avec succès"
}
```

---

### 6. Vérifier si un utilisateur peut évaluer

`GET /api/evaluations/contract/:contractId/can-evaluate`

**Réponse :**
```json
{
  "success": true,
  "data": {
    "canEvaluate": true,
    "targetUser": {
      "id": "company-uuid",
      "type": "company",
      "name": "TechCorp"
    }
  },
  "message": "L'utilisateur peut évaluer"
}
```

**Ou si l'utilisateur ne peut pas évaluer :**
```json
{
  "success": true,
  "data": {
    "canEvaluate": false,
    "reason": "Vous avez déjà évalué ce contrat"
  },
  "message": "L'utilisateur ne peut pas évaluer"
}
```

---

### 7. Récupérer un résumé complet des évaluations

`GET /api/evaluations/user/:userId/summary`

**Réponse :**
```json
{
  "success": true,
  "data": {
    "stats": {
      "user_id": "user-uuid",
      "user_type": "freelance",
      "total_evaluations": 28,
      "average_rating": 4.6,
      "rating_distribution": {
        "rating_1": 0,
        "rating_2": 1,
        "rating_3": 2,
        "rating_4": 8,
        "rating_5": 17
      }
    },
    "recentEvaluations": [
      {
        "id": "eval-uuid-1",
        "rating": 5,
        "comment": "Travail exceptionnel",
        "created_at": "2024-01-15T10:30:00Z",
        "evaluator": {
          "name": "TechCorp",
          "type": "company"
        }
      }
    ],
    "canEvaluateContracts": []
  },
  "message": "Résumé des évaluations récupéré avec succès"
}
```

---

### 8. Mettre à jour une évaluation

`PATCH /api/evaluations/:id`

**Body :**
```json
{
  "rating": 4,
  "comment": "Très bonne collaboration, quelques petites améliorations possibles sur la communication."
}
```

**Contraintes :**
- Seul l'auteur de l'évaluation peut la modifier
- Modification possible uniquement dans les 7 jours après création

---

### 9. Supprimer une évaluation

`DELETE /api/evaluations/:id`

**Contraintes :**
- Seul l'auteur de l'évaluation peut la supprimer
- Suppression possible uniquement dans les 24 heures après création

---

## Logique métier

### Règles de validation

1. **Contrat terminé requis** : Les évaluations ne peuvent être créées que pour des contrats avec le statut `completed`
2. **Participants du contrat** : Seuls les freelances et entreprises impliqués dans le contrat peuvent s'évaluer mutuellement
3. **Auto-évaluation interdite** : Un utilisateur ne peut pas s'évaluer lui-même
4. **Évaluation unique** : Une seule évaluation par contrat et par évaluateur
5. **Note obligatoire** : La note (1-5 étoiles) est obligatoire, le commentaire est optionnel

### Permissions de modification

- **Modification** : Possible pendant 7 jours après création, uniquement par l'auteur
- **Suppression** : Possible pendant 24 heures après création, uniquement par l'auteur
- **Consultation** : Tous les utilisateurs authentifiés peuvent voir les évaluations

### Calcul des statistiques

- **Note moyenne** : Calculée avec 2 décimales de précision
- **Distribution** : Comptage des notes par valeur (1 à 5 étoiles)
- **Mise à jour automatique** : Les statistiques sont recalculées à chaque nouvelle évaluation

---

## Enrichissement des données

Tous les endpoints **GET** retournent les évaluations enrichies avec :

- **`contract`** : Informations du contrat associé avec le projet
- **`evaluator`** : Informations de l'évaluateur (nom, email, type)
- **`evaluated`** : Informations de l'évalué (nom, email, type)

Les requêtes utilisent des LEFT JOINs optimisés pour récupérer ces données en une seule requête SQL.

---

## Validation

Tous les endpoints utilisent des schémas Zod pour la validation :

- **Rating** : Nombre entier entre 1 et 5
- **Comment** : Chaîne optionnelle de 10 à 500 caractères
- **UUIDs** : Validation stricte des identifiants
- **UserType** : Validation contre l'enum (freelance/company)

---

## Pagination & Filtres

Les endpoints de liste supportent :

- **Pagination** : `page` et `limit` (max 100)
- **Filtres** : Par évaluateur, évalué, note, contrat, projet
- **Tri** : Par date de création (DESC par défaut)

---

## Sécurité

### Authentification
- Tous les endpoints nécessitent une authentification sauf `/user/:userId/stats`
- Les middlewares d'authentification appropriés sont appliqués selon l'endpoint

### Autorisation
- **Création** : Vérification que l'utilisateur fait partie du contrat
- **Modification/Suppression** : Seul l'auteur peut modifier ses évaluations
- **Consultation** : Accès libre aux évaluations (transparence)
- **Filtrage avancé** : Réservé aux administrateurs

### Validation des permissions
```typescript
// Exemple de vérification dans le service
const isEvaluatorValid =
  (data.evaluator_type === UserType.FREELANCE && data.evaluator_id === contract.freelance_id) ||
  (data.evaluator_type === UserType.COMPANY && data.evaluator_id === contract.company_id);

if (!isEvaluatorValid) {
  throw new Error("L'évaluateur doit faire partie du contrat");
}
```

---

## Cas d'usage typiques

### 1. Freelance évalue une entreprise
```json
{
  "contract_id": "contract-uuid",
  "evaluator_id": "freelance-uuid",
  "evaluated_id": "company-uuid",
  "evaluator_type": "freelance",
  "evaluated_type": "company",
  "rating": 5,
  "comment": "Excellente communication, paiements rapides, projet intéressant."
}
```

### 2. Entreprise évalue un freelance
```json
{
  "contract_id": "contract-uuid",
  "evaluator_id": "company-uuid",
  "evaluated_id": "freelance-uuid",
  "evaluator_type": "company",
  "evaluated_type": "freelance",
  "rating": 4,
  "comment": "Travail de qualité, respect des délais, quelques ajustements nécessaires."
}
```

### 3. Affichage du profil avec statistiques
Les statistiques d'évaluation peuvent être affichées sur les profils publics :
- Note moyenne sur 5
- Nombre total d'évaluations
- Distribution des notes
- Évaluations récentes avec commentaires

---

## Intégration avec d'autres modules

### Contracts
- Vérification du statut `completed` avant création d'évaluation
- Récupération des participants du contrat (freelance_id, company_id)

### Freelances & Companies
- Enrichissement des données avec les informations utilisateur
- Validation de l'existence des utilisateurs

### Projects
- Affichage du titre du projet dans les évaluations
- Contexte pour l'utilisateur lors de l'évaluation

---

## Base de données

### Table `evaluations`
```sql
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL,
  evaluated_id UUID NOT NULL,
  evaluator_type user_type_enum NOT NULL,
  evaluated_type user_type_enum NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL,
  CONSTRAINT unique_evaluation_per_contract UNIQUE (contract_id, evaluator_id, evaluator_type)
);
```

### Vues pré-calculées disponibles
```sql
-- Vue des moyennes par freelance
CREATE VIEW freelance_average_rating AS
SELECT
  evaluated_id AS freelance_id,
  AVG(rating) AS average_rating,
  COUNT(*) AS total_evaluations
FROM evaluations
WHERE evaluated_type = 'freelance'
GROUP BY evaluated_id;

-- Vue des moyennes par entreprise
CREATE VIEW company_average_rating AS
SELECT
  evaluated_id AS company_id,
  AVG(rating) AS average_rating,
  COUNT(*) AS total_evaluations
FROM evaluations
WHERE evaluated_type = 'company'
GROUP BY evaluated_id;
```

---

## Exemple d'intégration

Dans votre app Express principale :

```ts
import evaluationRoutes from "./src/features/evaluation/evaluation.route";
app.use("/api/evaluations", evaluationRoutes);
```

---

## Endpoints complets disponibles

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/evaluations` | Créer une évaluation | Auth |
| `GET` | `/evaluations/:id` | Récupérer une évaluation par ID | Auth |
| `PATCH` | `/evaluations/:id` | Mettre à jour une évaluation | Auth (auteur) |
| `DELETE` | `/evaluations/:id` | Supprimer une évaluation | Auth (auteur) |
| `POST` | `/evaluations/filter` | Filtrer les évaluations | Admin |
| `GET` | `/evaluations/user/:userId/stats` | Statistiques d'un utilisateur | Public |
| `GET` | `/evaluations/user/:userId/given` | Évaluations données | Auth |
| `GET` | `/evaluations/user/:userId/received` | Évaluations reçues | Auth |
| `GET` | `/evaluations/user/:userId/summary` | Résumé complet | Auth |
| `GET` | `/evaluations/contract/:contractId` | Évaluations d'un contrat | Auth |
| `GET` | `/evaluations/contract/:contractId/can-evaluate` | Vérification permissions | Auth |

---

## Bonnes pratiques

### ✅ À faire
- Encourager les commentaires constructifs
- Afficher les statistiques de manière claire
- Valider les permissions avant chaque action
- Utiliser la pagination pour les listes

### ❌ À éviter
- Permettre les évaluations sans contrat terminé
- Autoriser les évaluations multiples du même contrat
- Négliger la validation des permissions
- Exposer des données sensibles

---

## Évolutions futures possibles

1. **Système de réponse** : Permettre aux évalués de répondre aux évaluations
2. **Modération** : Signalement et modération des évaluations inappropriées
3. **Critères détaillés** : Évaluation sur plusieurs critères (communication, qualité, délais, etc.)
4. **Recommandations** : Système de recommandation basé sur les évaluations
5. **Badges** : Attribution de badges basés sur les évaluations reçues

---

## Auteur & Contact

Pour toute question ou amélioration du module d'évaluation, contactez l'équipe backend Synkrone.