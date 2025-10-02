# Schema de Base de Données - Synkrone Backend

Ce document recense toutes les tables et enums utilisés dans le backend de la plateforme Synkrone, avec leurs attributs détaillés. Ce mapping servira à la réalisation du diagramme de classe.

## 📊 Résumé

- **Tables utilisées : 20 tables principales**
- **Types énumérés : 17 enums**

---

## 🎯 **Types Énumérés (ENUMs)**

### 1. **availability_enum**
- `'available'` : Disponible pour de nouveaux projets
- `'busy'` : Occupé sur des projets en cours
- `'unavailable'` : Indisponible temporairement

### 2. **company_size_enum**
- `'micro'` : Très petite entreprise (1-9 employés)
- `'small'` : Petite entreprise (10-49 employés)
- `'medium'` : Entreprise moyenne (50-249 employés)
- `'large'` : Grande entreprise (250-999 employés)
- `'very_large'` : Très grande entreprise (1000+ employés)

### 3. **admin_level_enum**
- `'super_admin'` : Administrateur avec tous les droits
- `'moderateur'` : Modérateur avec droits limités
- `'support'` : Support client

### 4. **otp_type_enum**
- `'email_verification'` : Vérification d'email
- `'password_reset'` : Réinitialisation de mot de passe

### 5. **experience_level_enum**
- `'beginner'` : Débutant (0-2 ans)
- `'intermediate'` : Intermédiaire (2-5 ans)
- `'expert'` : Expert (5+ ans)

### 6. **message_type_enum**
- `'text'` : Message texte classique
- `'media'` : Message avec média (image, fichier)
- `'system'` : Message système automatique
- `'payment'` : Message lié aux paiements
- `'contract'` : Message lié aux contrats
- `'deliverable'` : Message lié aux livrables

### 7. **type_work_enum**
- `'remote'` : Travail à distance
- `'hybride'` : Travail hybride
- `'presentiel'` : Travail sur site

### 8. **project_status_enum**
- `'draft'` : Brouillon
- `'published'` : Publié
- `'is_pending'` : En attente

### 9. **application_status_enum**
- `'submitted'` : Soumise
- `'under_review'` : En cours de révision
- `'accepted'` : Acceptée
- `'rejected'` : Rejetée
- `'withdrawn'` : Retirée

### 10. **contract_status_enum**
- `'draft'` : Brouillon
- `'active'` : Actif
- `'pending'` : En attente
- `'completed'` : Terminé
- `'cancelled'` : Annulé
- `'suspended'` : Suspendu

### 11. **payment_mode_enum**
- `'fixed_price'` : Prix fixe
- `'daily_rate'` : Tarif journalier (TJM)
- `'by_milestone'` : Par jalons

### 12. **deliverable_status_enum**
- `'planned'` : Planifié
- `'in_progress'` : En cours
- `'submitted'` : Soumis
- `'validated'` : Validé
- `'rejected'` : Rejeté

### 13. **notification_type_enum**
- `'project'` : Notification de projet
- `'application'` : Notification de candidature
- `'payment'` : Notification de paiement
- `'message'` : Notification de message
- `'system'` : Notification système

### 14. **invitation_status_enum**
- `'sent'` : Envoyée
- `'viewed'` : Vue
- `'accepted'` : Acceptée
- `'declined'` : Déclinée
- `'expired'` : Expirée

### 15. **type_media_enum**
- `'pdf'` : Fichier PDF
- `'image'` : Image
- `'doc'` : Document Word
- `'zip'` : Archive ZIP
- `'other'` : Autre type

### 16. **user_type_enum**
- `'freelance'` : Utilisateur freelance
- `'company'` : Utilisateur entreprise

### 17. **work_day_status_enum**
- `'draft'` : Brouillon
- `'submitted'` : Soumis
- `'validated'` : Validé
- `'rejected'` : Rejeté

---

## 🏗️ Tables Détaillées par Domaine

### 👤 **Utilisateurs et Authentification**

#### 1. **freelances**
- **Description** : Profils des freelances inscrits sur la plateforme
- **Features utilisées** : `freelance`, `auth`, `applications`, `contracts`

**Attributs :**
- `id` : UUID (PK) - Identifiant unique
- `firstname` : VARCHAR(100) NOT NULL - Prénom
- `lastname` : VARCHAR(100) NOT NULL - Nom de famille  
- `email` : VARCHAR(255) UNIQUE NOT NULL - Email (avec contrainte format)
- `password_hashed` : VARCHAR(255) NOT NULL - Mot de passe hashé
- `photo_url` : VARCHAR(500) - URL de la photo de profil
- `job_title` : VARCHAR(200) - Titre du poste
- `experience` : experience_level_enum - Niveau d'expérience
- `description` : TEXT - Description du profil
- `cover_url` : VARCHAR(500) - URL de l'image de couverture
- `linkedin_url` : VARCHAR(500) - URL du profil LinkedIn
- `tjm` : DECIMAL(10,2) - Tarif journalier moyen (CHECK > 0)
- `availability` : availability_enum DEFAULT 'available' - Disponibilité
- `location` : VARCHAR(500) - Localisation
- `is_verified` : BOOLEAN DEFAULT FALSE - Compte vérifié
- `country` : VARCHAR(100) - Pays
- `city` : VARCHAR(100) - Ville
- `phone` : VARCHAR(20) - Téléphone
- `block_duration` : INTEGER DEFAULT 0 - Durée de blocage (-1 = indéfini)
- `is_first_login` : BOOLEAN DEFAULT TRUE - Premier login
- `deleted_at` : TIMESTAMP - Date de suppression (soft delete)
- `blocked_at` : TIMESTAMP - Date de blocage
- `created_at` : TIMESTAMP DEFAULT CURRENT_TIMESTAMP - Date de création
- `updated_at` : TIMESTAMP - Date de mise à jour

**Relations** : 1-N avec `applications`, `contracts`, `freelance_skills`, `conversations`

#### 2. **companies**
- **Description** : Profils des entreprises inscrites sur la plateforme
- **Features utilisées** : `company`, `auth`, `projects`, `contracts`

**Attributs :**
- `id` : UUID (PK) - Identifiant unique
- `company_name` : VARCHAR(200) - Nom de l'entreprise
- `company_email` : VARCHAR(255) UNIQUE NOT NULL - Email de l'entreprise
- `password_hashed` : VARCHAR(255) NOT NULL - Mot de passe hashé
- `logo_url` : VARCHAR(500) - URL du logo
- `company_description` : TEXT - Description de l'entreprise
- `industry` : VARCHAR(100) - Secteur d'activité
- `website_url` : VARCHAR(500) - Site web
- `address` : VARCHAR(500) - Adresse
- `company_size` : company_size_enum - Taille de l'entreprise
- `certification_doc_url` : VARCHAR(500) - Document de certification
- `is_certified` : BOOLEAN DEFAULT FALSE - Entreprise certifiée
- `is_verified` : BOOLEAN DEFAULT FALSE - Compte vérifié
- `block_duration` : INTEGER DEFAULT 0 - Durée de blocage
- `country` : VARCHAR(100) - Pays
- `city` : VARCHAR(100) - Ville
- `company_phone` : VARCHAR(20) - Téléphone
- `is_first_login` : BOOLEAN DEFAULT TRUE - Premier login
- `deleted_at` : TIMESTAMP - Date de suppression
- `blocked_at` : TIMESTAMP - Date de blocage
- `created_at` : TIMESTAMP DEFAULT CURRENT_TIMESTAMP - Date de création
- `updated_at` : TIMESTAMP - Date de mise à jour

**Relations** : 1-N avec `projects`, `contracts`, `conversations`

#### 3. **admins**
- **Description** : Comptes administrateurs de la plateforme
- **Features utilisées** : `admin`, `auth-admin`

**Attributs :**
- `id` : UUID (PK) - Identifiant unique
- `username` : VARCHAR(100) UNIQUE NOT NULL - Nom d'utilisateur
- `email` : VARCHAR(255) UNIQUE - Email
- `password_hashed` : VARCHAR(255) NOT NULL - Mot de passe hashé
- `level` : admin_level_enum NOT NULL - Niveau d'administration
- `created_at` : TIMESTAMP DEFAULT CURRENT_TIMESTAMP - Date de création

**Relations** : 1-N avec `litigations`, `reports`

### 🔐 **Sécurité et Vérification**

#### 4. **otps**
- **Description** : Codes de vérification temporaires (email, reset password)
- **Features utilisées** : `auth`, `otp`

**Attributs :**
- `id` : UUID (PK) - Identifiant unique
- `email` : VARCHAR(255) NOT NULL - Email destinataire
- `code` : VARCHAR(6) NOT NULL - Code OTP (6 chiffres)
- `type` : otp_type_enum - Type de vérification
- `expires_at` : TIMESTAMP NOT NULL - Date d'expiration
- `attempts` : INTEGER DEFAULT 0 - Nombre de tentatives (CHECK >= 0)
- `created_at` : TIMESTAMP DEFAULT CURRENT_TIMESTAMP - Date de création
- `used_at` : TIMESTAMP - Date d'utilisation

**Relations** : Aucune (table autonome)

### 🎯 **Compétences et Catégories**

#### 5. **category_skills**
- **Description** : Catégories de compétences (Développement, Design, etc.)
- **Features utilisées** : `category-skill`, `skills`

**Attributs :**
- `id` : UUID (PK) - Identifiant unique
- `name` : VARCHAR(100) UNIQUE NOT NULL - Nom de la catégorie
- `slug` : VARCHAR(100) UNIQUE NOT NULL - Slug URL-friendly
- `description` : TEXT - Description de la catégorie
- `created_at` : TIMESTAMP DEFAULT CURRENT_TIMESTAMP - Date de création
- `updated_at` : TIMESTAMP - Date de mise à jour

**Relations** : 1-N avec `skills`

#### 6. **skills**
- **Description** : Compétences individuelles associées aux catégories
- **Features utilisées** : `skills`, `freelance-skills`, `project-skills`

**Attributs :**
- `id` : UUID (PK) - Identifiant unique
- `name` : VARCHAR(100) NOT NULL - Nom de la compétence
- `description` : TEXT - Description de la compétence
- `category_id` : UUID (FK) → category_skills(id) - Catégorie parente
- `created_at` : TIMESTAMP DEFAULT CURRENT_TIMESTAMP - Date de création
- `updated_at` : TIMESTAMP - Date de mise à jour

**Relations** : N-N avec `freelances` via `freelance_skills`, N-N avec `projects` via `project_skills`

#### 7. **freelance_skills**
- **Description** : Association freelances ↔ compétences avec niveau
- **Features utilisées** : `freelance-skills`

**Attributs :**
- `freelance_id` : UUID (PK, FK) → freelances(id) - Freelance
- `skill_id` : UUID (PK, FK) → skills(id) - Compétence
- `level` : VARCHAR(50) - Niveau de compétence (optionnel)
- `created_at` : TIMESTAMP DEFAULT CURRENT_TIMESTAMP - Date de création

**Relations** : Table de liaison N-N

### 💼 **Projets et Applications**

#### 8. **project_categories**
- **Description** : Catégories de projets (Web, Mobile, etc.)
- **Features utilisées** : `project-categories`, `projects`

**Attributs :**
- `id` : UUID (PK) - Identifiant unique
- `name` : VARCHAR(100) UNIQUE NOT NULL - Nom de la catégorie
- `description` : TEXT - Description de la catégorie
- `slug` : VARCHAR(100) UNIQUE NOT NULL - Slug URL-friendly
- `created_at` : TIMESTAMP DEFAULT CURRENT_TIMESTAMP - Date de création
- `updated_at` : TIMESTAMP - Date de mise à jour

**Relations** : 1-N avec `projects`

#### 9. **projects**
- **Description** : Projets publiés par les entreprises
- **Features utilisées** : `projects`, `applications`, `contracts`

**Attributs :**
- `id` : UUID (PK) - Identifiant unique
- `company_id` : UUID (FK) → companies(id) - Entreprise propriétaire
- `category_id` : UUID (FK) → project_categories(id) - Catégorie du projet
- `title` : VARCHAR(300) NOT NULL - Titre du projet
- `description` : TEXT NOT NULL - Description détaillée
- `budget_min` : DECIMAL(12,2) - Budget minimum
- `budget_max` : DECIMAL(12,2) - Budget maximum
- `deadline` : DATE - Date limite
- `status` : project_status_enum DEFAULT 'draft' - Statut du projet
- `type_work` : type_work_enum - Type de travail
- `estimated_days` : INTEGER - Nombre de jours estimés
- `published_at` : TIMESTAMP - Date de publication
- `deleted_at` : TIMESTAMP - Date de suppression (soft delete)
- `created_at` : TIMESTAMP DEFAULT CURRENT_TIMESTAMP - Date de création
- `updated_at` : TIMESTAMP - Date de mise à jour

**Relations** : 1-N avec `applications`, `project_skills`, `contracts`

#### 10. **project_skills**
- **Description** : Compétences requises pour chaque projet
- **Features utilisées** : `project-skills`

**Attributs :**
- `project_id` : UUID (PK, FK) → projects(id) - Projet
- `skill_id` : UUID (PK, FK) → skills(id) - Compétence requise
- `is_required` : BOOLEAN DEFAULT TRUE - Compétence obligatoire
- `created_at` : TIMESTAMP DEFAULT CURRENT_TIMESTAMP - Date de création

**Relations** : Table de liaison N-N

#### 11. **applications**
- **Description** : Candidatures des freelances aux projets
- **Features utilisées** : `applications`

**Attributs :**
- `id` : UUID (PK) - Identifiant unique
- `freelance_id` : UUID (FK) → freelances(id) - Freelance candidat
- `project_id` : UUID (FK) → projects(id) - Projet ciblé
- `cover_letter` : TEXT - Lettre de motivation
- `proposed_price` : DECIMAL(12,2) - Prix proposé
- `estimated_days` : INTEGER - Durée estimée
- `status` : application_status_enum DEFAULT 'submitted' - Statut
- `applied_at` : TIMESTAMP DEFAULT CURRENT_TIMESTAMP - Date de candidature
- `reviewed_at` : TIMESTAMP - Date de révision
- `created_at` : TIMESTAMP DEFAULT CURRENT_TIMESTAMP - Date de création
- `updated_at` : TIMESTAMP - Date de mise à jour

**Relations** : 1-1 avec `contracts` (potentiel), N-1 vers `projects` et `freelances`

### 📋 **Contrats et Livrables**

#### 12. **contracts**
- **Description** : Contrats liant freelances et entreprises pour un projet
- **Features utilisées** : `contracts`, `deliverables`

**Attributs :**
- `id` : UUID (PK) - Identifiant unique
- `project_id` : UUID (FK) → projects(id) - Projet concerné
- `freelance_id` : UUID (FK) → freelances(id) - Freelance
- `company_id` : UUID (FK) → companies(id) - Entreprise
- `application_id` : UUID (FK) → applications(id) - Candidature acceptée
- `title` : VARCHAR(300) NOT NULL - Titre du contrat
- `description` : TEXT - Description des termes
- `start_date` : DATE NOT NULL - Date de début
- `end_date` : DATE - Date de fin prévue
- `status` : contract_status_enum DEFAULT 'draft' - Statut du contrat
- `payment_mode` : payment_mode_enum NOT NULL - Mode de paiement
- `total_amount` : DECIMAL(12,2) - Montant total
- `tjm` : DECIMAL(10,2) - Tarif journalier (si applicable)
- `estimated_days` : INTEGER - Nombre de jours estimés
- `terms_conditions` : TEXT - Conditions générales
- `signed_freelance_at` : TIMESTAMP - Date signature freelance
- `signed_company_at` : TIMESTAMP - Date signature entreprise
- `created_at` : TIMESTAMP DEFAULT CURRENT_TIMESTAMP - Date de création
- `updated_at` : TIMESTAMP - Date de mise à jour

**Relations** : 1-N avec `deliverables`, `evaluations`, `invoices`, `payments`, `litigations`

#### 13. **deliverables**
- **Description** : Livrables attendus dans le cadre d'un contrat
- **Features utilisées** : `deliverables`, `media`

**Attributs :**
- `id` : UUID (PK) - Identifiant unique
- `contract_id` : UUID (FK) → contracts(id) - Contrat parent
- `title` : VARCHAR(200) NOT NULL - Titre du livrable
- `description` : TEXT - Description détaillée
- `status` : deliverable_status_enum DEFAULT 'planned' - Statut
- `is_milestone` : BOOLEAN DEFAULT FALSE - Déclenche un paiement si TRUE
- `amount` : DECIMAL(12,2) DEFAULT 0 - Montant du jalon
- `due_date` : DATE - Date d'échéance
- `submitted_at` : TIMESTAMP - Date de soumission
- `validated_at` : TIMESTAMP - Date de validation
- `rejection_reason` : TEXT - Raison du rejet
- `created_at` : TIMESTAMP DEFAULT CURRENT_TIMESTAMP - Date de création
- `updated_at` : TIMESTAMP - Date de mise à jour

**Relations** : 1-N avec `deliverable_media`

### 📁 **Médias et Fichiers**

#### 14. **media**
- **Description** : Fichiers médias centralisés (images, documents)
- **Features utilisées** : `media`, `deliverable_media`, `message_media`

**Attributs :**
- `id` : UUID (PK) - Identifiant unique
- `filename` : VARCHAR(255) NOT NULL - Nom du fichier
- `original_name` : VARCHAR(255) - Nom original du fichier
- `file_path` : VARCHAR(500) NOT NULL - Chemin d'accès au fichier
- `file_url` : VARCHAR(500) - URL publique du fichier
- `mime_type` : VARCHAR(100) - Type MIME
- `file_size` : INTEGER - Taille du fichier en octets
- `type_media` : type_media_enum - Type de média
- `uploaded_by` : UUID - ID de l'utilisateur qui a uploadé
- `deleted_at` : TIMESTAMP - Date de suppression (soft delete)
- `created_at` : TIMESTAMP DEFAULT CURRENT_TIMESTAMP - Date de création
- `updated_at` : TIMESTAMP - Date de mise à jour

**Relations** : N-N avec `deliverables` via `deliverable_media`, N-N avec `messages` via `message_media`

#### 15. **deliverable_media**
- **Description** : Fichiers associés aux livrables
- **Features utilisées** : `deliverable_media`

**Attributs :**
- `deliverable_id` : UUID (PK, FK) → deliverables(id) - Livrable
- `media_id` : UUID (PK, FK) → media(id) - Fichier média
- `deleted_at` : TIMESTAMP - Date de suppression (soft delete)
- `created_at` : TIMESTAMP DEFAULT CURRENT_TIMESTAMP - Date de création

**Relations** : Table de liaison N-N

#### 16. **message_media**
- **Description** : Fichiers attachés aux messages
- **Features utilisées** : `message_media`

**Attributs :**
- `message_id` : UUID (PK, FK) → messages(id) - Message
- `media_id` : UUID (PK, FK) → media(id) - Fichier média
- `deleted_at` : TIMESTAMP - Date de suppression (soft delete)
- `created_at` : TIMESTAMP DEFAULT CURRENT_TIMESTAMP - Date de création

**Relations** : Table de liaison N-N

### 💬 **Communication**

#### 17. **conversations**
- **Description** : Conversations entre freelances et entreprises
- **Features utilisées** : `conversations`, `messages`

**Attributs :**
- `id` : UUID (PK) - Identifiant unique
- `freelance_id` : UUID (FK) → freelances(id) - Freelance participant
- `company_id` : UUID (FK) → companies(id) - Entreprise participante
- `application_id` : UUID (FK) → applications(id) - Candidature liée (optionnel)
- `contract_id` : UUID (FK) → contracts(id) - Contrat lié (optionnel)
- `created_at` : TIMESTAMP DEFAULT CURRENT_TIMESTAMP - Date de création
- `updated_at` : TIMESTAMP - Date de mise à jour

**Contraintes :** UNIQUE (freelance_id, company_id)

**Relations** : 1-N avec `messages`

#### 18. **messages**
- **Description** : Messages échangés entre utilisateurs
- **Features utilisées** : `messages`, `message_media`

**Attributs :**
- `id` : UUID (PK) - Identifiant unique
- `sender_id` : UUID NOT NULL - ID de l'expéditeur (freelance ou company)
- `receiver_id` : UUID NOT NULL - ID du destinataire (freelance ou company)
- `content` : TEXT - Contenu du message
- `type_message` : message_type_enum DEFAULT 'text' - Type de message
- `is_read` : BOOLEAN DEFAULT FALSE - Message lu
- `sent_at` : TIMESTAMP DEFAULT CURRENT_TIMESTAMP - Date d'envoi
- `project_id` : UUID (FK) → projects(id) - Projet lié (optionnel)
- `reply_to_message_id` : UUID (FK) → messages(id) - Message parent (réponse)
- `conversation_id` : UUID (FK) → conversations(id) - Conversation parente
- `created_at` : TIMESTAMP DEFAULT CURRENT_TIMESTAMP - Date de création
- `updated_at` : TIMESTAMP - Date de mise à jour
- `deleted_at` : TIMESTAMP - Date de suppression (soft delete)

**Relations** : 1-N avec `message_media`, récursive avec elle-même (réponses)

### 🔔 **Notifications**

#### 19. **notifications**
- **Description** : Notifications envoyées aux utilisateurs
- **Features utilisées** : `notifications`, `user-notifications`

**Attributs :**
- `id` : UUID (PK) - Identifiant unique
- `title` : VARCHAR(200) NOT NULL - Titre de la notification
- `message` : TEXT NOT NULL - Contenu du message
- `type` : notification_type_enum - Type de notification
- `is_global` : BOOLEAN DEFAULT FALSE - Notification globale (tous les utilisateurs)
- `metadata` : JSONB - Données supplémentaires (JSON)
- `created_at` : TIMESTAMP DEFAULT CURRENT_TIMESTAMP - Date de création
- `updated_at` : TIMESTAMP - Date de mise à jour

**Relations** : 1-N avec `user_notifications`

#### 20. **user_notifications**
- **Description** : Lien entre utilisateurs et notifications (ciblage, statut lu)
- **Features utilisées** : `user-notifications`

**Attributs :**
- `id` : UUID (PK) - Identifiant unique
- `user_id` : UUID NOT NULL - ID de l'utilisateur (freelance ou company)
- `notification_id` : UUID (FK) → notifications(id) - Notification liée
- `is_read` : BOOLEAN DEFAULT FALSE - Notification lue
- `created_at` : TIMESTAMP DEFAULT CURRENT_TIMESTAMP - Date de création
- `updated_at` : TIMESTAMP - Date de mise à jour

**Contraintes :** UNIQUE (user_id, notification_id)

**Relations** : N-1 vers `notifications`

---

## 📊 **Tables additionnelles présentes dans le schéma mais non encore implémentées**

Ces tables sont définies dans `database.sql` mais n'ont pas encore de repositories/services associés :

- **evaluations** : Évaluations post-contrat
- **invoices** : Factures générées 
- **payments** : Historique des paiements
- **litigations** : Litiges entre utilisateurs
- **reports** : Signalements d'utilisateurs
- **project_invitations** : Invitations envoyées aux freelances (non implémentée)
- **work_days** : Jours de travail associés aux livrables (non implémentée)

---

## 🔗 **Diagramme de Relations Principales**

```
                    category_skills
                           ↓ (1-N)
freelances ←--→ freelance_skills ←--→ skills ←--→ project_skills ←--→ projects
    ↓ (1-N)                                                               ↑ (N-1)
applications ←------------------------------------------------------------ companies
    ↓ (1-1)                                                                 ↑ (1-N)
contracts ←-------------------------------------------------------------┘
    ↓ (1-N)                                             project_categories
deliverables                                                   ↑ (N-1)
    ↓ (1-N)                                                     │
deliverable_media ←--→ media ←--→ message_media
                        ↑                  ↓ (N-1)
                   (centralisé)       messages ←-- conversations
                                          ↑              ↓ (1-N)
notifications ←--→ user_notifications      │         freelances
    ↑ (1-N)           ↓ (N-1)              │              +
    │                 └── user_id ────────┘         companies
(globales)                                         (utilisateurs)
```

---

---

## 📝 **Notes Techniques**

### **Contraintes et Validations**
- **UUID v4** : Toutes les clés primaires
- **Email Format** : Validation regex pour les emails
- **URL Format** : Validation HTTPS pour les URLs
- **Montants** : CHECK constraints pour les valeurs positives
- **Dates** : Contraintes logiques entre dates (ex: `end_date` > `start_date`)

### **Fonctionnalités Avancées**
- **Soft Delete** : `deleted_at` sur `freelances`, `companies`, `projects`, `media`, `messages`
- **Audit Trail** : `created_at` / `updated_at` avec triggers automatiques
- **Row Level Security (RLS)** : Activé sur les tables sensibles
- **JSONB Metadata** : Données flexibles dans `notifications`
- **Contraintes UNIQUE** : Éviter les doublons (conversations, user_notifications)

### **Index de Performance**
- **Recherche** : `email`, `job_title`, `company_name`, `title`
- **Filtrage** : `status`, `availability`, `type`, `is_verified`
- **Relations** : Toutes les clés étrangères indexées
- **Géolocalisation** : `country`, `city`
- **Temporalité** : `created_at`, `expires_at`, `deadline`

### **Polymorphisme**
- **user_id** dans `user_notifications` et `messages` : référence `freelances` OU `companies`
- **sender_id/receiver_id** dans `messages` : référence `freelances` OU `companies`
- **uploaded_by** dans `media` : référence `freelances` OU `companies`

---

**📊 Statistiques :**
- **20 tables principales** utilisées dans le backend
- **17 types énumérés** pour la cohérence des données
- **72+ attributs** avec contraintes métier
- **15+ relations clés étrangères** entre tables

**🔄 Version :** Database Schema v2.0 - Septembre 2025  
**📁 Source :** `database.sql` + `database-safe.sql`