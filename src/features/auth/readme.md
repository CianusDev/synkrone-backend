# Module d'Authentification

Ce module gère toutes les fonctionnalités d'authentification pour les freelances et les entreprises, incluant l'inscription, la connexion, la vérification d'email, la réinitialisation de mot de passe, et la gestion des sessions.

## Architecture

Le module d'authentification est construit avec les composants suivants :

- **AuthService** : Contient toute la logique métier
- **AuthController** : Gère les requêtes HTTP et communique avec le service
- **AuthRoute** : Définit les endpoints de l'API
- **AuthSchema** : Définit les schémas de validation Zod

## Fonctionnalités de sécurité

- Hashage des mots de passe avec bcrypt
- Vérification d'email par OTP
- Validation des données avec Zod
- Gestion des sessions
- Gestion des erreurs personnalisées
- Protection contre les attaques par timing

## Endpoints API

### Authentification Unifiée

#### 1. Connexion Unifiée (Auto-détection)
```http
POST /api/auth/login
```

**Corps de la requête**
```json
{
  "email": "user@example.com",
  "password": "P@ssw0rd123",
  "sessionId": "uuid-optionnel"
}
```

**Réponse de succès pour Freelance (200 OK)**
```json
{
  "success": true,
  "data": {
    "userType": "freelance",
    "token": "jwt-token",
    "freelance": {
      "id": "uuid",
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      "is_verified": true
    },
    "sessionId": "uuid"
  },
  "message": "Login successful"
}
```

**Réponse de succès pour Entreprise (200 OK)**
```json
{
  "success": true,
  "data": {
    "userType": "company",
    "token": "jwt-token",
    "company": {
      "id": "uuid",
      "company_email": "contact@company.com",
      "company_name": "ACME Inc.",
      "is_verified": true
    },
    "sessionId": "uuid"
  },
  "message": "Login successful"
}
```

### Authentification Freelance

#### 1. Inscription Freelance
```http
POST /api/auth/freelance/register
```

**Corps de la requête**
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "password": "P@ssw0rd123"
}
```

**Réponse de succès (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "is_verified": false
  },
  "message": "Freelance registered successfully"
}
```

#### 2. Connexion Freelance (Spécifique - Compatibilité)
```http
POST /api/auth/freelance/login
```

**Corps de la requête**
```json
{
  "email": "john@example.com",
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
    "freelance": {
      "id": "uuid",
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      "is_verified": true
    },
    "sessionId": "uuid"
  },
  "message": "Login successful"
}
```

**Note:** Utilisez plutôt l'endpoint unifié `/api/auth/login`

#### 3. Vérification d'Email Freelance
```http
POST /api/auth/freelance/verify-email
```

**Corps de la requête**
```json
{
  "email": "john@example.com",
  "code": "123456"
}
```

**Réponse de succès (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "is_verified": true
  },
  "message": "Email verified successfully"
}
```

#### 4. Demande de Réinitialisation de Mot de Passe Freelance
```http
POST /api/auth/freelance/forgot-password
```

**Corps de la requête**
```json
{
  "email": "john@example.com"
}
```

**Réponse de succès (200 OK)**
```json
{
  "success": true,
  "message": "Password reset link sent successfully"
}
```

#### 5. Réinitialisation de Mot de Passe Freelance
```http
POST /api/auth/freelance/reset-password
```

**Corps de la requête**
```json
{
  "email": "john@example.com",
  "code": "123456",
  "newPassword": "NewP@ssw0rd123"
}
```

**Réponse de succès (200 OK)**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

#### 6. Renvoi du Code de Vérification d'Email Freelance
```http
POST /api/auth/freelance/resend-email-otp
```

**Corps de la requête**
```json
{
  "email": "john@example.com"
}
```

**Réponse de succès (200 OK)**
```json
{
  "success": true,
  "message": "Email verification OTP resent successfully"
}
```

#### 7. Renvoi du Code de Réinitialisation de Mot de Passe Freelance
```http
POST /api/auth/freelance/resend-reset-otp
```

**Corps de la requête**
```json
{
  "email": "john@example.com"
}
```

**Réponse de succès (200 OK)**
```json
{
  "success": true,
  "message": "Password reset OTP resent successfully"
}
```

### Authentification Entreprise

#### 1. Inscription Entreprise
```http
POST /api/auth/company/register
```

**Corps de la requête**
```json
{
  "company_email": "contact@company.com",
  "password": "P@ssw0rd123"
}
```

**Réponse de succès (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "company_email": "contact@company.com",
    "is_verified": false
  },
  "message": "Company registered successfully"
}
```

#### 2. Connexion Entreprise (Spécifique - Compatibilité)
```http
POST /api/auth/company/login
```

**Corps de la requête**
```json
{
  "email": "contact@company.com",
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
    "company": {
      "id": "uuid",
      "company_email": "contact@company.com",
      "company_name": "ACME Inc.",
      "is_verified": true
    },
    "sessionId": "uuid"
  },
  "message": "Login successful"
}
```

**Note:** Utilisez plutôt l'endpoint unifié `/api/auth/login`

#### 3. Vérification d'Email Entreprise
```http
POST /api/auth/company/verify-email
```

**Corps de la requête**
```json
{
  "email": "contact@company.com",
  "code": "123456"
}
```

**Réponse de succès (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "is_verified": true
  },
  "message": "Email verified successfully"
}
```

#### 4. Demande de Réinitialisation de Mot de Passe Entreprise
```http
POST /api/auth/company/forgot-password
```

**Corps de la requête**
```json
{
  "email": "contact@company.com"
}
```

**Réponse de succès (200 OK)**
```json
{
  "success": true,
  "message": "Password reset link sent successfully"
}
```

#### 5. Réinitialisation de Mot de Passe Entreprise
```http
POST /api/auth/company/reset-password
```

**Corps de la requête**
```json
{
  "email": "contact@company.com",
  "code": "123456",
  "newPassword": "NewP@ssw0rd123"
}
```

**Réponse de succès (200 OK)**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

#### 6. Renvoi du Code de Vérification d'Email Entreprise
```http
POST /api/auth/company/resend-email-otp
```

**Corps de la requête**
```json
{
  "email": "contact@company.com"
}
```

**Réponse de succès (200 OK)**
```json
{
  "success": true,
  "message": "Email verification OTP resent successfully"
}
```

#### 7. Renvoi du Code de Réinitialisation de Mot de Passe Entreprise
```http
POST /api/auth/company/resend-reset-otp
```

**Corps de la requête**
```json
{
  "email": "contact@company.com"
}
```

**Réponse de succès (200 OK)**
```json
{
  "success": true,
  "message": "Password reset OTP resent successfully"
}
```

### Authentification Commune

#### 1. Déconnexion
```http
POST /api/auth/logout
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
  "message": "Logout successful"
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

Les mots de passe doivent respecter les règles suivantes:
- Minimum 8 caractères
- Au moins une lettre minuscule
- Au moins une lettre majuscule
- Au moins un chiffre
- Au moins un caractère spécial (@, $, !, %, *, ?, &)
- Pas d'espaces

## Flux d'authentification

1. **Inscription** : L'utilisateur s'inscrit, un OTP est envoyé à son email
2. **Vérification d'email** : L'utilisateur vérifie son email avec l'OTP
3. **Connexion** : L'utilisateur se connecte avec ses identifiants
4. **Oubli de mot de passe** : En cas d'oubli, un OTP est envoyé pour réinitialiser
5. **Réinitialisation** : L'utilisateur définit un nouveau mot de passe avec l'OTP
6. **Déconnexion** : L'utilisateur se déconnecte, la session est invalidée

## Sécurité

- Les mots de passe sont hashés avec bcrypt avant stockage
- Les tokens JWT expirent après 7 jours
- Les sessions inactives sont automatiquement expirées
- Les OTP ont une validité de 10 minutes
- Les OTP sont à usage unique et invalidés après utilisation