# Exemple d'utilisation de getContractById avec livrables

Ce guide montre comment utiliser la nouvelle fonctionnalité qui retourne les livrables associés à un contrat via l'API `getContractById`.

## 📋 Vue d'ensemble

Lorsqu'un contrat est récupéré par son ID, la réponse inclut automatiquement :
- Les informations du projet associé
- Les informations du freelance associé  
- **Tous les livrables du contrat avec leurs médias**

## 🚀 Utilisation

### 1. Via l'API REST

```bash
GET /contracts/:contractId
```

**Exemple de requête :**
```bash
curl -X GET "http://localhost:3000/contracts/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer your-jwt-token"
```

### 2. Via le service TypeScript

```typescript
import { ContractsService } from '../contracts.service';

const contractsService = new ContractsService();

// Récupérer un contrat avec ses livrables
const contract = await contractsService.getContractById(
  "123e4567-e89b-12d3-a456-426614174000"
);

if (contract) {
  console.log(`Contrat: ${contract.id}`);
  console.log(`Projet: ${contract.project?.title}`);
  console.log(`Freelance: ${contract.freelance?.firstname} ${contract.freelance?.lastname}`);
  console.log(`Nombre de livrables: ${contract.deliverables?.length || 0}`);
  
  // Parcourir les livrables
  contract.deliverables?.forEach((deliverable, index) => {
    console.log(`\nLivrable ${index + 1}:`);
    console.log(`  - Titre: ${deliverable.title}`);
    console.log(`  - Statut: ${deliverable.status}`);
    console.log(`  - Milestone: ${deliverable.is_milestone ? 'Oui' : 'Non'}`);
    console.log(`  - Montant: ${deliverable.amount || 'N/A'}€`);
    console.log(`  - Médias: ${deliverable.medias?.length || 0}`);
    
    // Parcourir les médias du livrable
    deliverable.medias?.forEach((media, mediaIndex) => {
      console.log(`    Média ${mediaIndex + 1}: ${media.type} - ${media.url}`);
    });
  });
}
```

## 📊 Structure de données complète

### Réponse exemple avec livrables

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "application_id": "app-uuid",
    "project_id": "project-uuid",
    "freelance_id": "freelance-uuid",
    "company_id": "company-uuid",
    "payment_mode": "by_milestone",
    "total_amount": 8000.00,
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z",
    "project": {
      "id": "project-uuid",
      "title": "Développement Application Mobile",
      "description": "Application iOS/Android pour e-commerce",
      "status": "published"
    },
    "freelance": {
      "id": "freelance-uuid",
      "firstname": "Marie",
      "lastname": "Dubois",
      "email": "marie.dubois@example.com",
      "job_title": "Développeuse Mobile Senior",
      "experience": "expert"
    },
    "deliverables": [
      {
        "id": "deliverable-1-uuid",
        "title": "Analyse et conception",
        "description": "Analyse des besoins et conception de l'architecture",
        "status": "validated",
        "is_milestone": true,
        "amount": 1500.00,
        "due_date": "2024-02-01",
        "submitted_at": "2024-01-28T14:30:00Z",
        "validated_at": "2024-01-29T09:15:00Z",
        "feedback": "Excellente analyse, très détaillée",
        "order": 1,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-29T09:15:00Z",
        "medias": [
          {
            "id": "media-1-uuid",
            "url": "https://storage.example.com/analysis-complete.pdf",
            "type": "pdf",
            "size": 2048000,
            "uploadedAt": "2024-01-28T14:25:00Z",
            "uploadedBy": "freelance-uuid",
            "description": "Document d'analyse technique complète"
          },
          {
            "id": "media-2-uuid",
            "url": "https://storage.example.com/wireframes.zip",
            "type": "zip",
            "size": 1024000,
            "uploadedAt": "2024-01-28T14:28:00Z",
            "uploadedBy": "freelance-uuid",
            "description": "Wireframes et maquettes"
          }
        ]
      },
      {
        "id": "deliverable-2-uuid",
        "title": "Développement MVP",
        "description": "Développement des fonctionnalités de base",
        "status": "in_progress",
        "is_milestone": true,
        "amount": 4000.00,
        "due_date": "2024-02-20",
        "submitted_at": null,
        "validated_at": null,
        "feedback": null,
        "order": 2,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": null,
        "medias": []
      },
      {
        "id": "deliverable-3-uuid",
        "title": "Tests et déploiement",
        "description": "Phase de tests et déploiement en production",
        "status": "planned",
        "is_milestone": true,
        "amount": 2500.00,
        "due_date": "2024-03-10",
        "submitted_at": null,
        "validated_at": null,
        "feedback": null,
        "order": 3,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": null,
        "medias": []
      }
    ]
  },
  "message": "Contrat récupéré avec succès"
}
```

## 💡 Cas d'utilisation

### 1. Dashboard entreprise - Suivi de contrat

```typescript
async function displayContractProgress(contractId: string) {
  const contract = await contractsService.getContractById(contractId);
  
  if (!contract || !contract.deliverables) {
    throw new Error('Contrat ou livrables non trouvés');
  }
  
  const totalDeliverables = contract.deliverables.length;
  const validatedDeliverables = contract.deliverables.filter(d => 
    d.status === 'validated'
  ).length;
  const inProgressDeliverables = contract.deliverables.filter(d => 
    d.status === 'in_progress'
  ).length;
  
  const progressPercentage = (validatedDeliverables / totalDeliverables) * 100;
  const totalAmount = contract.deliverables.reduce((sum, d) => sum + (d.amount || 0), 0);
  const paidAmount = contract.deliverables
    .filter(d => d.status === 'validated')
    .reduce((sum, d) => sum + (d.amount || 0), 0);
  
  return {
    contractId: contract.id,
    projectTitle: contract.project?.title,
    freelanceName: `${contract.freelance?.firstname} ${contract.freelance?.lastname}`,
    progress: {
      percentage: Math.round(progressPercentage),
      validated: validatedDeliverables,
      inProgress: inProgressDeliverables,
      total: totalDeliverables
    },
    financial: {
      totalAmount,
      paidAmount,
      remainingAmount: totalAmount - paidAmount
    }
  };
}
```

### 2. Dashboard freelance - Mes livrables en cours

```typescript
async function getMyCurrentDeliverables(contractId: string) {
  const contract = await contractsService.getContractById(contractId);
  
  if (!contract || !contract.deliverables) {
    return [];
  }
  
  return contract.deliverables
    .filter(d => d.status === 'in_progress' || d.status === 'planned')
    .map(deliverable => ({
      id: deliverable.id,
      title: deliverable.title,
      dueDate: deliverable.due_date,
      status: deliverable.status,
      amount: deliverable.amount,
      hasMedias: (deliverable.medias?.length || 0) > 0,
      mediaCount: deliverable.medias?.length || 0,
      isOverdue: deliverable.due_date ? 
        new Date(deliverable.due_date) < new Date() : false
    }));
}
```

### 3. Calcul automatique des paiements

```typescript
async function calculateContractPayments(contractId: string) {
  const contract = await contractsService.getContractById(contractId);
  
  if (!contract || !contract.deliverables) {
    throw new Error('Contrat non trouvé');
  }
  
  const milestoneDeliverables = contract.deliverables.filter(d => d.is_milestone);
  
  const paymentSummary = {
    totalContract: contract.total_amount || 0,
    milestones: milestoneDeliverables.map(d => ({
      id: d.id,
      title: d.title,
      amount: d.amount || 0,
      status: d.status,
      dueDate: d.due_date,
      isPaid: d.status === 'validated',
      submittedAt: d.submitted_at,
      validatedAt: d.validated_at
    })),
    totalMilestoneAmount: milestoneDeliverables.reduce((sum, d) => sum + (d.amount || 0), 0),
    paidAmount: milestoneDeliverables
      .filter(d => d.status === 'validated')
      .reduce((sum, d) => sum + (d.amount || 0), 0)
  };
  
  return paymentSummary;
}
```

### 4. Validation des livrables avec médias

```typescript
async function validateDeliverablesWithMedia(contractId: string) {
  const contract = await contractsService.getContractById(contractId);
  
  if (!contract || !contract.deliverables) {
    return { valid: false, errors: ['Contrat non trouvé'] };
  }
  
  const errors: string[] = [];
  
  for (const deliverable of contract.deliverables) {
    if (deliverable.status === 'submitted' && deliverable.is_milestone) {
      // Vérifier qu'il y a des médias attachés
      if (!deliverable.medias || deliverable.medias.length === 0) {
        errors.push(`Le livrable "${deliverable.title}" doit avoir au moins un fichier attaché`);
      }
      
      // Vérifier les types de fichiers requis (exemple: au moins un PDF)
      const hasPdf = deliverable.medias?.some(media => media.type === 'pdf');
      if (!hasPdf) {
        errors.push(`Le livrable "${deliverable.title}" doit contenir au moins un document PDF`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    deliverablesSummary: {
      total: contract.deliverables.length,
      withMedia: contract.deliverables.filter(d => d.medias && d.medias.length > 0).length,
      submitted: contract.deliverables.filter(d => d.status === 'submitted').length,
      validated: contract.deliverables.filter(d => d.status === 'validated').length
    }
  };
}
```

## 🔍 Filtrage et recherche

### Filtrer les livrables par statut

```typescript
function getDeliverablesByStatus(contract: Contract, status: string) {
  return contract.deliverables?.filter(d => d.status === status) || [];
}

// Exemples d'utilisation
const validatedDeliverables = getDeliverablesByStatus(contract, 'validated');
const pendingDeliverables = getDeliverablesByStatus(contract, 'submitted');
const inProgressDeliverables = getDeliverablesByStatus(contract, 'in_progress');
```

### Rechercher des médias par type

```typescript
function getMediasByType(contract: Contract, mediaType: string) {
  const allMedias = contract.deliverables?.flatMap(d => d.medias || []) || [];
  return allMedias.filter(media => media.type === mediaType);
}

// Exemples d'utilisation
const allPdfs = getMediasByType(contract, 'pdf');
const allImages = getMediasByType(contract, 'image');
const allZipFiles = getMediasByType(contract, 'zip');
```

## 🛡️ Bonnes pratiques

### ✅ À faire
- Vérifier que le contrat existe avant d'accéder aux livrables
- Gérer les cas où les livrables peuvent être vides
- Trier les livrables par ordre si nécessaire
- Valider les permissions avant d'afficher les informations

### ❌ À éviter
- Ne pas supposer qu'il y aura toujours des livrables
- Ne pas oublier de vérifier les médias supprimés (soft delete)
- Ne pas charger trop de données si seules certaines informations sont nécessaires

## 📊 Performance

### Optimisations incluses
- Requête SQL optimisée avec LEFT JOIN
- Tri au niveau base de données (ORDER BY)
- Exclusion automatique des médias supprimés
- JSON aggregation pour éviter les requêtes multiples

### Considérations
- Plus de données transférées avec de nombreux livrables/médias
- Requête plus complexe mais plus efficace qu'appels séparés
- Mise en cache possible au niveau application si nécessaire

## 📚 Ressources connexes

- [Documentation API Contracts](../README.md)
- [Documentation API Deliverables](../../deliverables/README.md)
- [Documentation API Media](../../media/README.md)
- [Guide d'intégration projets](../../projects/README.md)

---

**Version :** 1.0  
**Dernière mise à jour :** Janvier 2024  
**Auteur :** Équipe Synkrone Backend