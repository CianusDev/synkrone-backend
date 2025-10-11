# 📄 Contracts (Contrats)

Ce module gère les contrats entre freelances et entreprises pour les projets de la plateforme.  
Il propose une API REST complète avec création, consultation, mise à jour, suppression et filtrage/pagination des contrats.

---

## Structure du module

- **contracts.model.ts** : Interface TypeScript et enums pour les contrats.
- **contracts.schema.ts** : Schémas Zod pour la validation des requêtes (body, params, filtres).
- **contracts.repository.ts** : Accès aux données (CRUD, filtres, pagination).
- **contracts.service.ts** : Logique métier (validation, pagination, etc.).
- **contracts.controller.ts** : Handlers Express, validation, réponses JSON.
- **contracts.route.ts** : Définition des routes Express.

---

## Modèle de données

```ts
export enum ContractStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  PENDING = "pending",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  SUSPENDED = "suspended",
}

export enum PaymentMode {
  FIXED_PRICE = "fixed_price",
  DAILY_RATE = "daily_rate", 
  BY_MILESTONE = "by_milestone",
}

export interface Contract {
  id: string;
  application_id: string;
  project_id: string;
  freelance_id: string;
  company_id: string;
  payment_mode: PaymentMode;
  total_amount?: number;
  tjm?: number;
  estimated_days?: number;
  terms?: string;
  start_date?: Date;
  end_date?: Date;
  status: ContractStatus;
  created_at: Date;
  project?: Project;      // Informations enrichies du projet lié
  freelance?: Freelance;  // Informations enrichies du freelance lié
}
```

---

## Endpoints

### 1. Créer un contrat

`POST /api/contracts`

**Body :**
```json
{
  "application_id": "uuid",
  "project_id": "uuid",
  "freelance_id": "uuid",
  "company_id": "uuid",
  "payment_mode": "fixed_price",
  "total_amount": 5000.00,
  "tjm": 500.00,
  "estimated_days": 10,
  "terms": "Conditions du contrat...",
  "start_date": "2024-07-01",
  "end_date": "2024-08-01",
  "status": "draft" // optionnel
}
```

**Réponse :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Contrat créé avec succès"
}
```

---

### 2. Récupérer un contrat par ID

`GET /api/contracts/:id`

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "application_id": "uuid",
    "project_id": "uuid",
    "freelance_id": "uuid",
    "company_id": "uuid",
    "payment_mode": "fixed_price",
    "total_amount": 5000.00,
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z",
    "project": {
      "id": "uuid",
      "title": "Développement application mobile",
      "description": "...",
      "budgetMin": 4000,
      "budgetMax": 6000,
      "status": "published",
      "companyId": "uuid"
    },
    "freelance": {
      "id": "uuid",
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      "job_title": "Développeur Mobile",
      "tjm": 500,
      "experience": "expert"
    },
    "deliverables": [
      {
        "id": "uuid-deliverable-1",
        "title": "Analyse des besoins",
        "description": "Document d'analyse détaillée",
        "status": "validated",
        "is_milestone": true,
        "amount": 1000,
        "due_date": "2024-02-01",
        "submitted_at": "2024-01-28T10:00:00Z",
        "validated_at": "2024-01-29T14:30:00Z",
        "feedback": "Excellent travail",
        "order": 1,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-29T14:30:00Z",
        "medias": [
          {
            "id": "uuid-media-1",
            "url": "https://storage.example.com/analysis.pdf",
            "type": "pdf",
            "size": 1024000,
            "uploadedAt": "2024-01-28T09:30:00Z",
            "uploadedBy": "uuid-freelance",
            "description": "Document d'analyse complet"
          }
        ]
      },
      {
        "id": "uuid-deliverable-2",
        "title": "Développement fonctionnalités",
        "description": "Implémentation des fonctionnalités principales",
        "status": "in_progress",
        "is_milestone": true,
        "amount": 3000,
        "due_date": "2024-02-15",
        "submitted_at": null,
        "validated_at": null,
        "feedback": null,
        "order": 2,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": null,
        "medias": []
      }
    ]
  },
  "message": "Contrat récupéré avec succès"
}
```

> **Note :** Tous les endpoints GET retournent maintenant les informations enrichies du projet, du freelance et des livrables associés au contrat. Chaque livrable inclut également ses médias attachés (documents, images, etc.).

---

### 3. Récupérer les contrats d'un freelance (avec filtres et pagination)

`GET /api/contracts/freelance/:freelanceId?page=1&limit=10&status=active`

**Query params possibles :**
- `status`
- `page`
- `limit`
- `paymentMode`

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "payment_mode": "daily_rate",
      "tjm": 500,
      "status": "active",
      "project": {
        "title": "Développement API REST",
        "description": "...",
        "companyId": "uuid"
      },
      "freelance": {
        "firstname": "John",
        "lastname": "Doe",
        "job_title": "Développeur Backend"
      }
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "message": "Liste des contrats du freelance récupérée avec succès"
}
```

---

### 4. Récupérer les contrats d'une entreprise (avec filtres et pagination)

`GET /api/contracts/company/:companyId?page=1&limit=10&status=completed`

**Query params possibles :**
- `status`
- `page`
- `limit`
- `paymentMode`

**Réponse :**
```json
{
  "success": true,
  "data": [ ... ],
  "total": 12,
  "page": 1,
  "limit": 10,
  "totalPages": 2,
  "message": "Liste des contrats de l'entreprise récupérée avec succès"
}
```

---

### 5. Récupérer les contrats d'un projet (avec filtres et pagination)

`GET /api/contracts/project/:projectId?page=1&limit=10&status=draft`

**Query params possibles :**
- `status`
- `page`
- `limit`
- `paymentMode`

**Réponse :**
```json
{
  "success": true,
  "data": [ ... ],
  "total": 7,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "message": "Liste des contrats du projet récupérée avec succès"
}
```

---

### 6. Filtrer les contrats (tous critères, via body)

`POST /api/contracts/filter`

**Body :**
```json
{
  "status": "active",
  "freelanceId": "uuid",
  "companyId": "uuid",
  "projectId": "uuid",
  "paymentMode": "daily_rate",
  "page": 1,
  "limit": 10
}
```

**Réponse :**
```json
{
  "success": true,
  "data": [ ... ],
  "total": 3,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "message": "Liste des contrats filtrée récupérée avec succès"
}
```

---

### 7. Modifier un contrat

`PATCH /api/contracts/:id`

**Body :**
```json
{
  "payment_mode": "daily_rate",
  "tjm": 600.00,
  "estimated_days": 15,
  "terms": "Nouvelles conditions...",
  "start_date": "2024-08-01",
  "end_date": "2024-09-01"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Contrat mis à jour avec succès"
}
```

---

### 8. Accepter un contrat

`PATCH /api/contracts/:id/accept`

**Réponse :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Contrat accepté avec succès"
}
```

---

### 9. Refuser un contrat

`PATCH /api/contracts/:id/refuse`

**Réponse :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Contrat refusé avec succès"
}
```

---

### 10. Activer un contrat pending

`PATCH /api/contracts/:id/activate`

**Réponse :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Contrat activé avec succès"
}
```

---

### 11. Mettre un contrat en pending

`PATCH /api/contracts/:id/set-pending`

**Réponse :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Contrat mis en pending avec succès"
}
```

---

### 12. Mettre à jour le statut d'un contrat

`PATCH /api/contracts/:id/status`

**Body :**
```json
{
  "status": "completed"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Statut du contrat mis à jour avec succès"
}
```

---

### 13. Demander une modification de contrat

`PATCH /api/contracts/:id/request-modification`

**Body (obligatoire) :**
```json
{
  "reason": "Je souhaiterais modifier les dates du projet car j'ai besoin de plus de temps pour la phase de tests."
}
```

**Validation :**
- `reason` : Obligatoire, minimum 10 caractères, maximum 500 caractères

**Comportement :**
- Change le statut du contrat de `active` vers `pending`
- Envoie une notification email à l'entreprise
- Envoie automatiquement un message système dans le chat de l'entreprise avec la raison fournie

**Réponse :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Demande de modification envoyée avec succès"
}
```

---

### 14. Supprimer un contrat

`DELETE /api/contracts/:id`

**Réponse :**
```json
{
  "success": true,
  "message": "Contrat supprimé avec succès"
}
```

---

## Modes de paiement supportés

### 1. Prix fixe (`fixed_price`)
Montant total défini à l'avance pour tout le projet.
- **Requis** : `total_amount`
- **Optionnel** : `tjm`, `estimated_days` (pour information)

```json
{
  "payment_mode": "fixed_price",
  "total_amount": 5000.00
}
```

### 2. Taux journalier (`daily_rate`)  
Paiement basé sur TJM × nombre de jours travaillés.
- **Requis** : `tjm`, `estimated_days`
- **Optionnel** : `total_amount` (calculé automatiquement)

```json
{
  "payment_mode": "daily_rate", 
  "tjm": 500.00,
  "estimated_days": 10
}
```

### 3. Par étapes (`by_milestone`)
Paiement échelonné selon les livrables validés.
- **Requis** : `total_amount`
- **Logique** : Le montant est réparti sur les livrables milestone

```json
{
  "payment_mode": "by_milestone",
  "total_amount": 8000.00
}
```

---

## Validation

- Toutes les entrées sont validées avec Zod (body, params, query).
- Validation automatique de la cohérence selon le mode de paiement.
- Les erreurs de validation retournent un code 400 et un message détaillé.

---

## Pagination & Filtres

- Les endpoints de liste acceptent `page`, `limit`, `status`, `paymentMode` en query ou body.
- La réponse inclut toujours le nombre total d'éléments et de pages.
- Modes de paiement supportés : `fixed_price`, `daily_rate`, `by_milestone`

---

## Logique métier

### Workflow de validation des contrats
1. **Création** : L'entreprise crée un contrat avec le statut `draft`
2. **Modification** : L'entreprise peut modifier le contrat tant qu'il est en statut `draft`
3. **Acceptation/Refus** : Le freelance peut accepter ou refuser le contrat :
   - **Acceptation avec livrables milestone** : statut → `active`
   - **Acceptation sans livrables milestone** : statut → `pending`
   - **Refus** : statut → `cancelled`
4. **Demande de modification** : Le freelance peut demander une modification d'un contrat actif :
   - **Demande de modification** : `active` → `pending` (l'entreprise peut alors modifier le contrat)
   - **Communication automatique** : La raison est envoyée dans le chat de l'entreprise via un message système
5. **Gestion des livrables** :
   - **Ajout de milestones** : `pending` → `active`
   - **Suppression de tous les milestones** : `active` → `pending`
6. **Verrouillage** : Une fois accepté ou refusé, le contrat n'est plus modifiable (sauf demande de modification ou transitions milestone)

### Validation automatique
- **fixed_price** / **by_milestone** : `total_amount` obligatoire et positif
- **daily_rate** : `tjm` et `estimated_days` obligatoires et positifs  
- **Dates** : `start_date` doit être antérieure à `end_date`
- **Unicité** : Un seul contrat par candidature acceptée
- **Modification** : Seuls les contrats en statut `draft` peuvent être modifiés
- **Acceptation/Refus** : Seuls les contrats en statut `draft` peuvent être acceptés/refusés

### Calculs automatiques
- **daily_rate** : `montant_estimé = tjm × estimated_days`
- **Statuts** : Workflow `draft` → `active`/`pending` → `completed`/`cancelled`
- **Transitions automatiques** : Basculement `pending` ↔ `active` selon la présence de livrables milestone

---

## Enrichissement des données

Tous les endpoints **GET** retournent désormais les contrats enrichis avec :

- **`project`** : Informations complètes du projet associé (titre, description, budget, statut, etc.)
- **`freelance`** : Informations du freelance associé (nom, prénom, titre, expérience, TJM, etc.)
- **`deliverables`** : Liste complète des livrables du contrat avec leurs médias associés (documents, images, fichiers)

Cet enrichissement se fait automatiquement via des JOIN en base de données pour optimiser les performances et éviter les requêtes multiples côté client. Les livrables sont triés par ordre (`order` ASC) puis par date de création (`created_at` ASC).

## Sécurité & Bonnes pratiques

- Les IDs sont validés (UUID).
- Les statuts et modes de paiement sont limités aux valeurs des enums.
- Validation de la cohérence métier selon le mode de paiement.
- Les champs optionnels (`terms`, `start_date`, `end_date`, etc.) sont correctement typés et traités.
- **Données enrichies** : Les informations projet/freelance sont récupérées via LEFT JOIN pour éviter les erreurs si des références sont supprimées.
- Les middlewares d'authentification sont appliqués selon le rôle :
  - **Création** : entreprise ou admin
  - **Modification** : entreprise ou admin (statut draft uniquement)
  - **Acceptation/Refus** : freelance concerné uniquement
  - **Demande de modification** : freelance concerné uniquement (statut active)
  - **Transitions milestone** : admin ou système (activation/suspension selon milestones)
  - **Consultation** : freelance, entreprise ou admin
  - **Suppression/Statut** : admin uniquement

---

## 📬 Intégration avec le système de Messages

### Demande de modification automatique dans le chat

Lorsqu'un freelance demande une modification de contrat, le système :

1. **Met à jour le statut** : `active` → `pending`
2. **Envoie un email** à l'entreprise (notification classique)
3. **Crée automatiquement un message système** dans la conversation entre le freelance et l'entreprise

**Format du message automatique :**
```
🔄 **Demande de modification du contrat**

Raison : [Raison fournie par le freelance]

Le contrat a été remis en attente pour permettre les modifications nécessaires.
```

**Intégration requise :**
- Service de Messages (`MessageService`)
- Service de Conversations (`ConversationService`)
- La conversation est créée automatiquement si elle n'existe pas

### Avantages de cette approche

- ✅ **Traçabilité** : La demande est visible dans l'historique du chat
- ✅ **Communication directe** : Pas besoin de passer par les emails uniquement
- ✅ **Context** : Le message apparaît dans la conversation liée au projet/contrat
- ✅ **Temps réel** : Si le chat est ouvert, la notification apparaît immédiatement

## Exemple d'intégration

Dans ton app Express principale :

```ts
import contractsRoutes from "./src/features/contracts/contracts.route";
app.use("/api/contracts", contractsRoutes);
```

---

---

## 📧 Notifications Email

Le module contrats intègre un système de notification automatique par email utilisant les templates définis dans `smtp-email.ts`.

### Notifications automatiques

Les actions suivantes déclenchent automatiquement l'envoi d'emails :

| Action | Template | Destinataire | Description |
|--------|----------|-------------|-------------|
| **Création de contrat** | `contractProposed` | Freelance | Proposition de contrat reçue |
| **Acceptation** | `contractAccepted` | Entreprise | Contrat accepté par le freelance |
| **Refus** | `contractRejected` | Entreprise | Contrat refusé par le freelance |
| **Mise à jour** | `contractUpdated` | Freelance | Contrat modifié par l'entreprise |
| **Demande de modification** | `contractModificationRequested` + Message chat | Entreprise | Freelance demande une modification |
| **Completion auto** | `contractCompletedAutomatic` + `contractCompletedAutomaticCompany` | Les deux | Contrat terminé automatiquement |

### Service de notification

Le `ContractsNotificationService` gère l'envoi des emails :

```typescript
import { ContractsNotificationService } from './contracts-notification.service';

const notificationService = new ContractsNotificationService();

// Notification manuelle
await notificationService.notifyContractProposed(contractId);
await notificationService.notifyContractAccepted(contractId);
await notificationService.notifyContractRejected(contractId);
```

### Configuration

Assurez-vous que les variables d'environnement SMTP sont configurées :

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
FRONTEND_URL=https://yourapp.com
APP_NAME=Synkrone
```

### Gestion des erreurs

- Les notifications **ne font jamais échouer** les opérations principales
- Les erreurs sont loggées mais n'interrompent pas le workflow
- Les succès et échecs sont tracés dans les logs

Voir `contracts-notifications-examples.md` pour plus de détails.

---

## Auteur & Contact

Pour toute question ou amélioration, contacte l'équipe backend.