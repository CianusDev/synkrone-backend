# Scripts de Base de Données

Ce dossier contient les scripts pour initialiser et gérer la base de données PostgreSQL de Synkrone.

## Fichiers

- `init.ts` : Script principal d'initialisation de la base de données
- `create_admin.ts` : Script pour créer un administrateur (à implémenter)

## Utilisation

### Prérequis

Assurez-vous d'avoir configuré les variables d'environnement suivantes dans votre fichier `.env` :

```env
# Option 1 : URL complète
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Option 2 : Variables séparées
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=synkrone_db
NODE_ENV=development
```

### Commandes disponibles

#### 1. Initialiser la base de données
```bash
npm run db:init
```
Cette commande :
- Lit le fichier `database.sql`
- Exécute tous les scripts SQL dans une transaction
- Crée les tables, types, fonctions et vues
- Vérifie que tout a été créé correctement

#### 2. Réinitialiser complètement la base de données
```bash
npm run db:reset
```
⚠️ **ATTENTION** : Cette commande supprime TOUTES les données existantes !
Elle :
- Supprime toutes les tables, types, fonctions et vues
- Puis réexécute l'initialisation complète

#### 3. Vérifier l'état de la base de données
```bash
npm run db:verify
```
Cette commande vérifie que :
- Toutes les tables principales existent
- Tous les types énumérés sont créés

### Exécution directe avec ts-node

Vous pouvez aussi exécuter le script directement :

```bash
# Initialiser
npx ts-node src/scripts/db/init.ts init

# Réinitialiser
npx ts-node src/scripts/db/init.ts reset

# Vérifier
npx ts-node src/scripts/db/init.ts verify
```

## Structure de la base de données

Le script créé les éléments suivants :

### Types énumérés
- `user_type_enum` : 'freelance', 'company'
- `availability_enum` : 'available', 'busy', 'unavailable'
- `company_size_enum` : 'startup', 'sme', 'large_company'
- `admin_role_enum` : 'super_admin', 'moderateur', 'support'
- `otp_type_enum` : 'verification_email', 'reinitialisation_mot_de_passe', 'verification_telephone'

### Tables principales
- `users` : Utilisateurs (freelances et entreprises)
- `freelance_profiles` : Profils détaillés des freelances
- `company_profiles` : Profils détaillés des entreprises
- `admins` : Comptes administrateurs
- `user_sessions` : Sessions utilisateurs actives
- `otps` : Codes de vérification temporaires

### Fonctions utilitaires
- `is_user_blocked()` : Vérifie si un utilisateur est bloqué
- `cleanup_expired_sessions()` : Nettoie les sessions expirées
- `cleanup_expired_otps()` : Nettoie les OTP expirés
- `admin_revoke_session()` : Révoque une session utilisateur
- `admin_revoke_user_sessions()` : Révoque toutes les sessions d'un utilisateur
- `admin_block_user()` : Bloque un utilisateur

### Vues d'administration
- `active_users` : Utilisateurs actifs
- `available_freelances` : Freelances disponibles
- `admin_user_sessions` : Sessions avec détails pour l'admin
- `admin_session_stats` : Statistiques des sessions
- `admin_suspicious_activity` : Activité suspecte détectée

### Sécurité
- Row Level Security (RLS) activé sur les tables sensibles
- Triggers automatiques pour `updated_at`
- Index optimisés pour les performances

## Gestion des erreurs

Le script gère intelligemment les erreurs :
- Ignore les objets déjà existants (extensions, types, etc.)
- Utilise des transactions pour assurer la cohérence
- Affiche des messages détaillés sur le progrès
- Rollback automatique en cas d'erreur

## Logs

Le script affiche des logs détaillés :
- 🚀 Début d'opération
- 📄 Lecture de fichiers
- ⏳ Progression
- ⚠️ Avertissements (objets ignorés)
- ✅ Succès
- ❌ Erreurs
- 📊 Statistiques finales
