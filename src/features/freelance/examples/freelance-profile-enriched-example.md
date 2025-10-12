# Exemple de profil freelance enrichi

Ce document montre la nouvelle structure de réponse pour l'endpoint `GET /freelances/:id` avec les évaluations et missions réalisées.

## 📋 Vue d'ensemble

L'endpoint `GET /freelances/:id` retourne maintenant un profil freelance enrichi avec :
- **Informations de base** du freelance
- **Compétences** (skills) associées
- **Évaluations reçues** avec statistiques
- **Missions réalisées** (projets avec contrats terminés)

## 🚀 Utilisation

### Requête
```bash
GET /freelances/123e4567-e89b-12d3-a456-426614174000
```

### Réponse enrichie complète

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "firstname": "Marie",
    "lastname": "Dubois",
    "email": "marie.dubois@example.com",
    "photo_url": "https://storage.example.com/profiles/marie.jpg",
    "job_title": "Développeuse Full Stack Senior",
    "experience": "expert",
    "description": "Développeuse passionnée avec 8 ans d'expérience en développement web et mobile...",
    "cover_url": "https://storage.example.com/covers/marie-cover.jpg",
    "linkedin_url": "https://linkedin.com/in/marie-dubois",
    "tjm": 650,
    "availability": "available",
    "location": "Paris, France",
    "is_verified": true,
    "country": "France",
    "city": "Paris",
    "phone": "+33 6 12 34 56 78",
    "block_duration": 0,
    "is_first_login": false,
    "deleted_at": null,
    "blocked_at": null,
    "created_at": "2023-01-15T10:30:00Z",
    "updated_at": "2024-01-10T14:20:00Z",
    "isBlocked": false,
    
    "skills": [
      {
        "id": "skill-uuid-1",
        "freelance_id": "123e4567-e89b-12d3-a456-426614174000",
        "skill_id": "react-uuid",
        "level": "expert",
        "created_at": "2023-01-15T10:30:00Z",
        "skill": {
          "id": "react-uuid",
          "name": "React.js",
          "description": "Bibliothèque JavaScript pour créer des interfaces utilisateur",
          "category_id": "frontend-uuid",
          "created_at": "2023-01-01T00:00:00Z",
          "updated_at": null
        }
      },
      {
        "id": "skill-uuid-2",
        "freelance_id": "123e4567-e89b-12d3-a456-426614174000",
        "skill_id": "nodejs-uuid",
        "level": "expert",
        "created_at": "2023-01-15T10:30:00Z",
        "skill": {
          "id": "nodejs-uuid",
          "name": "Node.js",
          "description": "Environnement d'exécution JavaScript côté serveur",
          "category_id": "backend-uuid",
          "created_at": "2023-01-01T00:00:00Z",
          "updated_at": null
        }
      }
    ],

    "evaluations": {
      "stats": {
        "user_id": "123e4567-e89b-12d3-a456-426614174000",
        "user_type": "freelance",
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
          "id": "eval-uuid-1",
          "contract_id": "contract-uuid-1",
          "evaluator_id": "company-uuid-1",
          "evaluated_id": "123e4567-e89b-12d3-a456-426614174000",
          "evaluator_type": "company",
          "evaluated_type": "freelance",
          "rating": 5,
          "comment": "Excellent travail ! Marie a livré un code de qualité, dans les temps et avec une communication parfaite tout au long du projet.",
          "created_at": "2024-01-08T16:45:00Z",
          "updated_at": null,
          "contract": {
            "id": "contract-uuid-1",
            "project_id": "project-uuid-1",
            "project": {
              "id": "project-uuid-1",
              "title": "Développement API E-commerce"
            }
          },
          "evaluator": {
            "id": "company-uuid-1",
            "name": "TechCorp Solutions",
            "email": "contact@techcorp.com",
            "type": "company"
          }
        },
        {
          "id": "eval-uuid-2",
          "contract_id": "contract-uuid-2",
          "evaluator_id": "company-uuid-2",
          "evaluated_id": "123e4567-e89b-12d3-a456-426614174000",
          "evaluator_type": "company",
          "evaluated_type": "freelance",
          "rating": 4,
          "comment": "Très bon développeur, quelques petits ajustements ont été nécessaires mais le résultat final est excellent.",
          "created_at": "2023-12-20T11:30:00Z",
          "updated_at": null,
          "contract": {
            "id": "contract-uuid-2",
            "project_id": "project-uuid-2",
            "project": {
              "id": "project-uuid-2",
              "title": "Refonte Site Web Corporate"
            }
          },
          "evaluator": {
            "id": "company-uuid-2",
            "name": "Digital Agency Pro",
            "email": "hello@digitalagency.com",
            "type": "company"
          }
        }
      ],
      "total": 28
    },

    "completedMissions": [
      {
        "id": "contract-uuid-1",
        "project": {
          "id": "project-uuid-1",
          "title": "Développement API E-commerce",
          "description": "Création d'une API REST complète pour une plateforme e-commerce avec gestion des produits, commandes et paiements.",
          "budget": {
            "min": 8000,
            "max": 12000
          },
          "company": {
            "id": "company-uuid-1",
            "name": "TechCorp Solutions",
            "logo_url": "https://storage.example.com/logos/techcorp.png",
            "industry": "E-commerce"
          }
        },
        "contract": {
          "paymentMode": "fixed_price",
          "totalAmount": 10000,
          "tjm": null,
          "startDate": "2023-11-01T00:00:00Z",
          "endDate": "2024-01-05T00:00:00Z",
          "completedAt": "2024-01-08T16:45:00Z"
        }
      },
      {
        "id": "contract-uuid-2",
        "project": {
          "id": "project-uuid-2",
          "title": "Refonte Site Web Corporate",
          "description": "Modernisation complète du site vitrine avec React et intégration CMS.",
          "budget": {
            "min": 5000,
            "max": 8000
          },
          "company": {
            "id": "company-uuid-2",
            "name": "Digital Agency Pro",
            "logo_url": "https://storage.example.com/logos/digital-agency.png",
            "industry": "Marketing Digital"
          }
        },
        "contract": {
          "paymentMode": "daily_rate",
          "totalAmount": null,
          "tjm": 600,
          "startDate": "2023-10-15T00:00:00Z",
          "endDate": "2023-12-15T00:00:00Z",
          "completedAt": "2023-12-20T11:30:00Z"
        }
      },
      {
        "id": "contract-uuid-3",
        "project": {
          "id": "project-uuid-3",
          "title": "Application Mobile de Fitness",
          "description": "Développement d'une app mobile React Native pour le suivi d'activités sportives.",
          "budget": {
            "min": 15000,
            "max": 20000
          },
          "company": {
            "id": "company-uuid-3",
            "name": "FitLife Technologies",
            "logo_url": "https://storage.example.com/logos/fitlife.png",
            "industry": "Santé & Fitness"
          }
        },
        "contract": {
          "paymentMode": "by_milestone",
          "totalAmount": 18000,
          "tjm": null,
          "startDate": "2023-07-01T00:00:00Z",
          "endDate": "2023-10-01T00:00:00Z",
          "completedAt": "2023-10-05T09:30:00Z"
        }
      }
    ]
  },
  "message": "Freelance récupéré avec succès"
}
```

## 📊 Nouvelles données disponibles

### 1. Statistiques d'évaluations
```json
"evaluations": {
  "stats": {
    "total_evaluations": 28,      // Nombre total d'évaluations reçues
    "average_rating": 4.7,        // Note moyenne sur 5
    "rating_distribution": {      // Répartition des notes
      "rating_1": 0,
      "rating_2": 1,
      "rating_3": 2,
      "rating_4": 6,
      "rating_5": 19
    }
  }
}
```

### 2. Évaluations récentes
```json
"evaluations": {
  "recent": [                     // 10 évaluations les plus récentes
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
  "total": 28                     // Nombre total pour pagination
}
```

### 3. Missions réalisées
```json
"completedMissions": [
  {
    "project": {
      "title": "Développement API E-commerce",
      "description": "Création d'une API REST complète...",
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
```

## 💡 Cas d'utilisation

### 1. Affichage du profil public
```typescript
const freelanceProfile = await getFreelanceById(freelanceId);

// Afficher les stats d'évaluation
const { stats } = freelanceProfile.evaluations;
console.log(`Note moyenne: ${stats.average_rating}/5`);
console.log(`${stats.total_evaluations} évaluations`);

// Afficher les dernières évaluations
freelanceProfile.evaluations.recent.forEach(eval => {
  console.log(`${eval.rating}/5 - ${eval.comment}`);
});

// Afficher l'expérience
console.log(`${freelanceProfile.completedMissions.length} missions réalisées`);
```

### 2. Calcul de crédibilité
```typescript
function calculateCredibilityScore(freelance) {
  const { stats } = freelance.evaluations;
  const missionCount = freelance.completedMissions.length;
  
  // Score basé sur les évaluations et missions
  const ratingScore = stats.average_rating * 20; // Max 100
  const experienceScore = Math.min(missionCount * 5, 50); // Max 50
  
  return Math.round(ratingScore + experienceScore);
}
```

### 3. Filtrage par performance
```typescript
function getTopPerformers(freelances) {
  return freelances.filter(freelance => {
    const { stats } = freelance.evaluations;
    return stats.average_rating >= 4.5 && 
           stats.total_evaluations >= 10 &&
           freelance.completedMissions.length >= 5;
  });
}
```

## 🔍 Informations techniques

### Performance
- **Évaluations** : Limitées à 10 récentes pour éviter la surcharge
- **Missions** : Limitées à 50 contrats terminés maximum
- **Requêtes optimisées** : Une requête principale + requêtes ciblées pour les données enrichies

### Gestion des erreurs
- Si les évaluations échouent, le profil est retourné sans cette section
- Si les missions échouent, un tableau vide est retourné
- Les erreurs sont loggées mais n'interrompent pas la réponse principale

### Évolutivité
- Possibilité d'ajouter la pagination pour les évaluations complètes
- Possibilité d'ajouter des filtres pour les missions (par période, montant, etc.)
- Cache possible sur les statistiques d'évaluation

## 📈 Métriques disponibles

Le profil enrichi permet de calculer :
- **Taux de satisfaction** : % d'évaluations 4-5 étoiles
- **Expérience projet** : Nombre et types de missions
- **Valeur moyenne** : TJM moyen des contrats terminés
- **Fiabilité** : Régularité des bonnes évaluations
- **Spécialisation** : Types de projets les plus fréquents

---

**Version :** 1.0  
**Dernière mise à jour :** Janvier 2024  
**Auteur :** Équipe Synkrone Backend