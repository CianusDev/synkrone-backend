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
-- TRIGGERS POUR updated_at
-- =============================================

-- Fonction générique pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
-- DELIMITER //



CREATE TRIGGER update_freelances_updated_at
    BEFORE UPDATE ON freelances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- DELIMITER //



CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- DELIMITER //

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
