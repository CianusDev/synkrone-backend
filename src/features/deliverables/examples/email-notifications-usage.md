# 📧 Guide d'utilisation des notifications email pour les livrables

Ce guide explique comment les notifications email sont automatiquement déclenchées lors des actions sur les livrables dans le module Synkrone.

---

## 🎯 **Vue d'ensemble**

Le système de notifications email pour les livrables fonctionne automatiquement via le `DeliverablesNotificationService`. Chaque action importante (soumission, validation, rejet) déclenche :

1. **Notification in-app** (temps réel via Socket.IO)
2. **Email personnalisé** (template HTML + texte)

---

## 🚀 **Actions automatiquement notifiées**

### 1. **Soumission de livrable (Freelance → Company)**

**Quand :** Un freelance soumet un livrable avec des médias
**Destinataire :** Entreprise
**Template email :** `deliverableSubmitted`

```typescript
// Déclenché automatiquement lors de :
PATCH /deliverables/:id/submit
// ou
PATCH /deliverables/:id (avec mediaIds + status: "submitted")

// Email envoyé à l'entreprise
{
  subject: "Nouveau livrable soumis : 'Phase 1 - Développement' - Synkrone",
  to: "company@example.com",
  content: "Le freelance John Doe vient de soumettre un nouveau livrable..."
}
```

### 2. **Validation de livrable (Company → Freelance)**

**Quand :** Une entreprise valide un livrable
**Destinataire :** Freelance
**Template email :** `deliverableValidated`

```typescript
// Déclenché automatiquement lors de :
PATCH /deliverables/:id/validate
// ou
PATCH /deliverables/:id/company (avec status: "validated")

// Email envoyé au freelance
{
  subject: "Votre livrable 'Phase 1 - Développement' a été validé ! - Synkrone",
  to: "freelance@example.com", 
  content: "Excellente nouvelle ! Votre livrable a été validé avec succès..."
}
```

### 3. **Rejet de livrable (Company → Freelance)**

**Quand :** Une entreprise rejette un livrable
**Destinataire :** Freelance
**Template email :** `deliverableRejectedWithMedia`
**Action automatique :** Suppression des médias associés

```typescript
// Déclenché automatiquement lors de :
PATCH /deliverables/:id/reject
// ou
PATCH /deliverables/:id/company (avec status: "rejected" + feedback)

// Email envoyé au freelance
{
  subject: "Votre livrable 'Phase 1 - Développement' a été rejeté - Synkrone",
  to: "freelance@example.com",
  content: "Votre livrable a été rejeté. Feedback: Les spécifications ne correspondent pas..."
}
```

### 4. **Clôture automatique de contrat**

**Quand :** Tous les livrables milestone d'un contrat sont validés
**Destinataires :** Freelance ET Entreprise
**Templates email :** `contractCompletedAutomatic` + `contractCompletedAutomaticCompany`

```typescript
// Déclenché automatiquement lors de la validation du dernier livrable milestone

// Email au freelance
{
  subject: "Votre contrat pour 'Développement App Mobile' est terminé - Synkrone",
  to: "freelance@example.com",
  content: "Félicitations ! Votre contrat a été automatiquement marqué comme terminé..."
}

// Email à l'entreprise  
{
  subject: "Le contrat pour 'Développement App Mobile' est terminé - Synkrone",
  to: "company@example.com",
  content: "Le contrat avec John Doe a été automatiquement marqué comme terminé..."
}
```

---

## 🔧 **Configuration technique**

### Variables d'environnement requises

```env
# Configuration SMTP Gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
FRONTEND_URL=https://yourapp.com
APP_NAME=Synkrone
```

### Service et dépendances

```typescript
// Auto-importé dans DeliverablesService
import { DeliverablesNotificationService } from "./notifications/deliverables-notification.service";
import { sendEmail, emailTemplates } from "../../../config/smtp-email";

// Pas besoin d'appel manuel - tout est automatique !
```

---

## 📊 **Exemples concrets**

### Exemple 1 : Workflow complet d'un livrable

```bash
# 1. Freelance crée un livrable
POST /deliverables
{
  "contractId": "contract-123",
  "title": "Phase 1 - Interface utilisateur",
  "status": "planned"
}
# → Aucun email (statut planned)

# 2. Freelance ajoute des médias et soumet
PATCH /deliverables/deliverable-456
{
  "status": "submitted",
  "mediaIds": ["media-1", "media-2"]
}
# → 📧 Email automatique à l'entreprise (deliverableSubmitted)

# 3. Entreprise valide le livrable
PATCH /deliverables/deliverable-456/validate
{
  "status": "validated",
  "feedback": "Excellent travail !"
}
# → 📧 Email automatique au freelance (deliverableValidated)
# → Si dernier milestone → 📧 Emails de clôture aux deux parties
```

### Exemple 2 : Rejet avec suppression automatique des médias

```bash
# Entreprise rejette le livrable
PATCH /deliverables/deliverable-456/reject
{
  "status": "rejected",
  "feedback": "Les spécifications ne correspondent pas au cahier des charges"
}

# Actions automatiques :
# 1. 🗑️ Suppression des médias associés (soft delete)
# 2. 📧 Email au freelance avec template spécialisé
# 3. 🔔 Notification in-app temps réel
```

### Exemple 3 : Clôture automatique d'un contrat

```bash
# Contrat avec 3 livrables milestone :
# - Livrable 1 : ✅ validated
# - Livrable 2 : ✅ validated  
# - Livrable 3 : ⏳ submitted

# Quand l'entreprise valide le livrable 3 :
PATCH /deliverables/deliverable-789/validate
{
  "status": "validated"
}

# Actions automatiques :
# 1. ✅ Livrable 3 validé
# 2. 🔍 Vérification : tous les milestones validés ?
# 3. 🎉 Contrat automatiquement clôturé (status: "completed")
# 4. 📧 2 emails de clôture envoyés (freelance + entreprise)
# 5. 🏆 Flag "canEvaluated: true" activé pour les évaluations
```

---

## 🎨 **Templates email disponibles**

### 1. `deliverableSubmitted`
```typescript
emailTemplates.deliverableSubmitted(
  "Phase 1 - Interface",     // deliverableTitle
  "John Doe",                // freelanceName
  "TechCorp",               // companyName (optionnel)
  "App Mobile",             // projectTitle (optionnel)
  "dashboard/deliverables/123" // path
)
```

### 2. `deliverableValidated`
```typescript
emailTemplates.deliverableValidated(
  "Phase 1 - Interface",     // deliverableTitle
  "John Doe",                // freelanceName
  "TechCorp",               // companyName (optionnel)
  "App Mobile",             // projectTitle (optionnel)
  "dashboard/deliverables/123" // path
)
```

### 3. `deliverableRejectedWithMedia`
```typescript
emailTemplates.deliverableRejectedWithMedia(
  "Phase 1 - Interface",     // deliverableTitle
  "John Doe",                // freelanceName
  "Les specs ne correspondent pas", // feedback
  "App Mobile",             // projectTitle (optionnel)
  "dashboard/deliverables/123" // path
)
```

### 4. `contractCompletedAutomatic` / `contractCompletedAutomaticCompany`
```typescript
emailTemplates.contractCompletedAutomatic(
  "App Mobile",              // projectTitle
  "John Doe",                // freelanceName
  "TechCorp",               // companyName (optionnel)
  "2024-01-15",             // completionDate
  "dashboard/contracts/456" // path
)
```

---

## 🔔 **Notifications in-app (bonus)**

En plus des emails, chaque action déclenche une notification temps réel :

```typescript
// Notification au freelance (validation)
{
  title: "✅ Livrable validé !",
  message: "Votre livrable 'Phase 1 - Interface' a été validé avec succès.",
  type: "project",
  metadata: {
    deliverable_id: "123",
    action: "deliverable_validated",
    priority: "high",
    icon: "check-circle",
    color: "success",
    link: "/dashboard/deliverables/123"
  }
}

// Notification à l'entreprise (soumission)
{
  title: "📋 Nouveau livrable soumis",
  message: "Le freelance John Doe a soumis le livrable 'Phase 1 - Interface'.",
  type: "project", 
  metadata: {
    deliverable_id: "123",
    action: "deliverable_submitted",
    priority: "medium",
    icon: "upload",
    color: "info",
    link: "/dashboard/deliverables/123"
  }
}
```

---

## 🛡️ **Gestion d'erreurs**

### Les emails ne font jamais échouer les opérations

```typescript
// Si l'envoi d'email échoue :
try {
  await sendEmail({ ... });
  console.log("📧 Email envoyé avec succès");
} catch (emailError) {
  console.error("❌ Erreur envoi email:", emailError);
  // L'opération continue normalement
}

// Le livrable est quand même validé/rejeté/soumis !
```

### Logs automatiques

```
📧 Email de validation de livrable envoyé au freelance
📧 Email de soumission de livrable envoyé à l'entreprise
🗑️ 3 médias supprimés pour le livrable rejeté: abc-123
✅ Contrat xyz-789 automatiquement clôturé - tous les livrables milestone validés
⚠️ Email du freelance non disponible pour l'envoi
❌ Erreur envoi email validation livrable: SMTP connection failed
```

---

## 🔧 **Dépannage**

### Email non reçu ?

1. **Vérifier les variables d'environnement**
   ```bash
   echo $GMAIL_USER
   echo $GMAIL_APP_PASSWORD
   ```

2. **Vérifier les logs**
   ```bash
   grep "📧" logs/app.log
   grep "❌.*email" logs/app.log
   ```

3. **Tester la connexion SMTP**
   ```typescript
   import { verifySmtpConnection } from "../../../config/smtp-email";
   await verifySmtpConnection(); // true/false
   ```

### Notification in-app non reçue ?

1. **Vérifier Socket.IO**
   ```javascript
   socket.on("connect", () => console.log("✅ Connecté"));
   socket.on("notification:new", (data) => console.log("🔔", data));
   ```

2. **Vérifier l'authentification**
   ```typescript
   // L'utilisateur doit être authentifié pour recevoir ses notifications
   ```

---

## 📈 **Monitoring recommandé**

### Métriques à surveiller

- **Taux de délivrance des emails** (succès/échec)
- **Temps de réponse des notifications** (< 1 seconde)
- **Erreurs SMTP** (authentification, quotas)
- **Notifications par type/jour** (volume)

### Alertes suggérées

- Taux d'échec email > 5%
- Connexion SMTP en échec
- Queue de notifications trop longue
- Utilisateurs sans email configuré

---

## 🚀 **Roadmap future**

### Extensions possibles

- **Notifications push mobile** (Firebase)
- **Webhooks** pour systèmes tiers
- **Templates personnalisables** par entreprise
- **Programmation d'emails** (rappels deadlines)
- **Analytics des ouvertures** email
- **Préférences utilisateur** (fréquence, types)

---

## 📚 **Ressources utiles**

- [Configuration SMTP Gmail](../../../config/smtp-email.ts)
- [Templates email complets](../../../config/smtp-email.ts#L95)
- [Service de notifications](../../notifications/notification.service.ts)
- [Documentation Socket.IO](https://socket.io/docs/)

---

**✨ Les notifications email sont maintenant entièrement automatiques pour tous les livrables ! Aucune action manuelle requise.**