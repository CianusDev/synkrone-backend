-- =============================================
-- SCHEMA POSTGRESQL - PLATEFORME FREELANCE
-- Mis à jour selon database.md
-- =============================================

-- Extensions utiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- TYPES ÉNUMÉRÉS
-- =============================================

CREATE TYPE availability_enum AS ENUM ('available', 'busy', 'unavailable');
CREATE TYPE company_size_enum AS ENUM ('micro', 'small', 'medium', 'large', 'very_large');
CREATE TYPE admin_level_enum AS ENUM ('super_admin', 'moderateur', 'support');
CREATE TYPE otp_type_enum AS ENUM ('email_verification', 'password_reset');
CREATE TYPE experience_level_enum AS ENUM ('beginner', 'intermediate', 'expert');

-- =============================================
-- TABLE FREELANCES
-- =============================================

CREATE TABLE freelances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hashed VARCHAR(255) NOT NULL,
    photo_url VARCHAR(500),
    job_title VARCHAR(200),
    experience experience_level_enum,
    description TEXT,
    cover_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    tjm DECIMAL(10,2) CHECK (tjm > 0),
    availability availability_enum DEFAULT 'available',
    location VARCHAR(500),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    country VARCHAR(100),
    city VARCHAR(100),
    phone VARCHAR(20),
    block_duration INTEGER DEFAULT 0 CHECK (block_duration >= -1),
    is_first_login BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    blocked_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

-- Index pour optimiser les requêtes sur les freelances
CREATE INDEX idx_freelances_email ON freelances(email);
CREATE INDEX idx_freelances_job_title ON freelances(job_title);
CREATE INDEX idx_freelances_availability ON freelances(availability);
CREATE INDEX idx_freelances_experience ON freelances(experience);
CREATE INDEX idx_freelances_country ON freelances(country);
CREATE INDEX idx_freelances_deleted_at ON freelances(deleted_at);

-- =============================================
-- TABLE COMPANIES
-- =============================================

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(200) NULL,
    company_email VARCHAR(255) UNIQUE NOT NULL,
    password_hashed VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    company_description TEXT,
    industry VARCHAR(100),
    website_url VARCHAR(500),
    address VARCHAR(500),
    company_size company_size_enum,
    certification_doc_url VARCHAR(500),
    is_certified BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    block_duration INTEGER DEFAULT 0 CHECK (block_duration >= -1),
    country VARCHAR(100),
    city VARCHAR(100),
    company_phone VARCHAR(20),
    is_first_login BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP NULL,
    blocked_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

-- Index pour optimiser les requêtes sur les entreprises
CREATE INDEX idx_companies_company_email ON companies(company_email);
CREATE INDEX idx_companies_company_name ON companies(company_name);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_company_size ON companies(company_size);
CREATE INDEX idx_companies_is_certified ON companies(is_certified);
CREATE INDEX idx_companies_is_verified ON companies(is_verified);
CREATE INDEX idx_companies_country ON companies(country);
CREATE INDEX idx_companies_deleted_at ON companies(deleted_at);

-- =============================================
-- TABLE ADMINS
-- =============================================

CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NULL,
    password_hashed VARCHAR(255) NOT NULL,
    level admin_level_enum NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index pour authentification
CREATE INDEX idx_admins_username ON admins(username);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_level ON admins(level);

-- =============================================
-- TABLE USER_SESSIONS
-- =============================================

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    ip_address VARCHAR(45) NULL, -- Format IPv4 ou IPv6
    user_agent TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP NULL
);

-- Index pour gestion des sessions
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_is_active ON user_sessions(is_active);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_sessions_ip_address ON user_sessions(ip_address);

-- =============================================
-- TABLE OTPS
-- =============================================

CREATE TABLE otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    type otp_type_enum,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER DEFAULT 0 CHECK (attempts >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL
);

-- Index pour validation OTP
CREATE INDEX idx_otps_email ON otps(email);
CREATE INDEX idx_otps_code ON otps(code);
CREATE INDEX idx_otps_type ON otps(type);
CREATE INDEX idx_otps_expires_at ON otps(expires_at);

-- =============================================
-- TABLE ADMIN_SESSIONS
-- =============================================

CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES admins(id),
    ip_address VARCHAR(45) NULL, -- Format IPv4 ou IPv6
    user_agent TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP NULL
);

-- Index pour gestion des sessions admin
CREATE INDEX idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX idx_admin_sessions_is_active ON admin_sessions(is_active);
CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX idx_admin_sessions_ip_address ON admin_sessions(ip_address);

-- =============================================
-- FONCTIONS UTILITAIRES
-- =============================================

-- DELIMITER //

-- Fonction pour vérifier si un freelance est bloqué
CREATE OR REPLACE FUNCTION is_freelance_blocked(freelance_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    freelance_record freelances%ROWTYPE;
BEGIN
    SELECT * INTO freelance_record FROM freelances WHERE id = freelance_uuid;

    IF freelance_record.blocked_at IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Blocage indéfini
    IF freelance_record.block_duration = -1 THEN
        RETURN TRUE;
    END IF;

    -- Vérifier si le blocage est encore actif
    IF freelance_record.blocked_at + INTERVAL '1 day' * freelance_record.block_duration > CURRENT_TIMESTAMP THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si une entreprise est bloquée
CREATE OR REPLACE FUNCTION is_company_blocked(company_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    company_record companies%ROWTYPE;
BEGIN
    SELECT * INTO company_record FROM companies WHERE id = company_uuid;

    IF company_record.blocked_at IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Blocage indéfini
    IF company_record.block_duration = -1 THEN
        RETURN TRUE;
    END IF;

    -- Vérifier si le blocage est encore actif
    IF company_record.blocked_at + INTERVAL '1 day' * company_record.block_duration > CURRENT_TIMESTAMP THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les sessions utilisateurs expirées
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions
    WHERE expires_at < CURRENT_TIMESTAMP
    OR revoked_at IS NOT NULL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les sessions admin expirées
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM admin_sessions
    WHERE expires_at < CURRENT_TIMESTAMP
    OR revoked_at IS NOT NULL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les OTP expirés
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM otps
    WHERE expires_at < CURRENT_TIMESTAMP
    OR used_at IS NOT NULL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction ADMIN : Révoquer une session utilisateur
CREATE OR REPLACE FUNCTION admin_revoke_session(session_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_sessions
    SET revoked_at = CURRENT_TIMESTAMP,
        is_active = FALSE
    WHERE id = session_uuid;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Fonction ADMIN : Révoquer une session administrateur
CREATE OR REPLACE FUNCTION admin_revoke_admin_session(session_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE admin_sessions
    SET revoked_at = CURRENT_TIMESTAMP,
        is_active = FALSE
    WHERE id = session_uuid;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Fonction ADMIN : Révoquer toutes les sessions d'un utilisateur
CREATE OR REPLACE FUNCTION admin_revoke_user_sessions(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    revoked_count INTEGER;
BEGIN
    UPDATE user_sessions
    SET revoked_at = CURRENT_TIMESTAMP,
        is_active = FALSE
    WHERE user_id = user_uuid
    AND revoked_at IS NULL;

    GET DIAGNOSTICS revoked_count = ROW_COUNT;
    RETURN revoked_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction ADMIN : Révoquer toutes les sessions d'un administrateur
CREATE OR REPLACE FUNCTION admin_revoke_admin_sessions(admin_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    revoked_count INTEGER;
BEGIN
    UPDATE admin_sessions
    SET revoked_at = CURRENT_TIMESTAMP,
        is_active = FALSE
    WHERE admin_id = admin_uuid
    AND revoked_at IS NULL;

    GET DIAGNOSTICS revoked_count = ROW_COUNT;
    RETURN revoked_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction ADMIN : Bloquer un freelance et révoquer ses sessions
CREATE OR REPLACE FUNCTION admin_block_freelance(freelance_uuid UUID, duration_days INTEGER DEFAULT -1)
RETURNS BOOLEAN AS $$
BEGIN
    -- Bloquer le freelance
    UPDATE freelances
    SET blocked_at = CURRENT_TIMESTAMP,
        block_duration = duration_days
    WHERE id = freelance_uuid;

    -- Révoquer toutes ses sessions
    PERFORM admin_revoke_user_sessions(freelance_uuid);

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Fonction ADMIN : Bloquer une entreprise et révoquer ses sessions
CREATE OR REPLACE FUNCTION admin_block_company(company_uuid UUID, duration_days INTEGER DEFAULT -1)
RETURNS BOOLEAN AS $$
BEGIN
    -- Bloquer l'entreprise
    UPDATE companies
    SET blocked_at = CURRENT_TIMESTAMP,
        block_duration = duration_days
    WHERE id = company_uuid;

    -- Révoquer toutes ses sessions
    PERFORM admin_revoke_user_sessions(company_uuid);

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VUES POUR L'ADMINISTRATION
-- =============================================

-- Vue pour les freelances actifs
CREATE VIEW active_freelances AS
SELECT f.*
FROM freelances f
WHERE f.deleted_at IS NULL
AND NOT is_freelance_blocked(f.id);

-- Vue pour les entreprises actives
CREATE VIEW active_companies AS
SELECT c.*
FROM companies c
WHERE c.deleted_at IS NULL
AND NOT is_company_blocked(c.id);

-- Vue pour les freelances disponibles
CREATE VIEW available_freelances AS
SELECT f.id, f.email, f.country, f.firstname, f.lastname,
       f.job_title, f.tjm, f.availability, f.experience
FROM freelances f
WHERE f.deleted_at IS NULL
AND f.is_verified = TRUE
AND f.availability = 'available'
AND NOT is_freelance_blocked(f.id);


-- Vue ADMIN : Sessions utilisateurs avec détails
CREATE VIEW admin_user_sessions AS
SELECT
    s.id as session_id,
    s.user_id,
    COALESCE(f.email, c.company_email) as user_email,
    CASE
        WHEN f.id IS NOT NULL THEN 'freelance'
        WHEN c.id IS NOT NULL THEN 'company'
        ELSE 'unknown'
    END as user_type,
    COALESCE(f.firstname || ' ' || f.lastname, c.company_name) as user_name,
    s.ip_address,
    s.user_agent,
    s.is_active,
    s.last_activity_at,
    s.expires_at,
    s.created_at as session_started,
    s.revoked_at,
    CASE
        WHEN s.expires_at < CURRENT_TIMESTAMP THEN 'expired'
        WHEN s.revoked_at IS NOT NULL THEN 'revoked'
        WHEN s.is_active = FALSE THEN 'inactive'
        ELSE 'active'
    END as session_status,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - s.last_activity_at))/60 as minutes_since_activity
FROM user_sessions s
LEFT JOIN freelances f ON s.user_id = f.id
LEFT JOIN companies c ON s.user_id = c.id
ORDER BY s.last_activity_at DESC;

-- Vue ADMIN : Sessions administrateurs avec détails
CREATE VIEW admin_admin_sessions AS
SELECT
    s.id as session_id,
    s.admin_id,
    a.username as admin_username,
    a.email as admin_email,
    a.level as admin_level,
    s.ip_address,
    s.user_agent,
    s.is_active,
    s.last_activity_at,
    s.expires_at,
    s.created_at as session_started,
    s.revoked_at,
    CASE
        WHEN s.expires_at < CURRENT_TIMESTAMP THEN 'expired'
        WHEN s.revoked_at IS NOT NULL THEN 'revoked'
        WHEN s.is_active = FALSE THEN 'inactive'
        ELSE 'active'
    END as session_status,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - s.last_activity_at))/60 as minutes_since_activity
FROM admin_sessions s
LEFT JOIN admins a ON s.admin_id = a.id
ORDER BY s.last_activity_at DESC;

-- Vue ADMIN : Statistiques des sessions utilisateurs
CREATE VIEW admin_session_stats AS
SELECT
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE is_active = TRUE AND expires_at > CURRENT_TIMESTAMP) as active_sessions,
    COUNT(*) FILTER (WHERE expires_at < CURRENT_TIMESTAMP) as expired_sessions,
    COUNT(*) FILTER (WHERE revoked_at IS NOT NULL) as revoked_sessions,
    COUNT(DISTINCT user_id) as unique_users_with_sessions,
    COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours') as sessions_last_24h,
    COUNT(*) FILTER (WHERE last_activity_at > CURRENT_TIMESTAMP - INTERVAL '1 hour') as active_last_hour
FROM user_sessions;

-- Vue ADMIN : Statistiques des sessions administrateurs
CREATE VIEW admin_admin_session_stats AS
SELECT
    COUNT(*) as total_admin_sessions,
    COUNT(*) FILTER (WHERE is_active = TRUE AND expires_at > CURRENT_TIMESTAMP) as active_admin_sessions,
    COUNT(*) FILTER (WHERE expires_at < CURRENT_TIMESTAMP) as expired_admin_sessions,
    COUNT(*) FILTER (WHERE revoked_at IS NOT NULL) as revoked_admin_sessions,
    COUNT(DISTINCT admin_id) as unique_admins_with_sessions,
    COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours') as admin_sessions_last_24h,
    COUNT(*) FILTER (WHERE last_activity_at > CURRENT_TIMESTAMP - INTERVAL '1 hour') as admins_active_last_hour
FROM admin_sessions;

-- Vue ADMIN : Activité suspecte utilisateurs
CREATE VIEW admin_suspicious_activity AS
SELECT
    s.user_id,
    COALESCE(f.email, c.company_email) as user_email,
    CASE
        WHEN f.id IS NOT NULL THEN 'freelance'
        WHEN c.id IS NOT NULL THEN 'company'
        ELSE 'unknown'
    END as user_type,
    COUNT(DISTINCT s.ip_address) as different_ips,
    COUNT(s.id) as total_sessions,
    MAX(s.last_activity_at) as last_activity,
    array_agg(DISTINCT s.ip_address) as ip_addresses
FROM user_sessions s
LEFT JOIN freelances f ON s.user_id = f.id
LEFT JOIN companies c ON s.user_id = c.id
WHERE s.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY s.user_id, f.email, c.company_email, f.id, c.id
HAVING COUNT(DISTINCT s.ip_address) > 3 -- Plus de 3 IP différentes
ORDER BY different_ips DESC;

-- Vue ADMIN : Activité suspecte administrateurs
CREATE VIEW admin_suspicious_admin_activity AS
SELECT
    s.admin_id,
    a.username as admin_username,
    a.email as admin_email,
    a.level as admin_level,
    COUNT(DISTINCT s.ip_address) as different_ips,
    COUNT(s.id) as total_sessions,
    MAX(s.last_activity_at) as last_activity,
    array_agg(DISTINCT s.ip_address) as ip_addresses
FROM admin_sessions s
LEFT JOIN admins a ON s.admin_id = a.id
WHERE s.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY s.admin_id, a.username, a.email, a.level
HAVING COUNT(DISTINCT s.ip_address) > 2 -- Plus de 2 IP différentes pour les admins (plus strict)
ORDER BY different_ips DESC;

-- =============================================
-- POLITIQUES DE SÉCURITÉ RLS (Row Level Security)
-- =============================================

-- Activer RLS sur les tables sensibles
ALTER TABLE freelances ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;

-- Politique pour les sessions : utilisateur voit ses sessions OU admin voit tout
CREATE POLICY user_sessions_policy ON user_sessions
    USING (
        user_id = current_setting('app.current_user_id', true)::UUID
        OR current_setting('app.user_role', true) IN ('super_admin', 'moderateur', 'support')
    );

-- Politique pour les sessions admin : admin voit uniquement sa session OU super_admin voit tout
CREATE POLICY admin_sessions_policy ON admin_sessions
    USING (
        admin_id = current_setting('app.current_user_id', true)::UUID
        OR current_setting('app.user_role', true) = 'super_admin'
    );

-- Politique pour les freelances : freelance voit son profil OU admin voit tout
CREATE POLICY freelances_policy ON freelances
    USING (
        id = current_setting('app.current_user_id', true)::UUID
        OR current_setting('app.user_role', true) IN ('super_admin', 'moderateur', 'support')
    );

-- Politique pour les entreprises : entreprise voit son profil OU admin voit tout
CREATE POLICY companies_policy ON companies
    USING (
        id = current_setting('app.current_user_id', true)::UUID
        OR current_setting('app.user_role', true) IN ('super_admin', 'moderateur', 'support')
    );

-- Politique pour les OTP : utilisateur voit ses OTP OU admin voit tout
CREATE POLICY otps_policy ON otps
    USING (
        email = current_setting('app.current_user_email', true)
        OR current_setting('app.user_role', true) IN ('super_admin', 'moderateur', 'support')
    );



-- =============================================
-- TABLE CATEGORY_SKILLS
-- =============================================

CREATE TABLE category_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

CREATE INDEX idx_category_skills_name ON category_skills(name);

-- =============================================
-- TABLE SKILLS
-- =============================================

CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES category_skills(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

CREATE INDEX idx_skills_name ON skills(name);
CREATE INDEX idx_skills_category_id ON skills(category_id);

-- =============================================
-- TABLE FREELANCE_SKILLS (relation N-N entre freelances et skills)
-- =============================================

CREATE TABLE freelance_skills (
    freelance_id UUID NOT NULL REFERENCES freelances(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (freelance_id, skill_id),
    level VARCHAR(50), -- Optionnel : niveau de compétence (débutant, intermédiaire, expert, etc.)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_freelance_skills_freelance_id ON freelance_skills(freelance_id);
CREATE INDEX idx_freelance_skills_skill_id ON freelance_skills(skill_id);

-- =============================================
-- TYPES ENUMS SUPPLEMENTAIRES
-- =============================================

CREATE TYPE type_work_enum AS ENUM ('remote', 'hybride', 'presentiel');
CREATE TYPE type_media_enum AS ENUM ('pdf', 'image', 'doc', 'zip', 'other');

-- =============================================
-- TABLE MEDIA (centralisation des fichiers)
-- =============================================

CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url VARCHAR(500) NOT NULL,
    type type_media_enum NOT NULL,
    uploaded_by UUID, -- Peut référencer un user (optionnel)
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    CONSTRAINT unique_url UNIQUE (url)
);

-- =============================================
-- TABLE PROJECT_CATEGORIES (CategorieProjet)
-- =============================================

CREATE TABLE project_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

-- =============================================
-- TABLE PROJECTS
-- =============================================

CREATE TYPE project_status_enum AS ENUM ('draft', 'published', 'is_pending');

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    budget_min DECIMAL(12,2),
    budget_max DECIMAL(12,2),
    deadline DATE,
    level_experience experience_level_enum,
    tjm_proposed DECIMAL(10,2) CHECK (tjm_proposed > 0),
    allow_multiple_applications BOOLEAN DEFAULT FALSE,
    duration_days INTEGER CHECK (duration_days >= 0),
    status project_status_enum DEFAULT 'draft',
    type_work type_work_enum,
    category_id UUID REFERENCES project_categories(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    published_at TIMESTAMP NULL
);

-- =============================================
-- TABLE PROJECT_SKILLS (liaison projet/compétence)
-- =============================================

CREATE TABLE project_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE
);

-- =============================================
-- TABLE APPLICATIONS (candidatures)
-- =============================================

CREATE TYPE application_status_enum AS ENUM ('submitted', 'under_review', 'accepted', 'rejected', 'withdrawn');

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    freelance_id UUID NOT NULL REFERENCES freelances(id) ON DELETE CASCADE,
    proposed_rate DECIMAL(10,2),
    cover_letter TEXT,
    status application_status_enum DEFAULT 'submitted',
    submission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    response_date TIMESTAMP NULL
);

-- =============================================
-- TABLE CONTRACTS
-- =============================================

CREATE TYPE contract_status_enum AS ENUM ('draft', 'active', 'completed', 'cancelled', 'suspended');
CREATE TYPE payment_mode_enum AS ENUM ('by_milestone', 'final_payment');

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    freelance_id UUID NOT NULL REFERENCES freelances(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    agreed_rate DECIMAL(10,2),
    payment_mode payment_mode_enum,
    terms TEXT,
    start_date DATE,
    end_date DATE,
    status contract_status_enum DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLE DELIVERABLES
-- =============================================

CREATE TYPE deliverable_status_enum AS ENUM ('planned', 'in_progress', 'submitted', 'validated', 'rejected', 'correction_requested');

CREATE TABLE deliverables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status deliverable_status_enum DEFAULT 'planned',
    is_milestone BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP NULL,
    validated_at TIMESTAMP NULL,
    feedback TEXT,
    "order" INTEGER
);

-- =============================================
-- TABLE DELIVERABLE_MEDIA (liaison livrable <-> media)
-- =============================================

CREATE TABLE deliverable_media (
    deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    deleted_at TIMESTAMP NULL;
    PRIMARY KEY (deliverable_id, media_id)
);

-- =============================================
-- TABLE INVOICES
-- =============================================

CREATE TYPE invoice_status_enum AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deliverable_id UUID REFERENCES deliverables(id) ON DELETE SET NULL,
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2),
    tax_amount DECIMAL(12,2),
    issue_date DATE,
    due_date DATE,
    status invoice_status_enum DEFAULT 'draft',
    file_path VARCHAR(500)
);

-- =============================================
-- TABLE PAYMENTS
-- =============================================

CREATE TYPE payment_status_enum AS ENUM ('blocked', 'pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_type_enum AS ENUM ('milestone', 'final', 'deposit', 'commission');

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    amount DECIMAL(12,2),
    status payment_status_enum DEFAULT 'pending',
    transaction_date TIMESTAMP,
    type payment_type_enum,
    transaction_id VARCHAR(255)
);

-- =============================================
-- TABLE NOTIFICATIONS (message global ou ciblé)
-- =============================================

CREATE TYPE notification_type_enum AS ENUM ('project', 'application', 'payment', 'message', 'system');

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type notification_type_enum,
    is_global BOOLEAN DEFAULT FALSE,
    -- meta_data JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

-- =============================================
-- TABLE USER_NOTIFICATIONS (liaison notification <-> user)
-- =============================================

CREATE TABLE user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    UNIQUE (user_id, notification_id)
);

-- =============================================
-- TABLE CONVERSATIONS
-- =============================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    freelance_id UUID NOT NULL REFERENCES freelances(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);



-- =============================================
-- TABLE MESSAGES
-- =============================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL
    conversation_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL;
    deleted_at TIMESTAMP NULL;
);

-- =============================================
-- TABLE MESSAGE_MEDIA (liaison message <-> media)
-- =============================================

CREATE TABLE message_media (
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    deleted_at TIMESTAMP NULL;
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (message_id, media_id)
);

-- =============================================
-- TABLE PROJECT_INVITATIONS
-- =============================================

CREATE TYPE invitation_status_enum AS ENUM ('sent', 'viewed', 'accepted', 'declined', 'expired');

CREATE TABLE project_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    freelance_id UUID NOT NULL REFERENCES freelances(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    message TEXT,
    status invitation_status_enum DEFAULT 'sent',
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL
);

-- =============================================
-- TABLE LITIGATIONS
-- =============================================

CREATE TYPE litigation_status_enum AS ENUM ('open', 'in_review', 'resolved', 'closed');

CREATE TABLE litigations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    declarant_id UUID NOT NULL,
    description TEXT,
    status litigation_status_enum DEFAULT 'open',
    priority VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    admin_id UUID REFERENCES admins(id) ON DELETE SET NULL
);

-- =============================================
-- TABLE REPORTS
-- =============================================

CREATE TYPE report_status_enum AS ENUM ('submitted', 'in_review', 'resolved', 'dismissed');

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL,
    reported_user_id UUID NOT NULL,
    reason VARCHAR(255),
    description TEXT,
    status report_status_enum DEFAULT 'submitted',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    admin_id UUID REFERENCES admins(id) ON DELETE SET NULL
);

-- =============================================
-- INDEXS SUPPLEMENTAIRES POUR PERFORMANCE ET RECHERCHE
-- =============================================

-- projects
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_projects_category_id ON projects(category_id);
CREATE INDEX idx_projects_status ON projects(status);

-- project_skills
CREATE INDEX idx_project_skills_project_id ON project_skills(project_id);
CREATE INDEX idx_project_skills_skill_id ON project_skills(skill_id);

-- applications
CREATE INDEX idx_applications_project_id ON applications(project_id);
CREATE INDEX idx_applications_freelance_id ON applications(freelance_id);
CREATE INDEX idx_applications_status ON applications(status);

-- contracts
CREATE INDEX idx_contracts_project_id ON contracts(project_id);
CREATE INDEX idx_contracts_freelance_id ON contracts(freelance_id);
CREATE INDEX idx_contracts_company_id ON contracts(company_id);
CREATE INDEX idx_contracts_status ON contracts(status);

-- deliverables
CREATE INDEX idx_deliverables_contract_id ON deliverables(contract_id);
CREATE INDEX idx_deliverables_status ON deliverables(status);

-- invoices
CREATE INDEX idx_invoices_contract_id ON invoices(contract_id);
CREATE INDEX idx_invoices_deliverable_id ON invoices(deliverable_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE UNIQUE INDEX idx_invoices_invoice_number ON invoices(invoice_number);

-- payments
CREATE INDEX idx_payments_contract_id ON payments(contract_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_status ON payments(status);

-- notifications
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_global ON notifications(is_global);

-- user_notifications
CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_notification_id ON user_notifications(notification_id);
CREATE INDEX idx_user_notifications_is_read ON user_notifications(is_read);

-- messages
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_project_id ON messages(project_id);
CREATE INDEX idx_messages_reply_to_message_id ON messages(reply_to_message_id);

-- conversations
CREATE INDEX idx_conversations_freelance_id ON conversations(freelance_id);
CREATE INDEX idx_conversations_company_id ON conversations(company_id);
CREATE INDEX idx_conversations_application_id ON conversations(application_id);
CREATE INDEX idx_conversations_contract_id ON conversations(contract_id);

-- project_invitations
CREATE INDEX idx_project_invitations_project_id ON project_invitations(project_id);
CREATE INDEX idx_project_invitations_freelance_id ON project_invitations(freelance_id);
CREATE INDEX idx_project_invitations_company_id ON project_invitations(company_id);
CREATE INDEX idx_project_invitations_status ON project_invitations(status);

-- litigations
CREATE INDEX idx_litigations_contract_id ON litigations(contract_id);
CREATE INDEX idx_litigations_admin_id ON litigations(admin_id);
CREATE INDEX idx_litigations_status ON litigations(status);

-- reports
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX idx_reports_admin_id ON reports(admin_id);
CREATE INDEX idx_reports_status ON reports(status);

-- media
CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);


-- =============================================
-- Fonction générique pour mettre à jour updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- AJOUT DE created_at/updated_at SUR LES TABLES IMPORTANTES (SUGGESTION)
-- =============================================
-- Si tu veux tracer l'historique sur messages, notifications, etc., ajoute :
-- ALTER TABLE messages ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
-- ALTER TABLE messages ADD COLUMN updated_at TIMESTAMP NULL;
-- ALTER TABLE notifications ADD COLUMN updated_at TIMESTAMP NULL;
-- (N'oublie pas d'ajouter les triggers si tu ajoutes updated_at)

-- =============================================
-- COMMENTAIRES SUR LES TABLES
-- =============================================

COMMENT ON TABLE freelances IS 'Table des freelances avec toutes leurs informations';
COMMENT ON TABLE companies IS 'Table des entreprises avec toutes leurs informations';
COMMENT ON TABLE admins IS 'Comptes administrateurs';
COMMENT ON TABLE user_sessions IS 'Sessions utilisateurs actives (freelances et entreprises)';
COMMENT ON TABLE admin_sessions IS 'Sessions administrateurs actives';
COMMENT ON TABLE otps IS 'Codes de vérification temporaires';
COMMENT ON TABLE category_skills IS 'Catégories de compétences pour les skills';
COMMENT ON TABLE skills IS 'Compétences associées à une catégorie';
COMMENT ON TABLE freelance_skills IS 'Relation N-N entre freelances et skills, avec niveau de compétence optionnel';
COMMENT ON TABLE media IS 'Fichiers médias centralisés (images, documents, etc.)';
COMMENT ON TABLE project_categories IS 'Catégories de projets';
COMMENT ON TABLE projects IS 'Projets publiés par les entreprises';
COMMENT ON TABLE project_skills IS 'Compétences requises pour chaque projet';
COMMENT ON TABLE applications IS 'Candidatures des freelances aux projets';
COMMENT ON TABLE contracts IS 'Contrats liant un freelance à une entreprise pour un projet';
COMMENT ON TABLE deliverables IS 'Livrables attendus dans le cadre dun contrat';
COMMENT ON TABLE deliverable_media IS 'Fichiers associés à chaque livrable';
COMMENT ON TABLE invoices IS 'Factures générées pour les paiements des contrats';
COMMENT ON COLUMN invoices.invoice_number IS 'Numéro de facture unique';
COMMENT ON TABLE payments IS 'Historique des paiements effectués';
COMMENT ON TABLE notifications IS 'Notifications envoyées aux utilisateurs';
COMMENT ON TABLE messages IS 'Messages échangés entre freelances et entreprises';
COMMENT ON TABLE message_media IS 'Fichiers attachés aux messages';
COMMENT ON TABLE project_invitations IS 'Invitations envoyées aux freelances pour postuler à un projet';
COMMENT ON TABLE litigations IS 'Litiges ouverts entre freelances et entreprises';
COMMENT ON TABLE reports IS 'Signalements faits par les utilisateurs contre d''autres utilisateurs';
COMMENT ON TABLE notifications IS 'Notifications globales ou ciblées (message, type, is_global)';
COMMENT ON TABLE user_notifications IS 'Lien entre utilisateur et notification (ciblage, lu/non lu)';

-- =============================================
-- TRIGGERS POUR updated_at (À placer à la fin du fichier)
-- =============================================

CREATE TRIGGER update_freelances_updated_at
    BEFORE UPDATE ON freelances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_skills_updated_at
    BEFORE UPDATE ON category_skills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at
    BEFORE UPDATE ON skills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_categories_updated_at
    BEFORE UPDATE ON project_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notifications_updated_at
    BEFORE UPDATE ON user_notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
