# Documentation Technique — Feature Messages

Ce document décrit la structure, les endpoints, les modèles et le fonctionnement de la feature **messages** du backend Synkrone.

## 🔐 Sécurité

Les messages sont stockés en texte clair dans la base de données. La sécurité est assurée par :

- **Authentification** : Tous les endpoints sont protégés par le middleware d'authentification
- **Autorisation** : Seuls les participants d'une conversation peuvent accéder aux messages
- **Validation** : Validation stricte des données d'entrée avec Zod
- **Logs sécurisés** : Logging approprié sans exposer de données sensibles

---

## 1. Modèles

### Message

```ts
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  sentAt: Date;
  projectId?: string;
  conversationId?: string;
  createdAt: Date;
  updatedAt?: Date;
}
```

### UserInfo

```ts
export interface UserInfo {
  id: string;
  firstname?: string;
  lastname?: string;
  companyName?: string;
  photoUrl?: string;
  logoUrl?: string;
  role: "freelance" | "company";
}
```

### MessageMediaInfo

Chaque média associé à un message inclut les infos du média + la date d'association :

```ts
export interface MessageMediaInfo extends Media {
  createdAt: Date; // Date d'association au message
  deletedAt?: Date;
}
```

### Reply (réponse à un autre message)

Le modèle Message inclut désormais le champ optionnel `replyToMessageId` :

```ts
export interface Message {
  // ... autres champs ...
  replyToMessageId?: string; // ID du message auquel on répond
}
```

### MessageWithUserInfo

Chaque message retourné par l’API inclut les infos du sender, du receiver, des médias associés, et désormais le contenu du message parent si c'est une réponse ("reply") :

```ts
export interface MessageWithUserInfo extends Message {
  sender: UserInfo;
  receiver: UserInfo;
  media?: MessageMediaInfo[];
  replyToMessage?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
  };
}
```

---

## 2. Endpoints REST

### Authentification

Toutes les routes sont protégées par le middleware `AuthMiddleware` (freelance ou company).

### Créer un message

- **POST /**  
  Crée un nouveau message dans une conversation.

  **Body :**
  ```json
  {
    "senderId": "uuid",
    "receiverId": "uuid",
    "content": "string",
    "conversationId": "uuid",
    "projectId": "uuid", // optionnel
    "replyToMessageId": "uuid" // optionnel, pour répondre à un autre message
  }
  ```

  **Réponse :**
  ```json
  {
    "id": "...",
    "senderId": "...",
    "receiverId": "...",
    "content": "...",
    "isRead": false,
    "sentAt": "...",
    "conversationId": "...",
    "replyToMessageId": "...", // présent si c'est une réponse à un autre message
    "replyToMessage": {        // présent si c'est une réponse, contient le message parent
      "id": "...",
      "content": "Message original",
      "senderId": "...",
      "createdAt": "2024-06-01T12:00:00Z"
    },
    "createdAt": "...",
    "updatedAt": "...",
    "sender": { ... },
    "receiver": { ... },
    "media": [
      {
        "id": "media-uuid",
        "url": "https://...",
        "type": "image",
        "description": "Logo",
        "uploadedAt": "2024-06-01T12:00:00Z",
        "createdAt": "2024-06-01T12:01:00Z"
      }
    ]
  }
  ```

---

### Modifier un message

- **PATCH /:messageId**  
  Modifie le contenu d'un message existant (seul l'expéditeur peut modifier).

  **Body :**
  ```json
  {
    "content": "Nouveau contenu"
  }
  ```

  **Réponse :**
  ```json
  { "success": true }
  ```

  **Sécurité :**
  - Seul l'expéditeur du message (authentifié) peut modifier le contenu.

---

### Supprimer un message

- **DELETE /:messageId**  
  Supprime logiquement un message (soft delete, seul l'expéditeur peut supprimer).

  **Réponse :**
  ```json
  { "success": true }
  ```

  **Sécurité :**
  - Seul l'expéditeur du message (authentifié) peut supprimer le message.

---

### Récupérer les messages d'une conversation (pagination, ordre chronologique)

- **GET /:conversationId?limit=20&offset=0**

  **Params :**
  - `conversationId` : uuid de la conversation

  **Query :**
  - `limit` : nombre de messages à récupérer (défaut 20)
  - `offset` : décalage pour la pagination (défaut 0)

  **Ordre :**
  - Les messages sont retournés **du plus ancien au plus récent** (ordre naturel d'un chat).

  **Réponse :**
  ```json
  [
    {
      "id": "...",
      "senderId": "...",
      "receiverId": "...",
      "content": "...",
      "isRead": false,
      "sentAt": "...",
      "conversationId": "...",
      "createdAt": "...",
      "updatedAt": "...",
      "sender": { ... },
      "receiver": { ... },
      "media": [
        {
          "id": "media-uuid",
          "url": "https://...",
          "type": "image",
          "description": "Logo",
          "uploadedAt": "2024-06-01T12:00:00Z",
          "createdAt": "2024-06-01T12:01:00Z"
        }
      ]
    },
    ...
  ]
  ```

---

### Marquer un message comme lu

- **POST /read**

  **Body :**
  ```json
  {
    "messageId": "uuid",
    "userId": "uuid"
  }
  ```

  **Réponse :**
  ```json
  { "success": true }
  ```

---

## 3. Fonctionnement Realtime (Socket)

- Lorsqu’un message est créé, il est émis en temps réel au destinataire (`MessageEvent.Receive`) et à l’expéditeur (`MessageEvent.Send`).
- Lorsqu’un message est marqué comme lu, une notification realtime (`MessageEvent.Read`) est envoyée à l’expéditeur.
- Lorsqu’un message est modifié, un événement `update_message` est émis à l’expéditeur et au destinataire.
- Lorsqu’un message est supprimé, un événement `delete_message` est émis à l’expéditeur et au destinataire.
- Lorsqu’un message est une réponse (`replyToMessageId`), le frontend peut afficher le message parent grâce au champ `replyToMessage` enrichi dans la réponse API.

---

## 4. Validation

- Les schémas Zod valident la création et la lecture des messages.
- Les erreurs de validation sont retournées avec un message explicite et la liste des erreurs.

---

## 5. Repository

- Les méthodes du repository font des jointures SQL pour enrichir chaque message avec les infos du sender et du receiver (freelance ou company).
- La pagination est gérée via `limit` et `offset`.

---

## 6. Sécurité

- Seuls les freelances ou companies authentifiés peuvent accéder aux endpoints.
- Les IDs sont vérifiés et validés.
- Seul l'expéditeur d'un message peut modifier ou supprimer ce message (contrôle dans le service).

---

## 7. Bonnes pratiques

- Toujours utiliser la pagination pour les conversations longues.
- Les infos du sender et du receiver sont incluses pour éviter des requêtes supplémentaires côté frontend.
- Les erreurs sont gérées de façon centralisée dans le controller.

---

## 8. Événements Socket

- `send_message` : émission lors de l’envoi d’un message
- `receive_message` : réception côté destinataire
- `read_message` : notification de lecture
- `update_message` : notification de modification d'un message
- `delete_message` : notification de suppression d'un message

---

## 9. Exemple de réponse enrichie

```json
{
  "id": "msg-uuid",
  "senderId": "user-uuid",
  "receiverId": "user-uuid",
  "content": "Bonjour !",
  "isRead": false,
  "sentAt": "2024-06-01T12:00:00Z",
  "conversationId": "conv-uuid",
  "createdAt": "2024-06-01T12:00:00Z",
  "updatedAt": null,
  "sender": {
    "id": "user-uuid",
    "firstname": "Alice",
    "lastname": "Dupont",
    "photoUrl": "https://...",
    "role": "freelance"
  },
  "receiver": {
    "id": "company-uuid",
    "companyName": "Acme Corp",
    "logoUrl": "https://...",
    "role": "company"
  },
  "media": [
    {
      "id": "media-uuid",
      "url": "https://...",
      "type": "image",
      "description": "Logo",
      "uploadedAt": "2024-06-01T12:00:00Z",
      "createdAt": "2024-06-01T12:01:00Z"
    }
  ]
}
```

---

## 10. Chiffrement et Migration

---

## 11. À compléter / Améliorer

- Ajout de la gestion des pièces jointes (media) — **implémenté**
- Suppression/édition de message — **implémenté**
- Réponse à un message (reply) — **implémenté via replyToMessageId**
- Recherche full-text dans les messages (à implémenter)
- Statistiques (nombre de messages, etc.)
- Chiffrement end-to-end des messages
- Compression des messages pour optimiser le stockage

---