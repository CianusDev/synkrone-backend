# Test de la Correction des Conversations Multiples

## Problème Initial
Quand un freelance avait déjà collaboré avec une entreprise et postulait sur un nouveau projet de la même entreprise, l'initialisation de négociation échouait avec "Impossible d'initialiser la négociation" à cause de la contrainte unique `unique_freelance_company_conversation`.

## Solution Implémentée
Modification du `ConversationService.createOrGetConversation()` pour :
1. Détecter les erreurs de contrainte unique (code PostgreSQL 23505)
2. Récupérer la conversation existante
3. Mettre à jour son `application_id` pour pointer vers la nouvelle candidature
4. Retourner la conversation mise à jour

## Tests à Effectuer

### Pré-requis
- Un freelance ayant déjà une conversation avec une entreprise
- Cette entreprise a un nouveau projet
- Le freelance postule sur ce nouveau projet

### Test 1: Initialisation de Négociation
```bash
# L'entreprise initialise une négociation sur la nouvelle candidature
POST /applications/{nouvelle_candidature_id}/initialize-negotiate
Authorization: Bearer {company_token}
```

**Résultat attendu:**
- ✅ Status 200
- ✅ Message "Négociation initialisée avec succès"
- ✅ Conversation retournée avec le bon `applicationId`
- ✅ Log: "Conversation existe déjà entre freelance X et company Y, mise à jour de l'application_id"

### Test 2: Acceptation de Candidature
```bash
# L'entreprise accepte la nouvelle candidature
PATCH /applications/{nouvelle_candidature_id}/accept
Authorization: Bearer {company_token}
```

**Résultat attendu:**
- ✅ Status 200
- ✅ Message "Candidature acceptée avec succès"
- ✅ Conversation créée/mise à jour automatiquement
- ✅ Log: "Conversation créée/récupérée pour la candidature acceptée"

### Test 3: Vérification Base de Données
```sql
-- Vérifier qu'il n'y a qu'une seule conversation par paire freelance-entreprise
SELECT 
    freelance_id,
    company_id,
    COUNT(*) as conversation_count,
    array_agg(application_id) as application_ids
FROM conversations 
GROUP BY freelance_id, company_id
HAVING COUNT(*) > 1;
-- Résultat attendu: Aucune ligne (pas de doublons)

-- Vérifier que l'application_id a été mis à jour
SELECT 
    id,
    freelance_id,
    company_id,
    application_id,
    updated_at
FROM conversations 
WHERE freelance_id = '{freelance_id}' AND company_id = '{company_id}';
-- Résultat attendu: application_id correspond à la nouvelle candidature
```

### Test 4: Fonctionnalité Messages
```bash
# Envoyer un message dans la conversation
POST /messages
Authorization: Bearer {company_token}
{
  "receiverId": "{freelance_id}",
  "content": "Message de test sur le nouveau projet",
  "conversationId": "{conversation_id}"
}
```

**Résultat attendu:**
- ✅ Message envoyé avec succès
- ✅ Freelancer reçoit le message
- ✅ Conversation liée à la nouvelle candidature

## Logs à Surveiller

### Logs de Succès
```
⚠️ Conversation existe déjà entre freelance {uuid} et company {uuid}, mise à jour de l'application_id
✅ Négociation initialisée pour la candidature: {uuid}
📞 Conversation ID: {uuid} - Freelance: {uuid} - Company: {uuid}
✅ Conversation créée/récupérée pour la candidature acceptée: {uuid}
```

### Logs d'Erreur (ne devraient plus apparaître)
```
❌ Erreur lors de l'initialisation de la négociation pour la candidature {uuid}:
❌ Erreur lors de la création de la conversation pour la candidature {uuid}:
Impossible d'initialiser la négociation
```

## Cas de Test Spécifiques

### Cas 1: Freelance avec Historique
1. Freelance A a travaillé avec Entreprise B (projet terminé)
2. Entreprise B publie un nouveau projet C
3. Freelance A postule au projet C
4. Entreprise B veut négocier → ✅ Doit fonctionner

### Cas 2: Conversation Sans Application
1. Conversation existante sans `application_id` (ancienne)
2. Nouvelle candidature créée
3. Initialisation de négociation → ✅ Doit mettre à jour `application_id`

### Cas 3: Première Collaboration
1. Freelance nouveau postule chez entreprise
2. Initialisation de négociation → ✅ Doit créer nouvelle conversation

## Validation du Fix

✅ **Pas de modification du schéma de base de données**
✅ **Gestion élégante des erreurs de contrainte**
✅ **Réutilisation des conversations existantes**
✅ **Logs informatifs pour le debugging**
✅ **Rétrocompatibilité preservée**

## Notes Techniques

- **Code erreur PostgreSQL 23505**: Violation de contrainte unique
- **Méthode ajoutée**: `updateConversationApplicationId()` dans ConversationRepository
- **Logique**: Try/catch sur la création, fallback sur mise à jour
- **Impact**: Zéro sur les conversations existantes, amélioration pour les nouvelles

## Rollback Plan

Si problème détecté :
1. Commenter le try/catch dans `createOrGetConversation()`
2. Revenir à l'ancienne logique
3. Analyser les logs pour identifier le problème
4. Appliquer un fix ciblé

---

**Auteur**: Assistant IA  
**Date**: $(date)  
**Version**: 1.0