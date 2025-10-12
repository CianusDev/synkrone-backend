# 👨‍💻 Freelances Module

Ce module gère les freelances de la plateforme Synkrone avec un système de profil enrichi incluant les évaluations et missions réalisées.

---

## Structure du module

- **freelance.model.ts** : Interfaces TypeScript et enums pour les freelances.
- **freelance.schema.ts** : Schémas Zod pour la validation des requêtes.
- **freelance.repository.ts** : Accès aux données (CRUD, filtres, pagination).
- **freelance.service.ts** : Logique métier avec enrichissement des données.
- **freelance.controller.ts** : Handlers Express, validation, réponses JSON.
- **freelance.route.ts** : Définition des routes Express.

---

## 🚀 Nouveauté : Profil Freelance Enrichi

### Endpoint principal enrichi

`GET /api/freelances/:id`

**Réponse enrichie :**
```json
{
  "success": true,
  "data": {
    "id": "freelance-uuid",
    "firstname": "Marie",
    "lastname": "Dubois",
    "job_title": "Développeuse Full Stack Senior",
    "tjm": 650,
    "availability": "available",
    "skills": [
      {
        "skill": {
          "name": "React.js",
          "description": "Bibliothèque JavaScript"
        },
        "level": "expert"
      }
    ],
    "evaluations": {
      "stats": {
        "total_evaluations": 28,
        "average_rating": 4.7,
        "rating_distribution": {
          "rating_1": 0,
          "rating_2": 1,
          "rating_3": 2,
          "rating_4": 6,
          "rating_5": 19
        }
      },
      "recent": [
        {
          "rating": 5,
          "comment": "Excellent travail !",
          "evaluator": {
            "name": "TechCorp Solutions",
            "type": "company"
          },
          "contract": {
            "project": {
              "title": "Développement API E-commerce"
            }
          }
        }
      ],
      "total": 28
    },
    "completedMissions": [
      {
        "project": {
          "title": "Développement API E-commerce",
          "description": "API REST complète...",
          "budget": { "min": 8000, "max": 12000 }
        },
        "contract": {
          "paymentMode": "fixed_price",
          "totalAmount": 10000,
          "startDate": "2023-11-01T00:00:00Z",
          "endDate": "2024-01-05T00:00:00Z"
        }
      }
    ]
  }
}
```

### Données enrichies disponibles

#### 📊 Évaluations
- **Statistiques complètes** : note moyenne, distribution, total
- **Évaluations récentes** : 10 dernières évaluations reçues
- **Intégration** avec le module Evaluation

#### 🎯 Missions réalisées
- **Projets terminés** : contrats avec statut "completed"
- **Détails contrat** : mode de paiement, montants, dates
- **Informations projet** : titre, description, budget
- **Historique complet** de l'expérience freelance

---

## Endpoints disponibles

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/freelances` | Liste paginée avec filtres | Public |
| `POST` | `/freelances/filter` | Filtres avancés via body | Public |
| `GET` | `/freelances/:id` | **Profil enrichi** (nouveau) | Public |
| `POST` | `/freelances` | Créer un freelance | Admin |

---

## Filtres et recherche

### Recherche textuelle
- Prénom, nom, email, titre du poste

### Filtres disponibles
- **Skills** : Par compétences (UUID ou nom)
- **Experience** : Niveau d'expérience (beginner, intermediate, expert)
- **TJM** : Fourchette de tarif journalier (min/max)
- **Pagination** : page, limit

### Exemple de requête filtrée
```bash
GET /freelances?search=react&experience=expert&tjmMin=500&tjmMax=800&skills=react-uuid,nodejs-uuid
```

---

## Logique métier

### Enrichissement automatique
Le service `getFreelanceById` enrichit automatiquement les données avec :

1. **Compétences** via `FreelanceSkillsService`
2. **Évaluations** via `EvaluationService`
3. **Missions terminées** via `ContractsRepository`

### Performance
- **Évaluations** : Limitées à 10 récentes
- **Missions** : Limitées à 50 contrats terminés
- **Gestion d'erreurs** : Les échecs d'enrichissement n'interrompent pas la réponse

### Intégrations
- **Module Evaluation** : Statistiques et évaluations reçues
- **Module Contracts** : Contrats terminés pour l'historique
- **Module Skills** : Compétences avec niveaux

---

## Cas d'usage

### 1. Profil public freelance
```typescript
const freelance = await getFreelanceById(id);

// Afficher les performances
console.log(`${freelance.evaluations.stats.average_rating}/5`);
console.log(`${freelance.completedMissions.length} missions`);

// Crédibilité
const isExperienced = freelance.evaluations.stats.total_evaluations >= 10;
const isWellRated = freelance.evaluations.stats.average_rating >= 4.5;
```

### 2. Recherche de freelances
```typescript
const topFreelances = await getFreelancesWithFilters({
  experience: ['expert'],
  tjmMin: 500,
  skills: ['react-uuid', 'nodejs-uuid']
});
```

### 3. Calculs de métriques
- **Taux de satisfaction** : % évaluations 4-5 étoiles
- **Expérience** : Nombre de missions réalisées
- **Spécialisation** : Types de projets fréquents
- **Fiabilité** : Régularité des bonnes notes

---

## Modèle de données

### Interface Freelance étendue
```typescript
export interface Freelance {
  // Données de base
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  job_title?: string;
  tjm?: number;
  availability?: Availability;
  skills?: FreelanceSkills[];
  
  // Données enrichies (nouvelles)
  evaluations?: {
    stats: EvaluationStats | null;
    recent: Evaluation[];
    total: number;
  };
  completedMissions?: CompletedMission[];
}

export interface CompletedMission {
  id: string;
  project: {
    id: string;
    title: string;
    description?: string;
    budget: { min?: number; max?: number };
    company: { id: string };
  } | null;
  contract: {
    paymentMode: string;
    totalAmount?: number;
    tjm?: number;
    startDate?: Date;
    endDate?: Date;
    completedAt: Date;
  };
}
```

---

## Sécurité

### Authentification
- **Liste publique** : Accès libre avec filtres
- **Profil détaillé** : Accès libre (informations publiques)
- **Création** : Admin uniquement
- **Modification** : Propriétaire ou admin (routes commentées)

### Données sensibles
- **Masquage automatique** : Email, téléphone (selon contexte)
- **Informations financières** : TJM visible pour transparence
- **Historique** : Missions terminées uniquement (pas les échecs)

---

## Performance et optimisation

### Requêtes optimisées
- **JOIN efficaces** pour les compétences
- **Filtres SQL** natifs pour la recherche
- **Pagination** pour limiter les résultats
- **Requêtes ciblées** pour l'enrichissement

### Cache potentiel
- Statistiques d'évaluation (mise à jour fréquente)
- Liste des compétences (données relativement stables)

---

## Évolutions futures

1. **Cache Redis** pour les statistiques d'évaluation
2. **Pagination avancée** pour les évaluations/missions
3. **Filtres géographiques** par localisation
4. **Recommandations** basées sur l'historique
5. **Badges** selon les performances

---

## Exemple d'intégration

```typescript
// Dans votre app Express
import freelanceRoutes from "./src/features/freelance/freelance.route";
app.use("/api/freelances", freelanceRoutes);

// Utilisation du service enrichi
import { FreelanceService } from "./src/features/freelance/freelance.service";

const freelanceService = new FreelanceService();
const enrichedProfile = await freelanceService.getFreelanceById(freelanceId);

// Accès aux nouvelles données
const { stats, recent } = enrichedProfile.evaluations;
const missions = enrichedProfile.completedMissions;
```

---

## Documentation complète

- [Exemple de profil enrichi](./examples/freelance-profile-enriched-example.md)
- [Schémas de validation](./freelance.schema.ts)
- [Modèles de données](./freelance.model.ts)

---

## Auteur & Contact

Pour toute question sur le module Freelance enrichi, contactez l'équipe backend Synkrone.