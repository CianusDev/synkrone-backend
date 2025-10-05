# 👑 Admin Feature — Synkrone Backend

Gestion administrative complète de la plateforme Synkrone.  
Cette feature permet aux administrateurs de gérer les utilisateurs, projets, sessions et d'accéder aux statistiques de la plateforme.

---

## 🗂️ Structure des fichiers

- `admin.model.ts` — Interfaces & enums TypeScript pour l'administration
- `admin.repository.ts` — Accès BDD avec fonctions PostgreSQL avancées
- `admin.service.ts` — Logique métier pour toutes les actions admin
- `admin.controller.ts` — Handlers Express pour tous les endpoints admin
- `admin.route.ts` — Définition des routes Express avec middleware d'authentification
- `admin.schema.ts` — Schémas Zod pour validation des payloads
- `README.md` — Documentation de la feature

---

## 🗄️ Niveaux d'administration

```typescript
export enum AdminLevel {
  SUPER_ADMIN = "super_admin",     // Tous les droits, gestion des autres admins
  MODERATEUR = "moderateur",       // Gestion des utilisateurs et projets
  SUPPORT = "support",            // Consultation uniquement
}
```

### Permissions par niveau

| Action | Super Admin | Modérateur | Support |
|--------|-------------|------------|---------|
| Voir les stats | ✅ | ✅ | ✅ |
| Gérer les admins | ✅ | ❌ | ❌ |
| Bloquer/débloquer users | ✅ | ✅ | ❌ |
| Vérifier users | ✅ | ✅ | ❌ |
| Certifier entreprises | ✅ | ✅ | ❌ |
| Modérer projets | ✅ | ✅ | ❌ |
| Révoquer sessions | ✅ | ✅ | ❌ |
| Voir activité suspecte | ✅ | ✅ | ✅ |

---

## 🔒 Sécurité & Accès

Toutes les routes sont protégées par le middleware :
- `AuthAdminMiddleware` (seuls les administrateurs authentifiés peuvent accéder)

---

## 🚦 API Endpoints

### 📊 Dashboard & Statistiques

| Méthode | URL | Description | Permissions |
|---------|-----|-------------|-------------|
| GET | `/admin/dashboard/stats` | Statistiques générales | Tous |

### 👥 Gestion des Admins

| Méthode | URL | Description | Permissions |
|---------|-----|-------------|-------------|
| GET | `/admin/admins` | Liste des administrateurs | Tous |
| GET | `/admin/admins/:id` | Détails d'un admin | Tous |
| POST | `/admin/admins` | Créer un administrateur | Super Admin |
| PATCH | `/admin/admins/:id/password` | Changer mot de passe | Super Admin |
| PATCH | `/admin/admins/:id/level` | Changer niveau d'accès | Super Admin |
| DELETE | `/admin/admins/:id` | Supprimer un admin | Super Admin |

### 🔐 Gestion des Sessions

| Méthode | URL | Description | Permissions |
|---------|-----|-------------|-------------|
| GET | `/admin/sessions/users` | Sessions utilisateurs | Tous |
| GET | `/admin/sessions/admins` | Sessions administrateurs | Tous |
| GET | `/admin/sessions/stats` | Statistiques des sessions | Tous |
| GET | `/admin/sessions/suspicious` | Activités suspectes | Tous |
| POST | `/admin/sessions/revoke/user` | Révoquer session utilisateur | Modérateur+ |
| POST | `/admin/sessions/revoke/admin` | Révoquer session admin | Super Admin |
| POST | `/admin/sessions/revoke/user/:userId/all` | Révoquer toutes sessions utilisateur | Modérateur+ |
| POST | `/admin/sessions/cleanup` | Nettoyer sessions expirées | Modérateur+ |

### 💼 Gestion des Freelances

| Méthode | URL | Description | Permissions |
|---------|-----|-------------|-------------|
| GET | `/admin/freelances` | Liste des freelances | Tous |
| GET | `/admin/freelances/:id` | Détails d'un freelance | Tous |
| POST | `/admin/freelances/:id/block` | Bloquer un freelance | Modérateur+ |
| POST | `/admin/freelances/:id/unblock` | Débloquer un freelance | Modérateur+ |
| POST | `/admin/freelances/:id/verify` | Vérifier un freelance | Modérateur+ |
| POST | `/admin/freelances/:id/unverify` | Retirer vérification | Modérateur+ |

### 🏢 Gestion des Entreprises

| Méthode | URL | Description | Permissions |
|---------|-----|-------------|-------------|
| GET | `/admin/companies` | Liste des entreprises | Tous |
| GET | `/admin/companies/:id` | Détails d'une entreprise | Tous |
| POST | `/admin/companies/:id/block` | Bloquer une entreprise | Modérateur+ |
| POST | `/admin/companies/:id/unblock` | Débloquer une entreprise | Modérateur+ |
| POST | `/admin/companies/:id/verify` | Vérifier une entreprise | Modérateur+ |
| POST | `/admin/companies/:id/unverify` | Retirer vérification | Modérateur+ |
| POST | `/admin/companies/:id/certify` | Certifier une entreprise | Modérateur+ |
| POST | `/admin/companies/:id/uncertify` | Retirer certification | Modérateur+ |

### 📋 Gestion des Projets

| Méthode | URL | Description | Permissions |
|---------|-----|-------------|-------------|
| GET | `/admin/projects` | Liste des projets | Tous |
| GET | `/admin/projects/:id` | Détails d'un projet | Tous |
| PATCH | `/admin/projects/:id/status` | Changer statut projet | Modérateur+ |
| DELETE | `/admin/projects/:id` | Supprimer un projet | Modérateur+ |

---

## 📊 Statistiques Dashboard

### Structure des données

```json
{
  "users": {
    "totalFreelances": 1250,
    "totalCompanies": 340,
    "verifiedFreelances": 890,
    "verifiedCompanies": 256,
    "blockedFreelances": 12,
    "blockedCompanies": 3,
    "newFreelancesThisMonth": 45,
    "newCompaniesThisMonth": 12
  },
  "projects": {
    "totalProjects": 2100,
    "draftProjects": 150,
    "publishedProjects": 1800,
    "pendingProjects": 150,
    "newProjectsThisMonth": 180
  },
  "contracts": {
    "totalContracts": 980,
    "activeContracts": 125,
    "completedContracts": 780,
    "cancelledContracts": 75
  },
  "sessions": {
    "totalActiveSessions": 234,
    "activeFreelanceSessions": 156,
    "activeCompanySessions": 67,
    "activeAdminSessions": 11,
    "sessionsLast24h": 456
  },
  "platform": {
    "totalRevenue": 125000.50,
    "totalCommissions": 12500.05,
    "averageProjectValue": 2500.00,
    "completionRate": 89.5
  }
}
```

---

## 📥 Payloads & Validation

### Créer un administrateur

```json
{
  "username": "admin_user",
  "email": "admin@synkrone.com",
  "password_hashed": "hashed_password_here",
  "level": "moderateur"
}
```

### Bloquer un utilisateur

```json
{
  "durationDays": 7,
  "reason": "Violation des conditions d'utilisation"
}
```

- `durationDays`: `-1` pour indéfini, `0+` pour temporaire
- `reason`: Motif du blocage (optionnel)

### Vérifier/Certifier un utilisateur

```json
{
  "reason": "Documents vérifiés manuellement"
}
```

### Révoquer une session

```json
{
  "sessionId": "uuid-session-id",
  "reason": "Activité suspecte détectée"
}
```

### Changer statut d'un projet

```json
{
  "status": "is_pending",
  "reason": "Contenu nécessitant une révision"
}
```

---

## 📄 Pagination & Filtres

Tous les endpoints de liste supportent la pagination et des filtres spécifiques :

### Freelances
- `page`, `limit` : Pagination
- `search` : Recherche sur nom, prénom, email
- `isVerified`, `isBlocked` : Filtres de statut
- `availability`, `experience`, `country` : Filtres métier
- `minTjm`, `maxTjm` : Fourchette de TJM
- `sortBy`, `sortOrder` : Tri

### Entreprises
- `page`, `limit` : Pagination
- `search` : Recherche sur nom, email, secteur
- `isVerified`, `isCertified`, `isBlocked` : Filtres de statut
- `industry`, `companySize`, `country` : Filtres métier
- `sortBy`, `sortOrder` : Tri

### Projets
- `page`, `limit` : Pagination
- `search` : Recherche sur titre, description
- `status`, `typeWork` : Filtres de statut
- `companyId`, `categoryId` : Filtres de relation
- `minBudget`, `maxBudget` : Fourchette de budget
- `sortBy`, `sortOrder` : Tri

### Sessions
- `page`, `limit` : Pagination
- `userType` : Type d'utilisateur (freelance/company)
- `sessionStatus` : Statut de session
- `sortBy`, `sortOrder` : Tri

---

## 🛡️ Fonctions PostgreSQL Utilisées

Cette feature tire parti des fonctions PostgreSQL définies dans `database.sql` :

### Gestion des sessions
- `admin_revoke_session(session_uuid)` : Révoquer une session utilisateur
- `admin_revoke_admin_session(session_uuid)` : Révoquer une session admin
- `admin_revoke_user_sessions(user_uuid)` : Révoquer toutes les sessions d'un utilisateur
- `cleanup_expired_sessions()` : Nettoyer les sessions expirées
- `cleanup_expired_admin_sessions()` : Nettoyer les sessions admin expirées
- `cleanup_expired_otps()` : Nettoyer les OTP expirés

### Gestion des utilisateurs
- `admin_block_freelance(freelance_uuid, duration_days)` : Bloquer un freelance
- `admin_block_company(company_uuid, duration_days)` : Bloquer une entreprise
- `is_freelance_blocked(freelance_uuid)` : Vérifier si un freelance est bloqué
- `is_company_blocked(company_uuid)` : Vérifier si une entreprise est bloquée

### Vues administratives
- `admin_user_sessions` : Vue détaillée des sessions utilisateurs
- `admin_admin_sessions` : Vue détaillée des sessions admin
- `admin_session_stats` : Statistiques des sessions utilisateurs
- `admin_admin_session_stats` : Statistiques des sessions admin
- `admin_suspicious_activity` : Activités suspectes utilisateurs
- `admin_suspicious_admin_activity` : Activités suspectes admin

---

## 🔍 Activités Suspectes

Le système détecte automatiquement les activités suspectes :

### Critères de détection
- **Utilisateurs** : Plus de 3 IP différentes en 7 jours
- **Admins** : Plus de 2 IP différentes en 7 jours
- Sessions multiples simultanées
- Changements fréquents d'IP

### Structure des données

```json
{
  "userId": "uuid",
  "userEmail": "user@example.com",
  "userType": "freelance",
  "differentIps": 5,
  "totalSessions": 12,
  "lastActivity": "2024-01-20T10:30:00Z",
  "ipAddresses": ["192.168.1.1", "10.0.0.1", "..."]
}
```

---

## ⚠️ Erreurs possibles

- `400 Bad Request` : Payload invalide (validation Zod)
- `401 Unauthorized` : Token manquant ou invalide
- `403 Forbidden` : Permissions insuffisantes pour l'action
- `404 Not Found` : Ressource non trouvée
- `409 Conflict` : Conflit (ex: admin déjà existant)
- `500 Internal Server Error` : Erreur serveur

---

## 🔗 Intégration

Import du router dans le routeur principal Express :

```typescript
import adminRouter from "./features/admin/admin.route";
app.use("/admin", adminRouter);
```

---

## 🧪 Exemples d'utilisation

### Récupérer les statistiques

```bash
curl -X GET "http://localhost:3000/admin/dashboard/stats" \
  -H "Authorization: Bearer admin-jwt-token"
```

### Bloquer un freelance

```bash
curl -X POST "http://localhost:3000/admin/freelances/uuid/block" \
  -H "Authorization: Bearer admin-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"durationDays": 7, "reason": "Violation des CGU"}'
```

### Lister les sessions suspectes

```bash
curl -X GET "http://localhost:3000/admin/sessions/suspicious" \
  -H "Authorization: Bearer admin-jwt-token"
```

### Nettoyer les sessions expirées

```bash
curl -X POST "http://localhost:3000/admin/sessions/cleanup" \
  -H "Authorization: Bearer admin-jwt-token"
```

---

## 🛡️ Logs & Audit

Toutes les actions administratives sont loggées automatiquement :

```typescript
// Exemple de log automatique
console.log(`Admin ${admin.username} a bloqué le freelance ${freelance.email} pour ${duration}. Raison: ${reason}`);
```

### Types de logs
- Actions de blocage/déblocage
- Vérifications/certifications
- Révocations de sessions
- Suppressions de contenu
- Changements de niveaux d'accès

---

## 🚀 Extensions futures

### Fonctionnalités prévues
- Dashboard temps réel avec WebSocket
- Rapports d'activité exportables (PDF/Excel)
- Système d'alertes automatiques
- Historique complet des actions admin
- Interface de gestion des contenus signalés
- Outils d'analyse de fraude avancés

### Améliorations techniques
- Cache Redis pour les statistiques
- Rate limiting par niveau d'admin
- Audit trail en base de données
- Notifications push pour les urgences

---

## 📚 Liens utiles

- [Documentation PostgreSQL Functions](../../database.sql)
- [Middleware d'authentification](../../middlewares/auth-admin.middleware.ts)
- [Zod (validation)](https://zod.dev/)
- [Express](https://expressjs.com/)

---

**Pour toute question ou extension de cette feature, voir la documentation du backend Synkrone ou contacter l'équipe technique.**