# 🔔 Système de Notifications pour Deliverables — Synkrone Backend

Ce module gère l'ensemble des notifications (in-app + email) pour les livrables de la plateforme Synkrone. Il fournit des notifications temps réel et par email pour tous les événements liés aux livrables et à la clôture de contrats.

---

## 🎯 **Fonctionnalités**

### Notifications automatiques pour :
- ✅ **Validation de livrable** → Notification au freelance
- ❌ **Rejet de livrable** → Notification au freelance + suppression médias
- 📋 **Soumission de livrable** → Notification à l'entreprise
- 🎉 **Clôture automatique de contrat** → Notifications aux deux parties

### Canaux de notification :
- 📱 **In-app** (temps réel via Socket.IO)
- 📧 **Email** (templates HTML + texte)

---

## 🏗️ **Architecture**

```
deliverables/notifications/
├── deliverables-notification.service.ts    # Service principal
└── README.md                               # Documentation
```

### Intégrations :
- **Notifications** (`/src/features/notifications/`)
- **User-Notifications** (`/src/features/notifications/user-notifications/`)
- **SMTP Email** (`/src/config/smtp-email.ts`)
- **Socket.IO** (temps réel)

---

## 📋 **Types d'Événements**

### 1. **Validation de Livrable**
```typescript
// Quand : Company valide un livrable
// Destinataire : Freelance
// Métadonnées enrichies :
{
  deliverable_id: "uuid",
  deliverable_title: "Nom du livrable",
  deliverable_status: "validated",
  contract_id: "uuid",
  project_title: "Nom du projet",
  company_name: "Nom entreprise",
  action: "deliverable_validated",
  priority: "high",
  icon: "check-circle",
  color: "success",
  link: "/dashboard/deliverables/uuid"
}
```

### 2. **Rejet de Livrable**
```typescript
// Quand : Company rejette un livrable
// Destinataire : Freelance
// Actions automatiques : Suppression des médias
// Métadonnées enrichies :
{
  deliverable_id: "uuid",
  deliverable_title: "Nom du livrable", 
  deliverable_status: "rejected",
  feedback: "Raison du rejet",
  media_removed: true, // Indicateur spécial
  action: "deliverable_rejected",
  priority: "high",
  icon: "x-circle",
  color: "error"
}
```

### 3. **Soumission de Livrable**
```typescript
// Quand : Freelance soumet un livrable (avec médias)
// Destinataire : Company
// Métadonnées enrichies :
{
  deliverable_id: "uuid",
  deliverable_title: "Nom du livrable",
  deliverable_status: "submitted",
  freelance_name: "Nom du freelance",
  action: "deliverable_submitted",
  priority: "medium",
  icon: "upload",
  color: "info"
}
```

### 4. **Clôture Automatique de Contrat**
```typescript
// Quand : Tous les livrables milestone sont validés
// Destinataires : Freelance + Company
// Métadonnées enrichies :
{
  contract_id: "uuid",
  project_id: "uuid", 
  project_title: "Nom du projet",
  completion_date: "2024-01-15",
  can_evaluate: true, // Flag pour évaluations
  auto_completed: true,
  action: "contract_completed_automatic",
  priority: "high",
  icon: "trophy",
  color: "success"
}
```

---

## 🔧 **Utilisation**

### Dans le Service Deliverables :

```typescript
import { DeliverablesNotificationService } from "./notifications/deliverables-notification.service";

// Lors de la validation/rejet
const notificationService = new DeliverablesNotificationService();

await notificationService.notifyDeliverableUpdate({
  deliverableId: deliverable.id,
  deliverableTitle: deliverable.title,
  deliverableStatus: DeliverableStatus.VALIDATED,
  contractId: deliverable.contractId,
  freelanceId: contract.freelanceId,
  companyId: contract.companyId,
  projectTitle: project.title,
  freelanceName: "John Doe",
  companyName: "TechCorp"
});

// Lors de la clôture automatique
await notificationService.notifyContractCompletion({
  contractId: contract.id,
  projectId: project.id,
  projectTitle: project.title,
  freelanceId: contract.freelanceId,
  companyId: contract.companyId,
  freelanceName: "John Doe",
  companyName: "TechCorp",
  completionDate: "2024-01-15"
});
```

---

## 📧 **Templates Email**

### Templates disponibles :
- `deliverableValidated()` — Livrable validé avec succès
- `deliverableRejectedWithMedia()` — Livrable rejeté + médias supprimés
- `deliverableSubmitted()` — Nouveau livrable à examiner
- `contractCompletedAutomatic()` — Contrat terminé (freelance)
- `contractCompletedAutomaticCompany()` — Contrat terminé (company)

### Exemple de template :
```typescript
const emailTemplate = emailTemplates.deliverableValidated(
  "Livrable Phase 1",     // deliverableTitle
  "John Doe",             // freelanceName  
  "TechCorp",             // companyName
  "Projet E-commerce",    // projectTitle
  "dashboard/deliverables/abc-123" // path
);

await sendEmail({
  to: "john@example.com",
  subject: emailTemplate.subject,
  html: emailTemplate.html,
  text: emailTemplate.text
});
```

---

## 🔄 **Notifications Temps Réel**

### Via Socket.IO :
```typescript
// Le service émet automatiquement :
io.to(userId).emit("notification:new", {
  id: "user-notification-id",
  user_id: "user-uuid",
  notification_id: "notification-uuid", 
  is_read: false,
  notification: {
    id: "notification-uuid",
    title: "✅ Livrable validé !",
    message: "Votre livrable 'Phase 1' a été validé",
    type: "project",
    metadata: { /* métadonnées enrichies */ }
  }
});
```

### Côté Frontend :
```javascript
socket.on("notification:new", (data) => {
  // Afficher notification toast
  showToast({
    title: data.notification.title,
    message: data.notification.message,
    type: data.notification.metadata.color,
    icon: data.notification.metadata.icon,
    link: data.notification.metadata.link
  });
  
  // Incrémenter compteur notifications
  updateNotificationBadge();
});
```

---

## 🎨 **Métadonnées Enrichies**

Chaque notification contient des métadonnées structurées pour optimiser l'UX :

### Métadonnées UI :
- `icon` : Icône à afficher (`check-circle`, `x-circle`, `upload`, `trophy`)
- `color` : Couleur de la notification (`success`, `error`, `info`, `warning`)
- `priority` : Priorité (`low`, `medium`, `high`)
- `link` : Lien direct vers l'élément concerné

### Métadonnées Business :
- `action` : Type d'action (`deliverable_validated`, `contract_completed_automatic`)
- `can_evaluate` : Flag pour activer les évaluations mutuelles
- `auto_completed` : Indique une clôture automatique
- `media_removed` : Indique que des médias ont été supprimés

### Utilisation Frontend :
```javascript
const notification = data.notification;
const metadata = notification.metadata;

// Affichage conditionnel
if (metadata.can_evaluate) {
  showEvaluationButton();
}

if (metadata.media_removed) {
  showMediaRemovedWarning();
}

// Navigation directe
if (metadata.link) {
  router.push(metadata.link);
}
```

---

## 🔒 **Sécurité & Performance**

### Isolation par utilisateur :
- Chaque notification est liée à un utilisateur spécifique
- Socket.IO utilise des rooms par `user_id`
- Pas de broadcast global

### Gestion d'erreurs :
- Les erreurs d'email n'interrompent pas le processus principal
- Logs détaillés pour le debugging
- Fallback gracieux si les services externes échouent

### Performance :
- Notifications créées en arrière-plan (non-bloquant)
- Métadonnées optimisées pour les requêtes frontend
- Cache des données utilisateur pour éviter les re-requêtes

---

## 📊 **Monitoring & Logs**

### Logs automatiques :
```
📧 Email de validation de livrable envoyé au freelance
🗑️ 3 médias supprimés pour le livrable rejeté: abc-123
✅ Contrat xyz-789 automatiquement clôturé - tous les livrables milestone validés
❌ Erreur envoi email validation livrable: [détails]
```

### Métriques à surveiller :
- Taux de délivrance des emails
- Temps de réponse des notifications temps réel
- Nombre de notifications par type/jour
- Erreurs de services externes

---

## 🔄 **Workflow Complet**

### Exemple : Validation d'un livrable

1. **Company valide** → `PATCH /deliverables/:id/validate`
2. **Service met à jour** → `status = "validated"`
3. **Notification créée** → Table `notifications` 
4. **Liaison utilisateur** → Table `user_notifications`
5. **Socket.IO émis** → `notification:new` au freelance
6. **Email envoyé** → Template `deliverableValidated`
7. **Frontend mis à jour** → Toast + badge + données

### Exemple : Clôture automatique

1. **Dernier livrable validé** → Trigger de vérification
2. **Tous milestones validés ?** → Logique métier
3. **Contrat clôturé** → `status = "completed"`
4. **2 notifications créées** → Freelance + Company
5. **2 emails envoyés** → Templates spécialisés
6. **Flag `canEvaluated`** → Activation évaluations mutuelles

---

## 🚀 **Extensions Possibles**

- **Notifications push mobile** (Firebase Cloud Messaging)
- **Webhooks** pour intégrations tierces
- **Templates email personnalisables** par entreprise
- **Notifications programmées** (rappels de deadlines)
- **Analytics avancées** des notifications
- **A/B testing** des templates email

---

## 📚 **Références**

- [Socket.IO Documentation](https://socket.io/docs/)
- [Nodemailer Guide](https://nodemailer.com/about/)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)

---

**Pour toute question ou évolution, contactez l'équipe backend Synkrone.**