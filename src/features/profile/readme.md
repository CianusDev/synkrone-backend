# Module de Gestion des Profils

Ce module gère la complétion et la mise à jour des profils pour les freelances et les entreprises, permettant aux utilisateurs de remplir leurs informations professionnelles après l'inscription.

## Architecture

Le module de gestion des profils est construit avec les composants suivants :

- **ProfileService** : Contient toute la logique métier pour la mise à jour des profils
- **ProfileController** : Gère les requêtes HTTP et communique avec le service
- **ProfileRoutes** : Définit les endpoints de l'API
- **ProfileSchema** : Définit les schémas de validation Zod

## Fonctionnalités

- Complétion du profil freelance
- Complétion du profil entreprise
- Vérification de l'état de complétion d'un profil
- Récupération des détails d'un profil
- Validation des données entrées par l'utilisateur
- Gestion des profils incomplets

## Endpoints API

### Profil Freelance

#### 1. Récupérer le profil d'un freelance
```http
GET /api/profile/freelance/:id
```

**Réponse de succès (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "photo_url": "https://example.com/photo.jpg",
    "job_title": "Développeur Full-Stack",
    "experience_years": 5,
    "description": "Développeur expérimenté...",
    "portfolio_url": "https://portfolio.example.com",
    "cover_url": "https://example.com/cover.jpg",
    "video_url": "https://example.com/video.mp4",
    "linkedin_url": "https://linkedin.com/in/johndoe",
    "tjm": 500,
    "availability": "available",
    "location": "Paris, France",
    "country": "France",
    "phone": "+33612345678",
    "is_verified": true,
    "is_first_login": false
  },
  "message": "Profil freelance récupéré avec succès"
}
```

#### 2. Compléter/Mettre à jour le profil d'un freelance
```http
PUT /api/profile/freelance/:id
```

**Corps de la requête**
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "photo_url": "https://example.com/photo.jpg",
  "job_title": "Développeur Full-Stack",
  "experience_years": 5,
  "description": "Développeur expérimenté...",
  "portfolio_url": "https://portfolio.example.com",
  "tjm": 500,
  "availability": "available",
  "location": "Paris, France",
  "country": "France",
  "phone": "+33612345678"
}
```

**Réponse de succès (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "photo_url": "https://example.com/photo.jpg",
    "job_title": "Développeur Full-Stack",
    "experience_years": 5,
    "description": "Développeur expérimenté...",
    "portfolio_url": "https://portfolio.example.com",
    "tjm": 500,
    "availability": "available",
    "location": "Paris, France",
    "country": "France",
    "phone": "+33612345678",
    "is_verified": true,
    "is_first_login": false
  },
  "message": "Profil freelance mis à jour avec succès"
}
```

#### 3. Vérifier si le profil d'un freelance est complet
```http
GET /api/profile/freelance/:id/complete
```

**Réponse de succès (200 OK)**
```json
{
  "success": true,
  "data": {
    "isComplete": false,
    "missingFields": ["job_title", "experience_years", "tjm"]
  },
  "message": "Le profil freelance est incomplet"
}
```

### Profil Entreprise

#### 1. Récupérer le profil d'une entreprise
```http
GET /api/profile/company/:id
```

**Réponse de succès (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "company_name": "ACME Inc.",
    "company_email": "contact@acme.com",
    "logo_url": "https://example.com/logo.png",
    "company_description": "Entreprise leader dans...",
    "industry": "Technologie",
    "website_url": "https://acme.com",
    "address": "123 Rue Principale, Paris",
    "company_size": "sme",
    "certification_doc_url": "https://example.com/certification.pdf",
    "country": "France",
    "company_phone": "+33123456789",
    "is_verified": true,
    "is_certified": false,
    "is_first_login": false
  },
  "message": "Profil entreprise récupéré avec succès"
}
```

#### 2. Compléter/Mettre à jour le profil d'une entreprise
```http
PUT /api/profile/company/:id
```

**Corps de la requête**
```json
{
  "company_name": "ACME Inc.",
  "logo_url": "https://example.com/logo.png",
  "company_description": "Entreprise leader dans...",
  "industry": "Technologie",
  "website_url": "https://acme.com",
  "address": "123 Rue Principale, Paris",
  "company_size": "sme",
  "country": "France",
  "company_phone": "+33123456789"
}
```

**Réponse de succès (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "company_name": "ACME Inc.",
    "company_email": "contact@acme.com",
    "logo_url": "https://example.com/logo.png",
    "company_description": "Entreprise leader dans...",
    "industry": "Technologie",
    "website_url": "https://acme.com",
    "address": "123 Rue Principale, Paris",
    "company_size": "sme",
    "country": "France",
    "company_phone": "+33123456789",
    "is_verified": true,
    "is_certified": false,
    "is_first_login": false
  },
  "message": "Profil entreprise mis à jour avec succès"
}
```

#### 3. Vérifier si le profil d'une entreprise est complet
```http
GET /api/profile/company/:id/complete
```

**Réponse de succès (200 OK)**
```json
{
  "success": true,
  "data": {
    "isComplete": true,
    "missingFields": []
  },
  "message": "Le profil entreprise est complet"
}
```

## Codes d'erreur communs

| Code HTTP | Description |
|-----------|-------------|
| 400 | Requête invalide (données manquantes ou invalides) |
| 404 | Profil non trouvé |
| 500 | Erreur serveur interne |

## Validation des données

### Profil Freelance

Champs obligatoires pour un profil complet :
- Prénom (firstname)
- Nom (lastname)
- Titre du poste (job_title)
- Années d'expérience (experience_years)
- Description professionnelle (description)
- Taux journalier moyen (tjm)
- Pays (country)
- Téléphone (phone)

### Profil Entreprise

Champs obligatoires pour un profil complet :
- Nom de l'entreprise (company_name)
- Description de l'entreprise (company_description)
- Secteur d'activité (industry)
- Adresse (address)
- Taille de l'entreprise (company_size)
- Pays (country)
- Téléphone de l'entreprise (company_phone)

## Flux de complétion de profil

1. L'utilisateur s'inscrit et se connecte
2. Le système détecte si c'est sa première connexion (`is_first_login = true`)
3. L'utilisateur est redirigé vers le formulaire de complétion de profil
4. L'utilisateur remplit les informations requises
5. Le système marque `is_first_login = false` après la première mise à jour
6. Le système vérifie si le profil est complet avec l'endpoint `/complete`

## Sécurité

- Validation des données avec Zod pour éviter les injections
- Vérification des URLs pour prévenir les attaques XSS
- Accès au profil limité au propriétaire et aux administrateurs