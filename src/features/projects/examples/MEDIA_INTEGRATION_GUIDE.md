# Guide d'intégration des médias dans les projets

Ce guide explique comment utiliser la nouvelle fonctionnalité qui permet de récupérer les médias associés aux livrables d'un projet via l'API `getProjectById`.

## 📋 Vue d'ensemble

Lorsqu'un freelance travaille sur un projet et crée des livrables, il peut associer des médias (documents, images, fichiers) à chaque livrable. Cette fonctionnalité permet de récupérer ces médias directement lors de la consultation d'un projet.

## 🔧 Fonctionnalités

### Récupération automatique des médias
- Les médias associés aux livrables sont automatiquement inclus dans la réponse
- Chaque livrable contient un tableau `medias` avec tous les fichiers associés
- Les médias supprimés (soft delete) ne sont pas inclus

### Types de médias supportés
- **PDF** : Documents, rapports, analyses
- **Image** : Captures d'écran, schémas, maquettes
- **Doc** : Documents Word, présentations
- **Zip** : Archives de code, collections de fichiers
- **Other** : Autres types de fichiers

## 🚀 Utilisation

### 1. Via l'API REST

```bash
GET /projects/:projectId?freelanceId=:freelanceId
```

**Paramètres :**
- `projectId` (required) : ID du projet à récupérer
- `freelanceId` (optional) : ID du freelance pour récupérer son contrat et ses livrables

**Exemple de requête :**
```bash
curl -X GET "http://localhost:3000/projects/123e4567-e89b-12d3-a456-426614174000?freelanceId=987fcdeb-51a2-4567-b890-123456789abc" \
  -H "Authorization: Bearer your-jwt-token"
```

### 2. Via le service TypeScript

```typescript
import { ProjectsService } from '../projects.service';

const projectsService = new ProjectsService();

// Récupérer un projet avec les médias des livrables
const project = await projectsService.getProjectById(
  "123e4567-e89b-12d3-a456-426614174000", // projectId
  "987fcdeb-51a2-4567-b890-123456789abc"  // freelanceId
);

// Accéder aux médias des livrables
if (project.deliverables) {
  project.deliverables.forEach(deliverable => {
    console.log(`Livrable: ${deliverable.title}`);
    console.log(`Médias: ${deliverable.medias?.length || 0}`);
    
    deliverable.medias?.forEach(media => {
      console.log(`- ${media.type}: ${media.url}`);
    });
  });
}
```

## 📊 Structure des données

### Projet avec médias des livrables

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Développement d'une API REST",
  "status": "published",
  "company": {
    "id": "company-uuid",
    "company_name": "TechCorp",
    "logo_url": "https://example.com/logo.png"
  },
  "contract": {
    "id": "contract-uuid",
    "status": "active",
    "payment_mode": "daily_rate",
    "tjm": 500
  },
  "deliverables": [
    {
      "id": "deliverable-uuid",
      "title": "Analyse des besoins",
      "status": "validated",
      "isMilestone": true,
      "amount": 1000,
      "medias": [
        {
          "id": "media-uuid",
          "url": "https://storage.example.com/analysis.pdf",
          "type": "pdf",
          "size": 1024000,
          "uploadedAt": "2024-01-18T10:30:00Z",
          "uploadedBy": "freelance-uuid",
          "description": "Document d'analyse complet"
        }
      ]
    }
  ]
}
```

### Structure d'un média

```typescript
interface Media {
  id: string;                    // UUID du média
  url: string;                   // URL de téléchargement
  type: MediaType;               // Type de fichier
  size: number;                  // Taille en octets
  uploadedAt: Date;              // Date d'upload
  uploadedBy?: string;           // UUID de l'uploader
  description?: string;          // Description optionnelle
}
```

## 💡 Cas d'utilisation

### 1. Dashboard freelance
Afficher tous les médias liés aux livrables d'une mission :

```typescript
async function getFreelanceMissionMedia(projectId: string, freelanceId: string) {
  const project = await projectsService.getProjectById(projectId, freelanceId);
  
  const allMedia = project.deliverables?.flatMap(d => d.medias || []) || [];
  
  return {
    totalMedia: allMedia.length,
    mediaByType: {
      pdf: allMedia.filter(m => m.type === 'pdf').length,
      image: allMedia.filter(m => m.type === 'image').length,
      doc: allMedia.filter(m => m.type === 'doc').length,
    },
    totalSize: allMedia.reduce((sum, m) => sum + m.size, 0)
  };
}
```

### 2. Validation des livrables
Vérifier qu'un livrable contient les documents requis :

```typescript
function validateDeliverableMedia(deliverable: Deliverable) {
  const requiredTypes = ['pdf', 'image']; // Types requis
  const mediaTypes = deliverable.medias?.map(m => m.type) || [];
  
  return requiredTypes.every(type => mediaTypes.includes(type));
}
```

### 3. Calcul de l'espace de stockage
Calculer l'espace utilisé par projet :

```typescript
function calculateProjectStorageUsage(project: Project) {
  const totalBytes = project.deliverables?.reduce((sum, deliverable) => {
    return sum + (deliverable.medias?.reduce((mediaSum, media) => {
      return mediaSum + media.size;
    }, 0) || 0);
  }, 0) || 0;
  
  return {
    bytes: totalBytes,
    kb: Math.round(totalBytes / 1024),
    mb: Math.round(totalBytes / (1024 * 1024))
  };
}
```

## 🔍 Bonnes pratiques

### 1. Gestion des erreurs
```typescript
try {
  const project = await projectsService.getProjectById(projectId, freelanceId);
  
  if (!project) {
    throw new Error('Projet non trouvé');
  }
  
  // Vérifier que les médias sont chargés
  if (project.deliverables) {
    project.deliverables.forEach(deliverable => {
      if (!Array.isArray(deliverable.medias)) {
        console.warn(`Médias non chargés pour le livrable ${deliverable.id}`);
      }
    });
  }
  
} catch (error) {
  console.error('Erreur lors de la récupération:', error);
}
```

### 2. Optimisation des performances
```typescript
// Ne récupérer les médias que si nécessaire
const includeMedia = req.query.includeMedia === 'true';
const freelanceId = includeMedia ? req.query.freelanceId : undefined;

const project = await projectsService.getProjectById(projectId, freelanceId);
```

### 3. Validation des types
```typescript
import { MediaType } from '../media/media.model';

function isValidMediaType(type: string): type is MediaType {
  return Object.values(MediaType).includes(type as MediaType);
}
```

## 🚨 Limitations et considérations

### Limitations actuelles
- Les médias sont récupérés uniquement si un `freelanceId` est fourni
- Seuls les médias non supprimés (deleted_at IS NULL) sont retournés
- La taille des réponses peut être importante avec de nombreux médias

### Considérations de performance
- Les médias sont chargés via des JOINs SQL optimisés
- Utiliser la pagination pour les projets avec de nombreux livrables
- Considérer la mise en cache pour les projets fréquemment consultés

### Sécurité
- Vérifier les autorisations avant d'exposer les URLs des médias
- Les URLs peuvent contenir des tokens d'accès temporaires
- Respecter les politiques de confidentialité pour les documents

## 📝 Tests

### Test unitaire
```typescript
describe('Project media integration', () => {
  it('should return media for deliverables', async () => {
    const project = await projectsService.getProjectById(projectId, freelanceId);
    
    expect(project.deliverables).toBeDefined();
    expect(project.deliverables[0].medias).toBeInstanceOf(Array);
  });
  
  it('should handle empty media arrays', async () => {
    const project = await projectsService.getProjectById(projectId, freelanceId);
    
    project.deliverables?.forEach(deliverable => {
      expect(Array.isArray(deliverable.medias)).toBe(true);
    });
  });
});
```

### Test d'intégration
```typescript
// Voir le fichier test-media-integration.ts pour des exemples complets
import { testMediaIntegration } from './test-media-integration';

testMediaIntegration().then(result => {
  console.log('Test result:', result);
});
```

## 📚 Ressources supplémentaires

- [Documentation de l'API Projects](../README.md)
- [Documentation de l'API Media](../../media/README.md)
- [Guide des livrables](../../deliverables/README.md)
- [Exemples d'utilisation](./project-with-media-example.ts)

---

**Version :** 1.0  
**Dernière mise à jour :** Janvier 2024  
**Auteur :** Équipe Synkrone Backend