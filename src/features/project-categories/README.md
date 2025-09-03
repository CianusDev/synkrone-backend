# Project Categories Feature

Ce module gère les catégories de projets dans l'application Synkrone. Il fournit une API RESTful pour la création, la lecture, la mise à jour, la suppression, la pagination et la recherche des catégories de projet, avec validation des données via Zod.

## Structure

- `project-categories.controller.ts` : Contrôleur Express pour les routes et la logique HTTP.
- `project-categories.service.ts` : Service métier pour l'orchestration des opérations.
- `project-categories.repository.ts` : Accès aux données (PostgreSQL).
- `schema.ts` : Schémas Zod pour la validation des données.
- `project-categories.route.ts` : Définition des routes Express.

---

## Endpoints

### 1. Créer une catégorie

**POST** `/project-categories`

#### Body (JSON)
```json
{
  "name": "Développement",
  "description": "Catégorie pour les projets de dev",
  "icon": "dev-icon",
  "is_active": true
}
```

#### Réponse
- **201 Created** : Catégorie créée
- **400 Bad Request** : Erreur de validation

---

### 2. Récupérer toutes les catégories (avec pagination et recherche)

**GET** `/project-categories?page=1&limit=10&search=dev`

#### Query Params
- `page` (number, optionnel, défaut: 1)
- `limit` (number, optionnel, défaut: 10)
- `search` (string, optionnel) : Recherche par nom (insensible à la casse)

#### Réponse
```json
{
  "success": true,
  "data": {
    "data": [ /* Array de catégories */ ],
    "total": 42,
    "page": 1,
    "limit": 10
  },
  "message": "Liste des catégories de projets récupérée avec succès"
}
```

---

### 3. Récupérer une catégorie par ID

**GET** `/project-categories/:id`

- `id` doit être un UUID valide.

#### Réponse
- **200 OK** : Catégorie trouvée
- **404 Not Found** : Catégorie non trouvée
- **400 Bad Request** : ID invalide

---

### 4. Mettre à jour une catégorie

**PATCH** `/project-categories/:id`

#### Body (JSON)
```json
{
  "name": "Nouveau nom",
  "description": "Nouvelle description",
  "icon": "nouvel-icon",
  "is_active": false
}
```

- Tous les champs sont optionnels.
- `id` doit être un UUID valide.

#### Réponse
- **200 OK** : Catégorie mise à jour
- **400 Bad Request** : Erreur de validation ou ID invalide

---

### 5. Supprimer une catégorie

**DELETE** `/project-categories/:id`

- `id` doit être un UUID valide.

#### Réponse
- **204 No Content** : Suppression réussie
- **400 Bad Request** : ID invalide

---

## Validation

La validation des données est assurée par [Zod](https://zod.dev/).  
Voir `schema.ts` pour les détails des schémas utilisés pour chaque opération.

- Les erreurs de validation retournent un code 400 et un tableau d'erreurs détaillées.

---

## Pagination & Recherche

- La pagination est disponible via les paramètres `page` et `limit`.
- La recherche par nom s'effectue via le paramètre `search` (recherche insensible à la casse).
- La réponse inclut toujours le nombre total de résultats, la page courante et la limite.

---

## Exemple de réponse d'erreur de validation

```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": [
    {
      "path": ["name"],
      "message": "Le nom de la catégorie est requis."
    }
  ]
}
```

---

## Dépendances

- Express
- Zod
- PostgreSQL (via un module `db` interne)

---

## Bonnes pratiques

- Utilisez les schémas Zod pour toute validation côté contrôleur.
- Ne jamais faire confiance aux données entrantes sans validation.
- Utilisez la pagination pour éviter les réponses trop volumineuses.

---

## Auteur

Ce module a été conçu pour être facilement extensible et robuste pour la gestion des catégories de projets dans Synkrone.