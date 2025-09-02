# Module d'Authentification Admin

Ce module gère toutes les fonctionnalités d'authentification pour les administrateurs, incluant la connexion, la déconnexion, la gestion des sessions et le changement de mot de passe.

## Architecture

Le module d'authentification admin est construit avec les composants suivants :

- **AuthAdminService** : Contient toute la logique métier d'authentification
- **AuthAdminController** : Gère les requêtes HTTP et communique avec le service
- **AuthAdminRoutes** : Définit les endpoints de l'API
- **AuthAdminSchema** : Définit les schémas de validation Zod

## Fonctionnalités de sécurité

- Hashage des mots de passe avec bcrypt
- Validation des données avec Zod
- Gestion des sessions admin séparées des sessions utilisateurs
- Gestion des erreurs personnalisées
- Protection contre les attaques par timing
- Durée de session plus courte pour les administrateurs (2 heures)

## Endpoints API

### 1. Connexion Administrateur
```http
POST /api/admin/auth/login
```

**Corps de la requête**
```json
{
  "username": "admin",
  "password": "P@ssw0rd123",
  "sessionId": "uuid-optionnel"
}
```

**Réponse de succès (200 OK)**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "admin": {
      "id": "uuid",
      "username": "admin",
      "email": "admin@example.com",
      "level": "super_admin"
    },
    "sessionId": "uuid"
  },
  "message": "Connexion administrateur réussie"
}
```

### 2. Déconnexion Administrateur
```http
POST /api/admin/auth/logout
```

**Corps de la requête**
```json
{
  "sessionId": "uuid"
}
```

**Réponse de succès (200 OK)**
```json
{
  "success": true,
  "message": "Déconnexion administrateur réussie"
}
```

### 3. Validation de Session Admin
```http
POST /api/admin/auth/validate-session
```

**Corps de la requête**
```json
{
  "sessionId": "uuid"
}
```

**Réponse de succès (200 OK)**
```json
{
  "success": true,
  "data": {
    "isValid": true
  },
  "message": "Session valide"
}
```

### 4. Révoquer les Autres Sessions
```http
POST /api/admin/auth/revoke-other-sessions
```

**Corps de la requête**
```json
{
  "adminId": "uuid",
  "currentSessionId": "uuid"
}
```

**Réponse de succès (200 OK)**
```json
{
  "success": true,
  "data": {
    "revokedCount": 3
  },
  "message": "3 sessions révoquées avec succès"
}
```

### 5. Changer le Mot de Passe
```http
POST /api/admin/auth/change-password/:adminId
```

**Corps de la requête**
```json
{
  "currentPassword": "P@ssw0rd123",
  "newPassword": "NewP@ssw0rd456",
  "confirmPassword": "NewP@ssw0rd456"
}
```

**Réponse de succès (200 OK)**
```json
{
  "success": true,
  "message": "Mot de passe administrateur modifié avec succès"
}
```

## Codes d'erreur communs

| Code HTTP | Description |
|-----------|-------------|
| 400 | Requête invalide (données manquantes ou invalides) |
| 401 | Non autorisé (identifiants incorrects) |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur interne |

## Exigences de mot de passe

Les mots de passe d'administrateur doivent respecter les règles suivantes:
- Minimum 8 caractères
- Au moins une lettre minuscule
- Au moins une lettre majuscule
- Au moins un chiffre
- Au moins un caractère spécial (@, $, !, %, *, ?, &)
- Pas d'espaces

## Niveaux d'administrateur

Le système gère trois niveaux d'accès administrateur :
- **super_admin** : Accès complet à toutes les fonctionnalités
- **moderateur** : Accès à la modération du contenu et à la gestion des utilisateurs
- **support** : Accès limité aux fonctions d'assistance aux utilisateurs

## Gestion des sessions administrateurs

- Les sessions admin expirent après 2 heures d'inactivité (plus court que les sessions utilisateurs normales)
- Un admin peut révoquer toutes ses autres sessions depuis une session active
- Toutes les sessions d'un admin sont automatiquement révoquées lors d'un changement de mot de passe
- Les sessions inactives ou expirées sont automatiquement nettoyées par le système

## Sécurité

- Les mots de passe sont hashés avec bcrypt avant stockage
- Les tokens JWT pour admin ont une durée de validité plus courte
- Toute activité suspecte (connexions depuis plusieurs IP) est enregistrée
- Une authentification à deux facteurs peut être implémentée en option