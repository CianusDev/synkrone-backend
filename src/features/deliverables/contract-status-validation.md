# 🔒 Validation du Statut de Contrat pour l'Ajout de Médias

Cette documentation explique comment le système valide le statut du contrat avant d'autoriser l'ajout de médias aux livrables.

---

## 🎯 **Règle de Sécurité**

**Les freelances ne peuvent ajouter des médias à un livrable que si le contrat associé est dans un état valide.**

### États de contrat autorisés :
- ✅ **`ACTIVE`** - Contrat en cours d'exécution
- ✅ **`PENDING`** - Contrat en attente d'activation (premier livrable créé)

### États de contrat interdits :
- ❌ **`DRAFT`** - Contrat en brouillon
- ❌ **`COMPLETED`** - Contrat terminé
- ❌ **`CANCELLED`** - Contrat annulé
- ❌ **`SUSPENDED`** - Contrat suspendu
- ❌ **`REQUEST`** - Contrat en demande

---

## 🛡️ **Points de Contrôle**

### 1. **Création de Livrable avec Médias**
```typescript
// POST /deliverables
{
  "contractId": "uuid",
  "title": "Mon livrable",
  "mediaIds": ["media-1", "media-2"] // ⚠️ Déclenche la validation
}
```

**Validation :**
- Vérifie que le contrat existe
- Vérifie que le statut est `ACTIVE` ou `PENDING`
- Bloque si le contrat est dans un autre état

### 2. **Mise à Jour de Livrable avec Médias (Freelance)**
```typescript
// PATCH /deliverables/:id
{
  "title": "Livrable modifié",
  "mediaIds": ["media-3", "media-4"] // ⚠️ Déclenche la validation
}
```

**Validation :**
- **Uniquement pour les freelances** (`userType: "freelance"`)
- Les entreprises peuvent ajouter des médias sans restriction
- Vérifie le statut du contrat lié au livrable

---

## 🔧 **Implémentation Technique**

### Dans `DeliverablesService`

#### Création de livrable :
```typescript
// Vérifier le statut du contrat avant d'ajouter des médias
if (mediaIds && mediaIds.length > 0) {
  const contract = await this.contractsRepository.getContractById(data.contractId);
  
  if (!contract) {
    throw new Error("Contrat non trouvé");
  }

  if (contract.status !== ContractStatus.ACTIVE && 
      contract.status !== ContractStatus.PENDING) {
    throw new Error(
      `Impossible d'ajouter des médias : le contrat doit être actif ou en attente. 
       Statut actuel : ${contract.status}`
    );
  }
}
```

#### Mise à jour de livrable :
```typescript
// Vérification uniquement pour les freelances
if (mediaIds && mediaIds.length > 0 && userType === "freelance") {
  const contract = await this.contractsRepository.getContractById(updated.contractId);
  
  if (contract.status !== ContractStatus.ACTIVE && 
      contract.status !== ContractStatus.PENDING) {
    throw new Error(
      `Impossible d'ajouter des médias : le contrat doit être actif ou en attente. 
       Statut actuel : ${contract.status}`
    );
  }
}
```

---

## 📋 **Cas d'Usage**

### ✅ **Cas Autorisés**

#### Contrat Actif
```bash
# Contrat status: "active"
POST /deliverables
{
  "contractId": "contract-123",
  "title": "Livrable 1",
  "mediaIds": ["media-1"]
}
# → ✅ Succès : Médias ajoutés
```

#### Contrat en Attente
```bash
# Contrat status: "pending" (premier livrable)
POST /deliverables
{
  "contractId": "contract-456", 
  "title": "Premier livrable",
  "mediaIds": ["media-2"]
}
# → ✅ Succès : Médias ajoutés + contrat activé automatiquement
```

#### Entreprise (pas de restriction)
```bash
# Company peut toujours ajouter des médias
PATCH /deliverables/123/company
{
  "mediaIds": ["media-3"]
}
# → ✅ Succès : Aucune validation de statut pour les entreprises
```

### ❌ **Cas Interdits**

#### Contrat Terminé
```bash
# Contrat status: "completed"
PATCH /deliverables/123
{
  "mediaIds": ["media-4"]
}
# → ❌ Erreur : "Impossible d'ajouter des médias : le contrat doit être 
#              actif ou en attente. Statut actuel : completed"
```

#### Contrat Annulé
```bash
# Contrat status: "cancelled"
POST /deliverables
{
  "contractId": "contract-789",
  "mediaIds": ["media-5"]
}
# → ❌ Erreur : "Impossible d'ajouter des médias : le contrat doit être 
#              actif ou en attente. Statut actuel : cancelled"
```

---

## 🎨 **Gestion d'Erreurs Frontend**

### Codes d'Erreur
- **400 Bad Request** - Validation échouée
- **Message** - Description claire de l'erreur avec statut actuel

### Exemple de Gestion
```javascript
try {
  await addMediaToDeliverable(deliverableId, mediaIds);
} catch (error) {
  if (error.message.includes("contrat doit être actif")) {
    showContractStatusError({
      title: "Contrat non actif",
      message: "Vous ne pouvez pas ajouter de médias car le contrat n'est plus actif.",
      action: "Contactez l'entreprise pour plus d'informations"
    });
  }
}
```

### Messages Utilisateur Suggérés
- **Contrat terminé** : "Mission terminée - Vous ne pouvez plus ajouter de fichiers"
- **Contrat suspendu** : "Mission suspendue - Ajout de fichiers temporairement bloqué"
- **Contrat annulé** : "Mission annulée - Aucune modification possible"

---

## 🔍 **Workflow Complet**

### Scénario : Freelance ajoute des médias

1. **Frontend** : Freelance sélectionne des fichiers
2. **API Call** : `PATCH /deliverables/:id` avec `mediaIds`
3. **Validation Auth** : Vérification que c'est bien un freelance
4. **Validation Contrat** : Vérification du statut (`active`/`pending`)
5. **Si OK** : Médias ajoutés + livrable passé à `submitted`
6. **Si KO** : Erreur 400 avec message explicite
7. **Frontend** : Affichage de l'erreur ou succès

### Logs de Debug
```
✅ Médias ajoutés au livrable abc-123 (contrat actif)
⚠️ Tentative d'ajout de médias sur contrat terminé : contract-456
❌ Erreur validation contrat pour livrable xyz-789 : status 'cancelled'
```

---

## 🚀 **Évolutions Possibles**

### Contrôles Additionnels
- **Date limite** : Bloquer après expiration du contrat
- **Permissions projet** : Vérifier si le projet est encore ouvert
- **Quota médias** : Limiter le nombre/taille des fichiers
- **Type de contrat** : Règles différentes selon le mode de paiement

### Notifications
- **Alerte freelance** : "Votre contrat arrive à expiration"
- **Email automatique** : Rappel avant fin de période d'ajout
- **Notification entreprise** : "Nouveau média ajouté au livrable"

---

## 🛠️ **Tests**

### Tests Unitaires
```typescript
describe('DeliverableService - Media Validation', () => {
  it('should allow media upload for active contract', async () => {
    // Mock contract status: active
    const result = await service.updateDeliverable(id, { 
      mediaIds: ['media-1'] 
    });
    expect(result).toBeDefined();
  });

  it('should block media upload for completed contract', async () => {
    // Mock contract status: completed
    await expect(
      service.updateDeliverable(id, { mediaIds: ['media-1'] })
    ).rejects.toThrow('contrat doit être actif');
  });

  it('should allow company to add media regardless of status', async () => {
    // Mock company user
    const result = await service.updateDeliverable(id, { 
      mediaIds: ['media-1'],
      userType: 'company'
    });
    expect(result).toBeDefined();
  });
});
```

### Tests d'Intégration
```bash
# Test avec Postman/Insomnia
# 1. Créer contrat avec status "completed"
# 2. Essayer d'ajouter média
# 3. Vérifier erreur 400
# 4. Changer status en "active"
# 5. Réessayer → succès
```

---

## 📖 **Références**

- **ContractStatus Enum** : `src/features/contracts/contracts.model.ts`
- **DeliverableService** : `src/features/deliverables/deliverables.service.ts`
- **API Routes** : `src/features/deliverables/deliverables.route.ts`
- **Validation Schemas** : `src/features/deliverables/deliverables.schema.ts`

---

## ✅ **Résumé**

- ✅ **Contrôle automatique** du statut de contrat
- ✅ **Protection freelances** contre l'ajout sur contrats inactifs
- ✅ **Liberté entreprises** d'ajouter des médias sans restriction
- ✅ **Messages d'erreur clairs** pour une meilleure UX
- ✅ **Validation à deux points** : création et mise à jour
- ✅ **Statuts autorisés** : `ACTIVE` et `PENDING` uniquement

Cette validation garantit l'intégrité des données et une expérience utilisateur cohérente sur la plateforme Synkrone.