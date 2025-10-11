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

### 6. Demande de modification de contrat
```typescript
// Quand un freelance demande une modification d'un contrat actif
await contractsService.requestContractModification(contractId, "Raison de la demande");
// ✅ Email automatique envoyé à l'entreprise avec le template 'contractModificationRequested'
```

**Template utilisé** : `contractModificationRequested`  
**Destinataire** : Entreprise  
**Contenu** : Notification qu'un freelance demande une modification du contrat
**Intégration chat** : La raison est automatiquement envoyée dans le chat de l'entreprise via un message système

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
await notificationService.handleContractNotification('modification_requested', contractId);
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

### contractModificationRequested
```typescript
emailTemplates.contractModificationRequested(
  projectTitle,        // "Développement Application Mobile"
  companyName,         // "TechCorp"
  freelanceName,       // "John Doe"
  requestDate,         // "18/01/2024"
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

## 📬 Intégration avec le système de Messages

### Demande de modification de contrat

Depuis la dernière mise à jour, la demande de modification de contrat utilise une approche hybride :

#### 1. Notification Email (comme avant)
```typescript
// Email classique à l'entreprise
await notificationService.notifyContractModificationRequested(contractId, reason);
```

#### 2. Message automatique dans le chat (NOUVEAU)
```typescript
// Message système automatique dans la conversation
const messageContent = `🔄 **Demande de modification du contrat**

Raison : ${reason}

Le contrat a été remis en attente pour permettre les modifications nécessaires.`;

await messageService.createSystemMessage(
  freelanceId,     // Sender
  companyId,       // Receiver  
  messageContent,
  conversationId,
  projectId
);
```

### Workflow complet

1. **Freelance fait la demande** via `PATCH /contracts/:id/request-modification`
2. **Statut change** : `active` → `pending`
3. **Email envoyé** à l'entreprise (notification classique)
4. **Message système créé** dans la conversation du projet
5. **Entreprise notifiée** par email ET dans le chat temps réel

### Format du message automatique

```
🔄 **Demande de modification du contrat**

Raison : Je souhaiterais modifier les dates du projet car j'ai besoin de plus de temps pour la phase de tests.

Le contrat a été remis en attente pour permettre les modifications nécessaires.
```

### Avantages de cette approche

- ✅ **Double notification** : Email + Chat temps réel
- ✅ **Traçabilité** : La demande reste dans l'historique du chat
- ✅ **Context** : Directement lié au projet/contrat
- ✅ **Communication directe** : Pas besoin de quitter la plateforme

### Services utilisés

```typescript
import { MessageService } from "../messages/message.service";
import { ConversationService } from "../conversations/conversation.service";

// Dans le ContractsService
private readonly messageService: MessageService;
private readonly conversationService: ConversationService;

// Création/récupération de la conversation
const conversation = await this.conversationService.getOrCreateConversation(
  freelanceId,
  companyId,
  applicationId,
  contractId
);

// Envoi du message système
await this.messageService.createSystemMessage(
  freelanceId,
  companyId,
  messageContent,
  conversation.id,
  projectId
);
```

### Gestion des erreurs

- Si l'email échoue : Le système continue (message chat envoyé)
- Si le message chat échoue : Le système continue (email envoyé)
- Les deux sont indépendants pour maximiser la fiabilité

### Configuration requise

Assurez-vous que les services de messages sont correctement configurés :

```env
# Variables pour le chat temps réel
SOCKET_IO_CORS_ORIGIN=https://yourapp.com
FRONTEND_URL=https://yourapp.com
```

## Support

Pour toute question sur les notifications de contrats, contactez l'équipe backend.