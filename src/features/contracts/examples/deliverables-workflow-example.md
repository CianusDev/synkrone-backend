# 📋 Exemple complet : Workflow Contrats avec Livrables et Notifications

Ce guide présente un exemple concret du nouveau workflow automatisé des contrats avec création de livrables et notifications email.

---

## 🎯 **Scénario exemple**

**Projet :** Développement d'une application mobile e-commerce  
**Entreprise :** TechCorp SARL  
**Freelance :** Marie Dupont (Développeuse Mobile Senior)  
**Budget :** 8 000€ en mode `by_milestone`

---

## 🔄 **Workflow complet étape par étape**

### **Étape 1 : Création du contrat par l'entreprise**

**Action :** TechCorp crée un contrat via l'API

```bash
POST /contracts
{
  "application_id": "app-123-uuid",
  "project_id": "project-456-uuid", 
  "freelance_id": "marie-789-uuid",
  "company_id": "techcorp-012-uuid",
  "payment_mode": "by_milestone",
  "total_amount": 8000.00,
  "terms": "Développement complet d'une app mobile iOS/Android",
  "start_date": "2024-02-01",
  "end_date": "2024-04-30",
  "status": "draft"
}
```

**Résultat automatique :**
- ✅ Contrat créé avec statut `DRAFT` (aucun livrable milestone)
- 📧 **Email 1** envoyé à Marie : `contractProposed`
- 📧 **Email 2** envoyé à Marie : `contractWaitingForDeliverables`

**Email reçu par Marie :**
```
Objet: Action requise : Créer les livrables pour "Développement App Mobile E-commerce" - Synkrone

Bonjour Marie,

Votre contrat pour le projet "Développement App Mobile E-commerce" a été créé avec succès.

⏳ Action requise :
Pour activer votre contrat, vous devez créer au moins un livrable milestone.

[Créer mes livrables]
```

### **Étape 2 : Marie accepte le contrat**

**Action :** Marie accepte via l'API

```bash
PATCH /contracts/contract-uuid/accept
```

**Résultat automatique :**
- ✅ Contrat reste en statut `DRAFT` (pas de livrables milestone)
- 📧 **Email** envoyé à TechCorp : `contractAccepted`
- 📧 **Email de rappel** envoyé à Marie : `contractWaitingForDeliverables`

**Logs serveur :**
```
✅ Contrat contract-uuid accepté par le freelance
⚠️ Contrat reste en DRAFT - aucun livrable milestone trouvé
📧 Notification d'acceptation envoyée à techcorp@example.com
📧 Notification de livrables en attente envoyée à marie@example.com
```

### **Étape 3 : Marie crée ses livrables**

**Action :** Marie crée 3 livrables milestone via l'API

```bash
# Livrable 1
POST /deliverables
{
  "contractId": "contract-uuid",
  "title": "Analyse et conception",
  "description": "Analyse des besoins et conception de l'architecture",
  "status": "planned",
  "isMilestone": true,
  "amount": 2000.00,
  "dueDate": "2024-02-15",
  "order": 1
}

# Livrable 2  
POST /deliverables
{
  "contractId": "contract-uuid",
  "title": "Développement MVP",
  "description": "Développement des fonctionnalités de base",
  "status": "planned", 
  "isMilestone": true,
  "amount": 4000.00,
  "dueDate": "2024-03-20",
  "order": 2
}

# Livrable 3
POST /deliverables
{
  "contractId": "contract-uuid", 
  "title": "Tests et déploiement",
  "description": "Phase de tests et mise en production",
  "status": "planned",
  "isMilestone": true,
  "amount": 2000.00,
  "dueDate": "2024-04-25",
  "order": 3
}
```

**Résultat automatique lors du 1er livrable milestone :**
1. ✅ **Contrat passe en PENDING** : `DRAFT` → `PENDING`
2. 📧 **Email** envoyé à TechCorp : `deliverablesCreatedForContract`

**Email reçu par TechCorp :**
```
Objet: Livrables créés pour "Développement App Mobile E-commerce" - Synkrone

Bonjour TechCorp,

Excellente nouvelle ! Le freelance Marie Dupont a créé les livrables pour le projet "Développement App Mobile E-commerce".

🎉 Contrat prêt !
Le contrat est maintenant prêt à commencer.
3 livrables ont été créés.

[Voir le contrat et les livrables]
```

**Logs serveur :**
```
📋 Premier livrable milestone créé pour le contrat contract-uuid
✅ Contrat contract-uuid passe en PENDING avec le premier livrable milestone
📧 Notification de création de livrables envoyée pour le contrat contract-uuid
📋 Livrable milestone ajouté au contrat contract-uuid (2 au total)
📋 Livrable milestone ajouté au contrat contract-uuid (3 au total)
```

### **Étape 4 : Marie commence le travail**

**Marie commence réellement le travail :**
```bash
# Activer le contrat pour commencer le travail
PATCH /contracts/contract-uuid/start-work
```

**Résultat automatique :**
- ✅ Contrat passe en statut `ACTIVE` : `PENDING` → `ACTIVE`
- 🚀 Marie peut maintenant soumettre ses livrables

### **Étape 5 : Workflow normal des livrables**

**Marie travaille et soumet ses livrables :**
```bash
# Soumettre le premier livrable avec des médias
PATCH /deliverables/deliverable-1-uuid
{
  "status": "submitted", 
  "mediaIds": ["document-analysis.pdf", "wireframes.zip"]
}
```

**TechCorp valide les livrables :**
```bash  
# Valider le livrable
PATCH /deliverables/deliverable-1-uuid/validate
{
  "status": "validated",
  "feedback": "Excellente analyse, très détaillée !"
}
```

**Clôture automatique du contrat :**
Quand tous les livrables milestone sont validés :
- ✅ Contrat passe automatiquement en `COMPLETED`
- 📧 Emails de clôture envoyés aux deux parties
- 🔄 Marie redevient `available`
- 📤 Ses candidatures actives sont retirées automatiquement

---

## 📊 **Vue d'ensemble des emails envoyés**

| Étape | Action | Destinataire | Template | Déclencheur |
|-------|--------|-------------|----------|-------------|
  
| 1 | Création contrat | Marie | `contractProposed` | Toujours |
| 1 | Contrat sans livrables | Marie | `contractWaitingForDeliverables` | Si DRAFT |
| 2 | Acceptation | TechCorp | `contractAccepted` | Acceptation |
| 2 | Rappel livrables | Marie | `contractWaitingForDeliverables` | Si reste DRAFT |
| 3 | Premier livrable | TechCorp | `deliverablesCreatedForContract` | 1er milestone |
| 4 | Début travail | - | - | PENDING → ACTIVE |
| 5+ | Soumission livrable | TechCorp | `deliverableSubmitted` | Chaque soumission |
| 5+ | Validation livrable | Marie | `deliverableValidated` | Chaque validation |
| Final | Contrat terminé | Les deux | `contractCompletedAutomatic` | Tous validés |

---

## 🔧 **Code d'exemple pour tester**

### Test complet avec Node.js

```javascript
import { ContractsService } from './contracts.service';
import { DeliverablesService } from '../deliverables/deliverables.service';

async function testCompleteWorkflow() {
  const contractsService = new ContractsService();
  const deliverablesService = new DeliverablesService();
  
  try {
    // 1. Créer le contrat
    console.log('📝 Création du contrat...');
    const contract = await contractsService.createContract({
      application_id: "app-123-uuid",
      project_id: "project-456-uuid", 
      freelance_id: "marie-789-uuid",
      company_id: "techcorp-012-uuid",
      payment_mode: "by_milestone",
      total_amount: 8000.00
    });
    console.log(`✅ Contrat créé: ${contract.id} (statut: ${contract.status})`);

    // 2. Accepter le contrat  
    console.log('👤 Acceptation du contrat...');
    const acceptedContract = await contractsService.acceptContract(contract.id);
    console.log(`✅ Contrat accepté (statut: ${acceptedContract?.status})`);

    // 3. Créer les livrables milestone
    console.log('📋 Création des livrables...');
    
    const deliverable1 = await deliverablesService.createDeliverable({
      contractId: contract.id,
      title: "Analyse et conception",
      isMilestone: true,
      amount: 2000.00,
      order: 1
    });
    console.log(`✅ Livrable 1 créé: ${deliverable1.id}`);

    const deliverable2 = await deliverablesService.createDeliverable({
      contractId: contract.id,
      title: "Développement MVP", 
      isMilestone: true,
      amount: 4000.00,
      order: 2
    });
    console.log(`✅ Livrable 2 créé: ${deliverable2.id}`);

    const deliverable3 = await deliverablesService.createDeliverable({
      contractId: contract.id,
      title: "Tests et déploiement",
      isMilestone: true, 
      amount: 2000.00,
      order: 3
    });
    console.log(`✅ Livrable 3 créé: ${deliverable3.id}`);

    // 4. Commencer le travail  
    console.log('🚀 Début du travail...');
    const startedContract = await contractsService.startContractWork(contract.id);
    console.log(`✅ Travail commencé (statut: ${startedContract?.status})`);

    // 5. Vérifier le statut final
    const finalContract = await contractsService.getContractById(contract.id);
    console.log(`🎉 Contrat final (statut: ${finalContract?.status})`);
    console.log(`📋 Nombre de livrables: ${finalContract?.deliverables?.length || 0}`);

    return {
      contract: finalContract,
      deliverables: [deliverable1, deliverable2, deliverable3],
      success: true
    };

  } catch (error) {
    console.error('❌ Erreur pendant le test:', error);
    return { success: false, error: error.message };
  }
}

// Exécuter le test
testCompleteWorkflow().then(result => {
  if (result.success) {
    console.log('🎉 Workflow testé avec succès !');
    console.log('📧 Vérifiez vos emails pour voir les notifications');
  } else {
    console.error('❌ Test échoué:', result.error);
  }
});
```

### Test des notifications manuelles

```javascript
async function testNotifications() {
  const contractsService = new ContractsService();
  
  const contractId = "your-contract-uuid";
  
  // Test notification livrables en attente
  await contractsService.notifyContractWaitingForDeliverables(contractId);
  console.log('📧 Notification "livrables en attente" envoyée');
  
  // Test notification livrables créés  
  await contractsService.notifyDeliverablesCreated(contractId);
  console.log('📧 Notification "livrables créés" envoyée');
}
```

---

## 🚨 **Cas d'erreur et gestion**

**Cas 1 : Freelance ne crée jamais de livrables**

**Problème :** Contrat reste en `DRAFT` indéfiniment

**Solution automatique :**
- Emails de rappel `contractWaitingForDeliverables` 
- Contrat peut être annulé par l'entreprise ou admin

**Cas 2 : Freelance supprime tous les livrables milestone**

**Problème :** Contrat passe de PENDING vers DRAFT

**Solution automatique :**
```javascript
// Dans deliverables.service.ts - méthode deleteDeliverable
if (isLastMilestone) {
  await contractsService.updateContractStatus(contractId, 'draft');
  await contractsService.notifyContractWaitingForDeliverables(contractId);
}
```

### **Cas 3 : Erreur d'envoi d'email**

**Comportement :** L'opération continue normalement

**Logs :**
```
✅ Contrat contract-uuid activé automatiquement
❌ Erreur envoi email création livrables: SMTP connection failed
📋 Workflow contrat terminé malgré l'erreur email
```

---

## 📈 **Métriques et monitoring**

### **Logs à surveiller**

```bash
# Changements de statut
grep "✅.*passe en PENDING" logs/app.log

# Notifications envoyées
grep "📧.*livrables" logs/app.log  

# Erreurs de workflow
grep "❌.*contrat.*livrable" logs/app.log

# Statistiques générales
grep -c "Premier livrable milestone créé" logs/app.log
```

### **Métriques business**

- **Taux de progression des contrats** : % de contrats qui passent de DRAFT à PENDING à ACTIVE  
- **Temps moyen de création des livrables** : Temps entre acceptation et premier livrable
- **Taux d'activation** : % de contrats qui passent de PENDING à ACTIVE
- **Taux d'emails ouverts** : Efficacité des notifications `contractWaitingForDeliverables`

---

## ✅ **Checklist de validation**

### **Pour les développeurs**

- [ ] Contrat créé en statut DRAFT si pas de livrables
- [ ] Email `contractProposed` toujours envoyé  
- [ ] Email `contractWaitingForDeliverables` envoyé si DRAFT
- [ ] Passage en PENDING au premier livrable milestone
- [ ] Email `deliverablesCreatedForContract` à l'entreprise
- [ ] Activation manuelle PENDING → ACTIVE au début du travail
- [ ] Gestion d'erreurs sans interruption du workflow
- [ ] Logs détaillés pour debugging

### **Pour les tests**

- [ ] Tester création contrat sans livrables (DRAFT)
- [ ] Tester acceptation contrat sans livrables (reste DRAFT)
- [ ] Tester création premier livrable milestone (DRAFT → PENDING)
- [ ] Tester début du travail (PENDING → ACTIVE)
- [ ] Tester création livrables supplémentaires
- [ ] Tester suppression dernier livrable milestone (PENDING → DRAFT)
- [ ] Tester erreurs SMTP (emails)
- [ ] Vérifier réception des emails de test

---

## 🎓 **Conclusion**

Ce nouveau workflow automatise complètement la gestion des contrats avec livrables :

1. **Guides l'utilisateur** avec des emails clairs
2. **Gère les statuts** selon la progression naturelle du travail
3. **Sépare la préparation du travail réel** (PENDING vs ACTIVE)
4. **Informe toutes les parties** des changements importants
5. **Résiste aux erreurs** sans interrompre le business logic
6. **Trace tout** pour le debugging et les métriques

Le freelance suit un workflow naturel : accepter → créer livrables → commencer le travail → livrer → être payé.

---

**Auteur :** Équipe Backend Synkrone  
**Version :** 1.0  
**Date :** Janvier 2024