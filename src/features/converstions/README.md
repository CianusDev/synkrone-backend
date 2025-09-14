# 📦 Module Conversations

Ce module gère les conversations entre freelances et entreprises sur la plateforme. Il permet la création, la récupération et la recherche de conversations, ainsi que l’accès au dernier message échangé.

---

## Structure du module

- `conversation.model.ts` : Définition des interfaces et enums.
- `conversation.schema.ts` : Schémas Zod pour la validation des requêtes.
- `conversation.repository.ts` : Accès aux données (SQL).
- `conversation.service.ts` : Logique métier.
- `conversation.controller.ts` : Handlers Express, gestion des erreurs.
- `conversation.route.ts` : Définition des routes Express.

---

## 1. Modèle

```ts
export interface Conversation {
  id: string;
  freelanceId: string;
  companyId: string;
  applicationId?: string;
  contractId?: string;
  createdAt: Date;
  updatedAt?: Date;
}
```

---

## 2. Validation (Zod)

- **createConversationSchema** : pour la création/récupération
- **findConversationSchema** : pour la recherche par freelanceId/companyId

```ts
export const createConversationSchema = z.object({
  freelanceId: z.uuid(),
  companyId: z.uuid(),
  applicationId: z.uuid().optional(),
  contractId: z.uuid().optional(),
});
export const findConversationSchema = z.object({
  freelanceId: z.uuid(),
  companyId: z.uuid(),
});
```

---

## 3. Repository

- **Méthodes principales :**
  - `createConversation(data)`
  - `getConversationById(id)`
  - `findConversation(freelanceId, companyId)`
  - `getConversationsForUser(userId)`

- **Retourne** : conversation brute ou enrichie avec détails freelance, entreprise et dernier message.

---

## 4. Service

- Orchestration de la logique métier.
- Empêche les doublons lors de la création.
- Utilise le repository pour toutes les opérations.

---

## 5. Controller

- **Validation** : Utilise Zod pour chaque endpoint.
- **Gestion centralisée des erreurs** : méthode `handleError`.
- **Endpoints principaux** :
  - `POST /conversations` : Crée ou récupère une conversation.
  - `GET /conversations/:id` : Récupère une conversation par ID.
  - `GET /conversations/user` : Récupère toutes les conversations de l'utilisateur connecté.
  - `GET /conversations/find?freelanceId=...&companyId=...` : Recherche une conversation existante.

---

## 6. Routes

Les routes sont montées sous le préfixe `/api/conversations` dans l'application principale (`app.ts`).

| Méthode | Chemin                                    | Middleware           | Description                                              |
|---------|-------------------------------------------|----------------------|----------------------------------------------------------|
| POST    | `/api/conversations/`                     | AuthAdminMiddleware  | Crée ou récupère une conversation                        |
| GET     | `/api/conversations/user`                 | AuthMiddleware       | Récupère toutes les conversations de l'utilisateur       |
| GET     | `/api/conversations/find`                 | AuthAdminMiddleware  | Trouve une conversation entre freelance et entreprise    |
| GET     | `/api/conversations/:id`                  | AuthAdminMiddleware  | (Commenté/optionnel) Récupère une conversation par ID    |

- **Sécurité** :
  - `AuthAdminMiddleware` protège la création, la recherche et la récupération par ID (admin requis).
  - `AuthMiddleware` protège la récupération des conversations pour l'utilisateur connecté (freelance ou entreprise).

---

## 7. Exemple de flux

1. **Création** :  
   - POST `/conversations`  
   - Body : `{ freelanceId, companyId, [applicationId], [contractId] }`
   - Retourne la conversation (créée ou existante).

2. **Récupération par ID** :  
   - GET `/conversations/:id`

3. **Liste pour un utilisateur** :  
   - GET `/conversations/user`  
   - Utilise l’ID de l’utilisateur connecté.

4. **Recherche par freelance/entreprise** :  
   - GET `/conversations/find?freelanceId=...&companyId=...`

---

## 7bis. Pagination

L’endpoint `GET /conversations/user` accepte les paramètres optionnels :

- `limit` (nombre d’éléments par page, défaut : 20)
- `offset` (décalage, défaut : 0)

Exemple :  
`GET /conversations/user?limit=10&offset=20`

---

## 8. Gestion des erreurs

- Toutes les erreurs (validation, métier, SQL) sont renvoyées au format :
```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": [ ... ]
}
```
ou
```json
{
  "success": false,
  "message": "Une erreur est survenue"
}
```

---

## 9. Extension

Pour ajouter des fonctionnalités (pagination, suppression, etc.), il suffit d’ajouter les méthodes dans le service/repository et de les exposer via le controller/route.

---

**Ce module est prêt pour une utilisation robuste, sécurisée et extensible dans ton backend Node.js/Express.**