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
CREATE TYPE message_type_enum AS ENUM (
    'text',              -- Message texte classique
    'media',             -- Message avec média (image, fichier)
    'system'             -- Message système automatique
    'payment',            -- Message lié aux paiements
    'contract',           -- Message lié aux contrats
    'deliverable',          -- Message lié aux livrables
);
CREATE TYPE type_work_enum AS ENUM ('remote', 'hybride', 'presentiel');
CREATE TYPE type_media_enum AS ENUM ('pdf', 'image', 'doc', 'zip', 'other');
CREATE TYPE project_status_enum AS ENUM ('draft', 'published', 'is_pending');
CREATE TYPE application_status_enum AS ENUM ('submitted', 'under_review', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE contract_status_enum AS ENUM ('draft', 'active', 'pending', 'completed', 'cancelled', 'suspended');
CREATE TYPE payment_mode_enum AS ENUM ('fixed_price', 'daily_rate', 'by_milestone');
CREATE TYPE user_type_enum AS ENUM ('freelance', 'company');
CREATE TYPE deliverable_status_enum AS ENUM ('planned', 'in_progress', 'submitted', 'validated', 'rejected');
CREATE TYPE invoice_status_enum AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_type_enum AS ENUM ('milestone', 'fixed_price', 'commission','orher');
CREATE TYPE work_day_status_enum AS ENUM ('draft', 'submitted', 'validated', 'rejected');
CREATE TYPE notification_type_enum AS ENUM ('project', 'application', 'payment', 'message', 'system');
CREATE TYPE invitation_status_enum AS ENUM ('sent', 'viewed', 'accepted', 'declined', 'expired');
CREATE TYPE litigation_status_enum AS ENUM ('open', 'in_review', 'resolved', 'closed');
CREATE TYPE report_status_enum AS ENUM ('submitted', 'in_review', 'resolved', 'dismissed');

-- =============================================
-- TABLES DE BASE
-- =============================================

-- TABLE FREELANCES
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
    updated_at TIMESTAMP NULL,
    CONSTRAINT chk_freelance_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_freelance_photo_url CHECK (photo_url IS NULL OR photo_url ~* '^https?://'),
    CONSTRAINT chk_freelance_cover_url CHECK (cover_url IS NULL OR cover_url ~* '^https?://'),
    CONSTRAINT chk_freelance_linkedin_url CHECK (linkedin_url IS NULL OR linkedin_url ~* '^https?://')
);

-- TABLE COMPANIES
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
    updated_at TIMESTAMP NULL,
    CONSTRAINT chk_company_email_format CHECK (company_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_company_logo_url CHECK (logo_url IS NULL OR logo_url ~* '^https?://'),
    CONSTRAINT chk_company_website_url CHECK (website_url IS NULL OR website_url ~* '^https?://'),
    CONSTRAINT chk_company_cert_doc_url CHECK (certification_doc_url IS NULL OR certification_doc_url ~* '^https?://')
);

-- TABLE ADMINS
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NULL,
    password_hashed VARCHAR(255) NOT NULL,
    level admin_level_enum NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_admin_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- TABLE USER_SESSIONS
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP NULL
);

-- TABLE ADMIN_SESSIONS
CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES admins(id),
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP NULL
);

-- TABLE OTPS
CREATE TABLE otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    type otp_type_enum,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER DEFAULT 0 CHECK (attempts >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,
    CONSTRAINT chk_otp_code_format CHECK (code ~ '^[0-9]{6}$'),
    CONSTRAINT chk_otp_expires_future CHECK (expires_at > created_at),
    CONSTRAINT chk_otp_max_attempts CHECK (attempts <= 10)
);

-- TABLE CATEGORY_SKILLS
CREATE TABLE category_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

-- TABLE SKILLS
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES category_skills(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

-- TABLE FREELANCE_SKILLS
CREATE TABLE freelance_skills (
    freelance_id UUID NOT NULL REFERENCES freelances(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (freelance_id, skill_id),
    level VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_skill_level CHECK (level IS NULL OR level IN ('beginner', 'intermediate', 'expert', 'master'))
);

-- TABLE MEDIA
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url VARCHAR(500) NOT NULL,
    type type_media_enum NOT NULL,
    uploaded_by UUID,
    size INTEGER CHECK (size >= 0),
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    CONSTRAINT unique_url UNIQUE (url),
    CONSTRAINT chk_media_url_format CHECK (url ~* '^https?://')
);

-- TABLE PROJECT_CATEGORIES
CREATE TABLE project_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

-- TABLE PROJECTS
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
    published_at TIMESTAMP NULL,
    CONSTRAINT chk_budget_range CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_min <= budget_max),
    CONSTRAINT chk_deadline_reasonable CHECK (deadline IS NULL OR deadline >= CURRENT_DATE - INTERVAL '1 day')
);

-- TABLE PROJECT_SKILLS
CREATE TABLE project_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE
);

-- TABLE APPLICATIONS
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    freelance_id UUID NOT NULL REFERENCES freelances(id) ON DELETE CASCADE,
    proposed_rate DECIMAL(10,2),
    cover_letter TEXT,
    status application_status_enum DEFAULT 'submitted',
    submission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    response_date TIMESTAMP NULL,
    CONSTRAINT chk_application_rate CHECK (proposed_rate IS NULL OR proposed_rate > 0),
    CONSTRAINT chk_application_response_date CHECK (response_date IS NULL OR response_date >= submission_date),
    CONSTRAINT unique_application_per_project UNIQUE (project_id, freelance_id)
);

-- TABLE CONTRACTS
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    freelance_id UUID NOT NULL REFERENCES freelances(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    payment_mode payment_mode_enum NOT NULL,
    total_amount DECIMAL(12,2),
    tjm DECIMAL(10,2),
    estimated_days INTEGER,
    terms TEXT,
    start_date DATE,
    end_date DATE,
    status contract_status_enum DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_contract_dates CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date),
    CONSTRAINT chk_fixed_price_amount CHECK (payment_mode != 'fixed_price' OR total_amount IS NOT NULL),
    CONSTRAINT chk_daily_rate_tjm CHECK (payment_mode != 'daily_rate' OR (tjm IS NOT NULL AND estimated_days IS NOT NULL)),
    CONSTRAINT chk_milestone_deliverables CHECK (payment_mode != 'by_milestone' OR total_amount IS NOT NULL)
);

-- TABLE EVALUATIONS
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    evaluator_id UUID NOT NULL,
    evaluated_id UUID NOT NULL,
    evaluator_type user_type_enum NOT NULL,
    evaluated_type user_type_enum NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    CONSTRAINT unique_evaluation_per_contract UNIQUE (contract_id, evaluator_id, evaluator_type)
);

-- TABLE DELIVERABLES
CREATE TABLE deliverables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status deliverable_status_enum DEFAULT 'planned',
    is_milestone BOOLEAN DEFAULT FALSE,
    amount DECIMAL(12,2) DEFAULT 0,
    due_date DATE,
    submitted_at TIMESTAMP NULL,
    validated_at TIMESTAMP NULL,
    feedback TEXT,
    "order" INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    CONSTRAINT chk_deliverable_order CHECK ("order" IS NULL OR "order" > 0),
    CONSTRAINT chk_deliverable_dates CHECK (submitted_at IS NULL OR validated_at IS NULL OR submitted_at <= validated_at),
    CONSTRAINT chk_deliverable_milestone_amount CHECK (NOT is_milestone OR amount > 0)
);

-- TABLE DELIVERABLE_MEDIA
CREATE TABLE deliverable_media (
    deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (deliverable_id, media_id)
);

-- TABLE INVOICES
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
    file_path VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_invoice_dates CHECK (issue_date IS NULL OR due_date IS NULL OR issue_date <= due_date),
    CONSTRAINT chk_invoice_number_format CHECK (LENGTH(invoice_number) >= 3)
);

-- TABLE PAYMENTS
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    deliverable_id UUID REFERENCES deliverables(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    platform_fee DECIMAL(12,2) DEFAULT 0 CHECK (platform_fee >= 0),
    status payment_status_enum DEFAULT 'pending',
    transaction_date TIMESTAMP,
    type payment_type_enum NOT NULL,
    transaction_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_payment_transaction_id CHECK (transaction_id IS NULL OR LENGTH(transaction_id) >= 5)
);

-- TABLE WORK_DAYS
CREATE TABLE work_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
    freelance_id UUID NOT NULL REFERENCES freelances(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    description TEXT NOT NULL,
    status work_day_status_enum DEFAULT 'draft',
    tjm_applied DECIMAL(10,2),
    amount DECIMAL(12,2) GENERATED ALWAYS AS (COALESCE(tjm_applied, 0)) STORED,
    submitted_at TIMESTAMP NULL,
    validated_at TIMESTAMP NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    CONSTRAINT unique_work_day_per_deliverable UNIQUE (deliverable_id, work_date),
    CONSTRAINT chk_work_day_description CHECK (LENGTH(description) >= 10),
    CONSTRAINT chk_work_day_tjm CHECK (tjm_applied IS NULL OR tjm_applied > 0)
);

-- TABLE NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type notification_type_enum,
    is_global BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

-- TABLE USER_NOTIFICATIONS
CREATE TABLE user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    UNIQUE (user_id, notification_id)
);

-- TABLE CONVERSATIONS
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    freelance_id UUID NOT NULL REFERENCES freelances(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    CONSTRAINT unique_freelance_company_conversation UNIQUE (freelance_id, company_id)
);

-- TABLE MESSAGES
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    content TEXT,
    type_message message_type_enum DEFAULT 'text',
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL
);

-- TABLE MESSAGE_MEDIA
CREATE TABLE message_media (
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (message_id, media_id)
);

-- TABLE PROJECT_INVITATIONS
CREATE TABLE project_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    freelance_id UUID NOT NULL REFERENCES freelances(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    message TEXT,
    status invitation_status_enum DEFAULT 'sent',
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    CONSTRAINT chk_invitation_dates CHECK (responded_at IS NULL OR responded_at >= sent_at),
    CONSTRAINT chk_invitation_expiry CHECK (expires_at IS NULL OR expires_at > sent_at),
    CONSTRAINT unique_project_freelance_invitation UNIQUE (project_id, freelance_id)
);

-- TABLE LITIGATIONS
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

-- TABLE REPORTS
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
-- INDEX SUR TOUTES LES TABLES
-- =============================================

-- Index freelances
CREATE INDEX idx_freelances_email ON freelances(email);
CREATE INDEX idx_freelances_job_title ON freelances(job_title);
CREATE INDEX idx_freelances_availability ON freelances(availability);
CREATE INDEX idx_freelances_experience ON freelances(experience);
CREATE INDEX idx_freelances_country ON freelances(country);
CREATE INDEX idx_freelances_deleted_at ON freelances(deleted_at);

-- Index companies
CREATE INDEX idx_companies_company_email ON companies(company_email);
CREATE INDEX idx_companies_company_name ON companies(company_name);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_company_size ON companies(company_size);
CREATE INDEX idx_companies_is_certified ON companies(is_certified);
CREATE INDEX idx_companies_is_verified ON companies(is_verified);
CREATE INDEX idx_companies_country ON companies(country);
CREATE INDEX idx_companies_deleted_at ON companies(deleted_at);

-- Index admins
CREATE INDEX idx_admins_username ON admins(username);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_level ON admins(level);

-- Index user_sessions
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_is_active ON user_sessions(is_active);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_sessions_ip_address ON user_sessions(ip_address);
CREATE INDEX idx_sessions_last_activity_at ON user_sessions(last_activity_at);
CREATE INDEX idx_sessions_created_at ON user_sessions(created_at);

-- Index admin_sessions
CREATE INDEX idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX idx_admin_sessions_is_active ON admin_sessions(is_active);
CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX idx_admin_sessions_ip_address ON admin_sessions(ip_address);
CREATE INDEX idx_admin_sessions_last_activity_at ON admin_sessions(last_activity_at);
CREATE INDEX idx_admin_sessions_created_at ON admin_sessions(created_at);

-- Index otps
CREATE INDEX idx_otps_email ON otps(email);
CREATE INDEX idx_otps_code ON otps(code);
CREATE INDEX idx_otps_type ON otps(type);
CREATE INDEX idx_otps_expires_at ON otps(expires_at);
CREATE INDEX idx_otps_used_at ON otps(used_at);
CREATE INDEX idx_otps_created_at ON otps(created_at);

-- Index category_skills
CREATE INDEX idx_category_skills_name ON category_skills(name);
CREATE INDEX idx_category_skills_slug ON category_skills(slug);
CREATE INDEX idx_category_skills_created_at ON category_skills(created_at);

-- Index skills
CREATE INDEX idx_skills_name ON skills(name);
CREATE INDEX idx_skills_category_id ON skills(category_id);

-- Index freelance_skills
CREATE INDEX idx_freelance_skills_freelance_id ON freelance_skills(freelance_id);
CREATE INDEX idx_freelance_skills_skill_id ON freelance_skills(skill_id);
CREATE INDEX idx_freelance_skills_level ON freelance_skills(level);
CREATE INDEX idx_freelance_skills_created_at ON freelance_skills(created_at);

-- Index media
CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX idx_media_type ON media(type);
CREATE INDEX idx_media_uploaded_at ON media(uploaded_at);

-- Index project_categories
CREATE INDEX idx_project_categories_is_active ON project_categories(is_active);
CREATE INDEX idx_project_categories_created_at ON project_categories(created_at);

-- Index projects
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_projects_category_id ON projects(category_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_deadline ON projects(deadline);
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_projects_published_at ON projects(published_at);
CREATE INDEX idx_projects_level_experience ON projects(level_experience);

-- Index project_skills
CREATE INDEX idx_project_skills_project_id ON project_skills(project_id);
CREATE INDEX idx_project_skills_skill_id ON project_skills(skill_id);

-- Index applications
CREATE INDEX idx_applications_project_id ON applications(project_id);
CREATE INDEX idx_applications_freelance_id ON applications(freelance_id);
CREATE INDEX idx_applications_status ON applications(status);

-- Index contracts
CREATE INDEX idx_contracts_project_id ON contracts(project_id);
CREATE INDEX idx_contracts_freelance_id ON contracts(freelance_id);
CREATE INDEX idx_contracts_company_id ON contracts(company_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_start_date ON contracts(start_date);
CREATE INDEX idx_contracts_end_date ON contracts(end_date);
CREATE INDEX idx_contracts_created_at ON contracts(created_at);
CREATE INDEX idx_contracts_application_id ON contracts(application_id);
CREATE INDEX idx_contracts_payment_mode ON contracts(payment_mode);
CREATE INDEX idx_contracts_tjm ON contracts(tjm);
CREATE INDEX idx_contracts_estimated_days ON contracts(estimated_days);

-- Index evaluations
CREATE INDEX idx_evaluations_contract_id ON evaluations(contract_id);
CREATE INDEX idx_evaluations_evaluator_id ON evaluations(evaluator_id);
CREATE INDEX idx_evaluations_evaluated_id ON evaluations(evaluated_id);
CREATE INDEX idx_evaluations_evaluated_type ON evaluations(evaluated_type);
CREATE INDEX idx_evaluations_evaluator_type ON evaluations(evaluator_type);
CREATE INDEX idx_evaluations_rating ON evaluations(rating);
CREATE INDEX idx_evaluations_created_at ON evaluations(created_at);

-- Index deliverables
CREATE INDEX idx_deliverables_contract_id ON deliverables(contract_id);
CREATE INDEX idx_deliverables_status ON deliverables(status);
CREATE INDEX idx_deliverables_due_date ON deliverables(due_date);
CREATE INDEX idx_deliverables_is_milestone ON deliverables(is_milestone);

-- Index deliverable_media
CREATE INDEX idx_deliverable_media_deliverable_id ON deliverable_media(deliverable_id);
CREATE INDEX idx_deliverable_media_media_id ON deliverable_media(media_id);
CREATE INDEX idx_deliverable_media_deleted_at ON deliverable_media(deleted_at);

-- Index invoices
CREATE INDEX idx_invoices_contract_id ON invoices(contract_id);
CREATE INDEX idx_invoices_deliverable_id ON invoices(deliverable_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
CREATE UNIQUE INDEX idx_invoices_invoice_number ON invoices(invoice_number);

-- Index payments
CREATE INDEX idx_payments_contract_id ON payments(contract_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_type ON payments(type);
CREATE INDEX idx_payments_deliverable_id ON payments(deliverable_id);
CREATE INDEX idx_payments_transaction_date ON payments(transaction_date);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);

-- Index work_days
CREATE INDEX idx_work_days_deliverable_id ON work_days(deliverable_id);
CREATE INDEX idx_work_days_freelance_id ON work_days(freelance_id);
CREATE INDEX idx_work_days_work_date ON work_days(work_date);
CREATE INDEX idx_work_days_status ON work_days(status);
CREATE INDEX idx_work_days_submitted_at ON work_days(submitted_at);

-- Index notifications
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_global ON notifications(is_global);

-- Index user_notifications
CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_notification_id ON user_notifications(notification_id);
CREATE INDEX idx_user_notifications_is_read ON user_notifications(is_read);

-- Index conversations
CREATE INDEX idx_conversations_freelance_id ON conversations(freelance_id);
CREATE INDEX idx_conversations_company_id ON conversations(company_id);
CREATE INDEX idx_conversations_application_id ON conversations(application_id);
CREATE INDEX idx_conversations_contract_id ON conversations(contract_id);

-- Index messages
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_project_id ON messages(project_id);
CREATE INDEX idx_messages_reply_to_message_id ON messages(reply_to_message_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_type_message ON messages(type_message);
CREATE INDEX idx_messages_is_read ON messages(is_read);
CREATE INDEX idx_messages_deleted_at ON messages(deleted_at);

-- Index message_media
CREATE INDEX idx_message_media_message_id ON message_media(message_id);
CREATE INDEX idx_message_media_media_id ON message_media(media_id);
CREATE INDEX idx_message_media_deleted_at ON message_media(deleted_at);

-- Index project_invitations
CREATE INDEX idx_project_invitations_project_id ON project_invitations(project_id);
CREATE INDEX idx_project_invitations_freelance_id ON project_invitations(freelance_id);
CREATE INDEX idx_project_invitations_company_id ON project_invitations(company_id);
CREATE INDEX idx_project_invitations_status ON project_invitations(status);

-- Index litigations
CREATE INDEX idx_litigations_contract_id ON litigations(contract_id);
CREATE INDEX idx_litigations_admin_id ON litigations(admin_id);
CREATE INDEX idx_litigations_status ON litigations(status);
CREATE INDEX idx_litigations_declarant_id ON litigations(declarant_id);
CREATE INDEX idx_litigations_priority ON litigations(priority);
CREATE INDEX idx_litigations_resolved_at ON litigations(resolved_at);

-- Index reports
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX idx_reports_admin_id ON reports(admin_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reason ON reports(reason);
CREATE INDEX idx_reports_reviewed_at ON reports(reviewed_at);

-- =============================================
-- FONCTIONS UTILITAIRES
-- =============================================

-- Fonction générique pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
-- VUES
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
HAVING COUNT(DISTINCT s.ip_address) > 3
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
HAVING COUNT(DISTINCT s.ip_address) > 2
ORDER BY different_ips DESC;

-- Vues de moyenne des notes
CREATE VIEW freelance_average_rating AS
SELECT
    evaluated_id AS freelance_id,
    AVG(rating) AS average_rating,
    COUNT(*) AS total_evaluations
FROM evaluations
WHERE evaluated_type = 'freelance'
GROUP BY evaluated_id;

CREATE VIEW company_average_rating AS
SELECT
    evaluated_id AS company_id,
    AVG(rating) AS average_rating,
    COUNT(*) AS total_evaluations
FROM evaluations
WHERE evaluated_type = 'company'
GROUP BY evaluated_id;

-- Vue simple des contrats avec paiements
CREATE VIEW contract_summary AS
SELECT
    c.id as contract_id,
    c.project_id,
    c.freelance_id,
    c.company_id,
    c.payment_mode,
    c.total_amount,
    c.tjm,
    c.estimated_days,
    c.status as contract_status,
    COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as amount_paid,
    COUNT(p.id) as payment_count,
    COUNT(wd.id) as days_worked,
    COUNT(CASE WHEN wd.status = 'validated' THEN wd.id END) as days_validated
FROM contracts c
LEFT JOIN payments p ON c.id = p.contract_id
LEFT JOIN deliverables d ON c.id = d.contract_id
LEFT JOIN work_days wd ON d.id = wd.deliverable_id
GROUP BY c.id, c.project_id, c.freelance_id, c.company_id, c.payment_mode, c.total_amount, c.tjm, c.estimated_days, c.status;

-- Vue des deliverables avec leurs jours travaillés
CREATE VIEW deliverable_work_summary AS
SELECT
    d.id as deliverable_id,
    d.contract_id,
    d.title,
    d.description,
    d.status as deliverable_status,
    d.is_milestone,
    d.amount as deliverable_amount,
    d.due_date,
    d.submitted_at,
    d.validated_at,
    d."order",
    COUNT(wd.id) as total_work_days,
    COUNT(CASE WHEN wd.status = 'validated' THEN wd.id END) as validated_work_days,
    COUNT(CASE WHEN wd.status = 'submitted' THEN wd.id END) as pending_work_days,
    COALESCE(SUM(CASE WHEN wd.status = 'validated' THEN wd.tjm_applied ELSE 0 END), 0) as validated_amount,
    COALESCE(SUM(wd.tjm_applied), 0) as total_work_amount,
    MIN(wd.work_date) as first_work_date,
    MAX(wd.work_date) as last_work_date,
    CASE
        WHEN d.is_milestone = true AND d.status = 'validated' THEN 'ready_for_payment'
        WHEN d.is_milestone = true AND d.status = 'submitted' THEN 'awaiting_validation'
        WHEN d.is_milestone = false THEN 'tracking_only'
        ELSE 'in_progress'
    END as payment_status
FROM deliverables d
LEFT JOIN work_days wd ON d.id = wd.deliverable_id
GROUP BY d.id, d.contract_id, d.title, d.description, d.status, d.is_milestone,
         d.amount, d.due_date, d.submitted_at, d.validated_at, d."order";

-- =============================================
-- TRIGGERS
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

CREATE TRIGGER update_deliverables_updated_at
    BEFORE UPDATE ON deliverables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_days_updated_at
    BEFORE UPDATE ON work_days
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- POLITIQUES DE SÉCURITÉ RLS
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
COMMENT ON TABLE deliverables IS 'Livrables attendus dans le cadre dun contrat - peuvent être des milestones (avec paiement) ou juste du suivi';
COMMENT ON COLUMN deliverables.is_milestone IS 'Si true, déclenche un paiement. Si false, juste pour organisation/suivi';
COMMENT ON TABLE work_days IS 'Jours de travail associés à un livrable spécifique - servent de preuve du travail effectué';
COMMENT ON COLUMN deliverables.amount IS 'Montant associé au livrable pour les paiements par milestone';
COMMENT ON COLUMN deliverables.due_date IS 'Date d échéance prévue pour ce livrable';
COMMENT ON TABLE deliverable_media IS 'Fichiers associés à chaque livrable';
COMMENT ON TABLE invoices IS 'Factures générées pour les paiements des contrats';
COMMENT ON COLUMN invoices.invoice_number IS 'Numéro de facture unique';
COMMENT ON TABLE payments IS 'Historique des paiements effectués';
COMMENT ON TABLE notifications IS 'Notifications envoyées aux utilisateurs';
COMMENT ON TABLE messages IS 'Messages échangés entre freelances et entreprises avec types';
COMMENT ON COLUMN messages.type_message IS 'Type du message (text, media, system)';
COMMENT ON TABLE message_media IS 'Fichiers attachés aux messages';
COMMENT ON TABLE project_invitations IS 'Invitations envoyées aux freelances pour postuler à un projet';
COMMENT ON TABLE litigations IS 'Litiges ouverts entre freelances et entreprises';
COMMENT ON TABLE reports IS 'Signalements faits par les utilisateurs contre d''autres utilisateurs';
COMMENT ON TABLE notifications IS 'Notifications globales ou ciblées (message, type, is_global)';
COMMENT ON TABLE user_notifications IS 'Lien entre utilisateur et notification (ciblage, lu/non lu)';
