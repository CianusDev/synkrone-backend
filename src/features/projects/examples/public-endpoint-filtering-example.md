# Guide de filtrage pour l'endpoint public GET /projects

Ce guide explique la logique de filtrage appliquée à l'endpoint public `GET /projects` pour déterminer quels projets sont visibles aux freelances.

## 🎯 Objectif

L'endpoint public doit afficher uniquement les projets qui sont :
1. **Publiés** (`status = 'published'`)
2. **Disponibles pour candidature** (selon la logique `allowMultipleApplications`)

## 🔍 Logique de filtrage

### Règle 1 : Statut publié (obligatoire)
```sql
WHERE p.status = 'published'
```
Seuls les projets avec le statut "published" sont visibles.

### Règle 2 : Logique allowMultipleApplications
```sql
AND (
  p.allow_multiple_applications = true
  OR NOT EXISTS (
    SELECT 1 FROM applications a
    WHERE a.project_id = p.id
    AND a.status = 'accepted'
  )
)
```

Cette règle signifie :
- **OU** le projet accepte les candidatures multiples (`allow_multiple_applications = true`)
- **OU** le projet n'a aucune candidature acceptée

## 📊 Cas d'usage détaillés

### ✅ Cas 1 : Projet avec candidatures multiples autorisées
```json
{
  "id": "project-1",
  "title": "Développement API REST",
  "status": "published",
  "allowMultipleApplications": true
}
```
**Résultat** : ✅ **Visible** - Même avec des candidatures acceptées, le projet reste ouvert

### ✅ Cas 2 : Projet sans candidatures multiples, aucune candidature acceptée
```json
{
  "id": "project-2", 
  "title": "Site vitrine WordPress",
  "status": "published",
  "allowMultipleApplications": false
}
```
**Applications** : Candidatures soumises mais aucune acceptée
**Résultat** : ✅ **Visible** - Encore disponible pour candidature

### ❌ Cas 3 : Projet sans candidatures multiples, candidature déjà acceptée
```json
{
  "id": "project-3",
  "title": "Application mobile iOS", 
  "status": "published",
  "allowMultipleApplications": false
}
```
**Applications** : Au moins une candidature acceptée
**Résultat** : ❌ **Masqué** - Plus de nouvelles candidatures possibles

### ❌ Cas 4 : Projet non publié
```json
{
  "id": "project-4",
  "title": "Projet en brouillon",
  "status": "draft",
  "allowMultipleApplications": true
}
```
**Résultat** : ❌ **Masqué** - Statut non publié

## 🔄 Workflow complet

```
1. Entreprise crée un projet (status: "draft")
   └─ ❌ Invisible au public

2. Entreprise publie le projet (status: "published")
   └─ ✅ Visible au public
   
3. Freelances postulent au projet
   └─ ✅ Toujours visible (candidatures en cours)
   
4a. Si allowMultipleApplications = true :
    └─ Candidature acceptée → ✅ Reste visible
    
4b. Si allowMultipleApplications = false :
    └─ Candidature acceptée → ❌ Devient invisible
```

## 🧪 Exemples de requêtes SQL

### Requête complète générée
```sql
SELECT p.*, c.company_name
FROM projects p
INNER JOIN companies c ON p.company_id = c.id
WHERE p.status = 'published'
AND (
  p.allow_multiple_applications = true
  OR NOT EXISTS (
    SELECT 1 FROM applications a
    WHERE a.project_id = p.id
    AND a.status = 'accepted'
  )
)
ORDER BY p.created_at DESC
LIMIT 10 OFFSET 0;
```

### Test de la logique avec des données
```sql
-- Projet visible : candidatures multiples autorisées
INSERT INTO projects (title, status, allow_multiple_applications) 
VALUES ('API REST', 'published', true);

-- Projet visible : pas de candidature acceptée
INSERT INTO projects (title, status, allow_multiple_applications) 
VALUES ('Site vitrine', 'published', false);

-- Projet invisible : candidature acceptée + pas de multiples
INSERT INTO projects (title, status, allow_multiple_applications) 
VALUES ('App mobile', 'published', false);
INSERT INTO applications (project_id, freelance_id, status) 
VALUES (last_project_id, 'freelance-uuid', 'accepted');
```

## 🔧 Code d'implémentation

### Dans le Repository
```typescript
// Condition ajoutée uniquement pour l'endpoint public
if (params?.isPublicEndpoint) {
  conditions.push(`(
    p.allow_multiple_applications = true
    OR NOT EXISTS (
      SELECT 1 FROM applications a
      WHERE a.project_id = p.id
      AND a.status = 'accepted'
    )
  )`);
}
```

### Dans le Controller
```typescript
// GET /projects - Endpoint public
const result = await this.service.listProjects({
  status: ProjectStatus.PUBLISHED,     // Forcé à published
  isPublicEndpoint: true,              // Active le filtrage spécial
  // ... autres paramètres
});
```

### Dans le Service
```typescript
const result = await this.repository.listProjects({
  ...params,
  isPublicEndpoint: params?.isPublicEndpoint, // Transmet le flag
});
```

## ⚡ Optimisations de performance

### Index recommandés
```sql
-- Index composé pour la requête principale
CREATE INDEX idx_projects_public_visibility 
ON projects (status, allow_multiple_applications, created_at);

-- Index pour la sous-requête d'applications
CREATE INDEX idx_applications_project_status 
ON applications (project_id, status);
```

### Explication de performance
- **INNER JOIN** avec companies : récupère les infos entreprise en une requête
- **EXISTS** optimisé : plus rapide que COUNT(*) pour vérifier l'existence
- **Index composé** : couvre les conditions principales
- **Pagination** : limite le nombre de résultats traités

## 🧪 Tests de validation

### Test 1 : Projet avec candidatures multiples
```typescript
describe('Public endpoint filtering', () => {
  it('should show project with allowMultipleApplications=true even with accepted applications', async () => {
    // Créer projet avec candidatures multiples
    const project = await createProject({ allowMultipleApplications: true });
    await createAcceptedApplication(project.id);
    
    const result = await projectsService.listProjects({ isPublicEndpoint: true });
    
    expect(result.data).toContain(project);
  });
});
```

### Test 2 : Projet sans candidatures multiples
```typescript
it('should hide project with allowMultipleApplications=false after accepted application', async () => {
  // Créer projet sans candidatures multiples
  const project = await createProject({ allowMultipleApplications: false });
  await createAcceptedApplication(project.id);
  
  const result = await projectsService.listProjects({ isPublicEndpoint: true });
  
  expect(result.data).not.toContain(project);
});
```

### Test 3 : Projet sans candidature acceptée
```typescript
it('should show project with allowMultipleApplications=false without accepted applications', async () => {
  const project = await createProject({ allowMultipleApplications: false });
  await createSubmittedApplication(project.id); // Soumise mais pas acceptée
  
  const result = await projectsService.listProjects({ isPublicEndpoint: true });
  
  expect(result.data).toContain(project);
});
```

## 📈 Métriques de suivi

### Métriques utiles à tracker
- **Taux de visibilité** : % de projets publiés qui restent visibles
- **Impact candidatures multiples** : Différence de visibilité selon `allowMultipleApplications`
- **Durée de visibilité** : Temps moyen entre publication et masquage
- **Performance requête** : Temps d'exécution de la requête avec filtrage

### Requête de métrique exemple
```sql
-- Statistiques de visibilité des projets publiés
SELECT 
  COUNT(*) as total_published,
  COUNT(*) FILTER (WHERE allow_multiple_applications = true) as always_visible,
  COUNT(*) FILTER (WHERE 
    allow_multiple_applications = false 
    AND NOT EXISTS (
      SELECT 1 FROM applications a 
      WHERE a.project_id = projects.id AND a.status = 'accepted'
    )
  ) as visible_no_accepted,
  COUNT(*) FILTER (WHERE 
    allow_multiple_applications = false 
    AND EXISTS (
      SELECT 1 FROM applications a 
      WHERE a.project_id = projects.id AND a.status = 'accepted'
    )
  ) as hidden_accepted
FROM projects 
WHERE status = 'published';
```

## 🚨 Points d'attention

### Cas limites à gérer
1. **Candidature acceptée puis rejetée** : Le projet redevient-il visible ?
2. **Contrat annulé** : Faut-il rendre le projet visible à nouveau ?
3. **Candidatures expirées** : Impact sur la visibilité ?

### Évolutions possibles
- **Filtrage par géolocalisation** : Projets locaux en priorité
- **Filtrage par compétences** : Projets correspondant au profil
- **Filtrage temporel** : Projets récents en priorité
- **Cache intelligent** : Mise en cache des résultats fréquents

---

**Version** : 1.0  
**Dernière mise à jour** : Janvier 2024  
**Auteur** : Équipe Backend Synkrone