# 📧 Notifications Email - Module Contracts

Ce document explique comment les notifications email sont intégrées dans le module des contrats et comment utiliser le service de notification.

## Vue d'ensemble

Le `ContractsNotificationService` gère automatiquement l'envoi des emails lors des actions sur les contrats. Il utilise les templates prédéfinis dans `smtp-email.ts`.

## Actions notifiées automatiquement

### 1. Création de contrat (Proposition)
```typescript
// Lors de la création d'un contrat
const contract = await contractsService.createContract(contractData);
// ✅ Email automatique envoyé au freelance avec le template 'contractProposed'
```

**Template utilisé** : `contractProposed`  
**Destinataire** : Freelance  
**Contenu** : Notification qu'une nouvelle proposition de contrat a été reçue

### 2. Acceptation de contrat
```typescript
// Quand un freelance accepte un contrat
await contractsService.acceptContract(contractId);
// ✅ Email automatique envoyé à l'entreprise avec le template 'contractAccepted'
```

**Template utilisé** : `contractAccepted`  
**Destinataire** : Entreprise  
**Contenu** : Confirmation que le freelance a accepté le contrat

### 3. Refus de contrat
```typescript
// Quand un freelance refuse un contrat
await contractsService.refuseContract(contractId);
// ✅ Email automatique envoyé à l'entreprise avec le template 'contractRejected'
```

**Template utilisé** : `contractRejected`  
**Destinataire** : Entreprise  
**Contenu** : Information que le freelance a refusé le contrat

### 4. Mise à jour de contrat
```typescript
// Quand une entreprise modifie un contrat
await contractsService.updateContract(contractId, updateData);
// ✅ Email automatique envoyé au freelance avec le template 'contractUpdated'
```

**Template utilisé** : `contractUpdated`  
**Destinataire** : Freelance  
**Contenu** : Notification que le contrat a été modifié par l'entreprise

### 5. Completion automatique de contrat
```typescript
// Quand un contrat passe au statut COMPLETED (tous les livrables validés)
await contractsService.updateContractStatus(contractId, ContractStatus.COMPLETED);
// ✅ Emails automatiques envoyés aux deux parties
```

**Templates utilisés** :
- `contractCompletedAutomatic` (freelance)
- `contractCompletedAutomaticCompany` (entreprise)

**Destinataires** : Freelance ET Entreprise  
**Contenu** : Confirmation que le contrat est terminé avec succès

## Utilisation manuelle du service de notification

Si vous devez envoyer des notifications manuellement :

```typescript
import { ContractsNotificationService } from './contracts-notification.service';

const notificationService = new ContractsNotificationService();

// Notification de proposition de contrat
await notificationService.notifyContractProposed(contractId);

// Notification d'acceptation
await notificationService.notifyContractAccepted(contractId);

// Notification de refus
await notificationService.notifyContractRejected(contractId);

// Notification de mise à jour
await notificationService.notifyContractUpdated(contractId);

// Notification de completion automatique (aux deux parties)
await notificationService.notifyContractCompletedAutomatic(contractId);

// Notification de demande de modification
await notificationService.notifyContractModificationRequested(contractId, "Raison optionnelle");

// Gestion générique des notifications
await notificationService.handleContractNotification('created', contractId);
await notificationService.handleContractNotification('accepted', contractId);
await notificationService.handleContractNotification('rejected', contractId);
```

## Gestion des erreurs

Les notifications sont conçues pour ne **jamais faire échouer** les opérations principales :

```typescript
// Si l'email échoue, l'opération continue
try {
  const contract = await contractsService.createContract(data);
  // ✅ Contrat créé même si l'email échoue
} catch (error) {
  // ❌ Erreur uniquement si la création du contrat échoue
}
```

Les erreurs d'email sont loggées mais n'interrompent pas le workflow :

```
📧 Notification de proposition de contrat envoyée à john.doe@example.com
❌ Erreur lors de l'envoi de la notification : SMTP connection failed
```

## Templates email utilisés

### contractProposed
```typescript
emailTemplates.contractProposed(
  projectTitle,        // "Développement Application Mobile"
  freelanceName,       // "John Doe"
  companyName,         // "TechCorp" (optionnel)
  contractDate,        // "15/01/2024"
  path                 // "dashboard/contracts/uuid"
)
```

### contractAccepted
```typescript
emailTemplates.contractAccepted(
  projectTitle,        // "Développement Application Mobile"
  companyName,         // "TechCorp"
  freelanceName,       // "John Doe" (optionnel)
  acceptDate,          // "16/01/2024"
  path                 // "dashboard/contracts/uuid"
)
```

### contractRejected
```typescript
emailTemplates.contractRejected(
  projectTitle,        // "Développement Application Mobile"
  companyName,         // "TechCorp"
  freelanceName,       // "John Doe" (optionnel)
  rejectDate,          // "16/01/2024"
  path                 // "dashboard/contracts/uuid"
)
```

### contractUpdated
```typescript
emailTemplates.contractUpdated(
  projectTitle,        // "Développement Application Mobile"
  freelanceName,       // "John Doe"
  companyName,         // "TechCorp" (optionnel)
  updateDate,          // "17/01/2024"
  path                 // "dashboard/contracts/uuid"
)
```

## Configuration requise

Assurez-vous que les variables d'environnement SMTP sont configurées dans `.env` :

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
FRONTEND_URL=https://yourapp.com
APP_NAME=Synkrone
```

## Données enrichies

Le service récupère automatiquement toutes les données nécessaires :

- **Contrat** : Informations complètes du contrat
- **Freelance** : Nom, prénom, email
- **Entreprise** : Nom, email
- **Projet** : Titre, description

## Workflow des notifications

```
1. Action utilisateur (création, acceptation, etc.)
   ↓
2. Opération principale (base de données)
   ↓
3. Récupération des données enrichies
   ↓
4. Génération du template email
   ↓
5. Envoi de l'email
   ↓
6. Log du résultat (succès/erreur)
```

## Bonnes pratiques

### ✅ À faire
- Les notifications sont automatiques dans le service
- Gérer les cas où les données sont manquantes
- Logger les succès et échecs
- Ne pas faire échouer l'opération si l'email échoue

### ❌ À éviter
- N'appelez pas manuellement les notifications dans les controllers
- Ne pas faire échouer les opérations principales à cause des emails
- Ne pas oublier de tester avec de vraies adresses email

## Tests

Pour tester les notifications :

```typescript
// Mock du service de notification pour les tests
jest.mock('./contracts-notification.service');

// Test avec vraies notifications (intégration)
const contractsService = new ContractsService();
const contract = await contractsService.createContract(testData);
// Vérifier que l'email est bien envoyé
```

## Monitoring

Surveillez les logs pour détecter les problèmes d'email :

```bash
# Rechercher les erreurs de notification
grep "Erreur lors de l'envoi" logs/app.log

# Rechercher les succès
grep "📧.*envoyée" logs/app.log
```

## Extension

Pour ajouter de nouvelles notifications :

1. Créez le template dans `smtp-email.ts`
2. Ajoutez la méthode dans `ContractsNotificationService`
3. Appelez la notification dans le service approprié
4. Documentez ici la nouvelle notification

## Support

Pour toute question sur les notifications de contrats, contactez l'équipe backend.