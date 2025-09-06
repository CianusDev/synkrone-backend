# 📦 Media Feature — Synkrone Backend

Gestion centralisée des fichiers médias (images, vidéos, documents) pour la plateforme Synkrone.  
Cette feature permet l’upload, la consultation, la modification et la suppression de médias, avec contrôle d’accès par rôle (admin, freelance, company).

---

## 🗂️ Structure des fichiers

- `media.model.ts` — Interfaces & enums TypeScript pour les médias
- `media.repository.ts` — Accès BDD (CRUD, filtres)
- `media.service.ts` — Logique métier
- `media.controller.ts` — Handlers Express, validation, réponses JSON
- `media.route.ts` — Définition des routes Express + middlewares d’authentification
- `media.schema.ts` — Schémas Zod pour validation des payloads
- `README.md` — Documentation de la feature

---

## 🗄️ Structure de la table PostgreSQL

```sql
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url VARCHAR(500) NOT NULL,
    type type_media_enum NOT NULL,
    uploaded_by UUID, -- Peut référencer un user (optionnel)
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    CONSTRAINT unique_url UNIQUE (url)
);
```

- Enum `type_media_enum` : `"image"`, `"video"`, `"document"`, etc.

---

## 📝 Modèle TypeScript

```ts
export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
  DOCUMENT = "document",
}

export interface Media {
  id: string; // UUID
  url: string;
  type: MediaType;
  uploadedBy?: string; // UUID, optionnel
  uploadedAt: Date;
  description?: string;
}
```

---

## 🔒 Sécurité & Accès

Toutes les routes sont protégées par les middlewares :
- `AuthAdminMiddleware`
- `AuthFreelanceMiddleware`
- `AuthCompanyMiddleware`

Un utilisateur doit être authentifié (admin, freelance ou company) pour accéder aux endpoints.

---

## 🚦 API Endpoints

| Méthode | URL             | Description                         | Authentification |
|---------|-----------------|-------------------------------------|------------------|
| GET     | `/media`        | Liste tous les médias (filtrable)   | admin, freelance, company |
| GET     | `/media/:id`    | Récupère un média par son id        | admin, freelance, company |
| POST    | `/media`        | Crée un média                       | admin, freelance, company |
| PUT     | `/media/:id`    | Met à jour un média                 | admin, freelance, company |
| DELETE  | `/media/:id`    | Supprime un média                   | admin, freelance, company |

---

## 📥 Payloads & Validation

### Création

```json
{
  "url": "https://exemple.com/image.jpg",
  "type": "image",
  "uploadedBy": "uuid-user",
  "description": "Image de profil"
}
```

- Validation par Zod (`createMediaSchema`)
- `url` : string, format URL, max 500 caractères
- `type` : enum (`image`, `video`, `document`)
- `uploadedBy` : UUID optionnel
- `description` : string optionnelle, max 1000 caractères

### Mise à jour

```json
{
  "url": "https://exemple.com/nouveau.jpg",
  "type": "image",
  "description": "Nouvelle image"
}
```

- Validation par Zod (`updateMediaSchema`)
- Tous les champs sont optionnels

---

## ⚠️ Erreurs possibles

- `400 Bad Request` : Payload invalide (validation Zod)
- `404 Not Found` : Média non trouvé
- `409 Conflict` : URL déjà utilisée (contrainte unique)
- `401/403 Unauthorized/Forbidden` : Accès refusé (non authentifié ou non autorisé)
- `500 Internal Server Error` : Erreur serveur

---

## 🔗 Intégration

- **Import du router** dans le routeur principal Express :
  ```ts
  import mediaRouter from "./features/media/media.route";
  app.use("/media", mediaRouter);
  ```
- **Upload de fichiers** : Cette feature gère les métadonnées. Pour l’upload physique, intégrer un middleware (ex: Multer) ou un service externe (S3, etc).

---

## 🛡️ Extensibilité

- Ajout de nouveaux types de médias dans l’enum et la table PostgreSQL
- Ajout de champs (tags, visibilité, etc.)
- Intégration avec un service de stockage externe
- Ajout de filtres avancés (par date, type, uploader…)

---

## 🧪 Exemple de requête

**GET /media?type=image&uploadedBy=uuid-user**

Réponse :
```json
[
  {
    "id": "uuid-media",
    "url": "https://exemple.com/image.jpg",
    "type": "image",
    "uploadedBy": "uuid-user",
    "uploadedAt": "2024-06-01T12:34:56.789Z",
    "description": "Image de profil"
  }
]
```

---

## 📚 Liens utiles

- [Multer (upload de fichiers)](https://github.com/expressjs/multer)
- [Zod (validation)](https://zod.dev/)
- [Express](https://expressjs.com/)

---

**Pour toute question ou extension, voir la documentation du backend Synkrone ou contacter l’équipe technique.**