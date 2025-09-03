-- Statuts projets
CREATE TYPE project_status_enum AS ENUM ('draft', 'published', 'is_pending');
-- Statuts candidatures
CREATE TYPE application_status_enum AS ENUM ('submitted', 'under_review', 'accepted', 'rejected', 'withdrawn');
-- Statuts contrats
CREATE TYPE contract_status_enum AS ENUM ('draft', 'active', 'completed', 'cancelled', 'suspended');
-- Statuts livrables
CREATE TYPE deliverable_status_enum AS ENUM ('planned', 'in_progress', 'submitted', 'validated', 'rejected', 'correction_requested');
-- Statuts paiements
CREATE TYPE payment_status_enum AS ENUM ('blocked', 'pending', 'completed', 'failed', 'refunded');
-- Modes paiement
CREATE TYPE payment_mode_enum AS ENUM ('by_milestone', 'final_payment');
-- Types paiement
CREATE TYPE payment_type_enum AS ENUM ('milestone', 'final', 'deposit', 'commission');
-- Statuts factures
CREATE TYPE invoice_status_enum AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
-- Statuts invitations
CREATE TYPE invitation_status_enum AS ENUM ('sent', 'viewed', 'accepted', 'declined', 'expired');
-- Types notifications
CREATE TYPE notification_type_enum AS ENUM ('project', 'application', 'payment', 'message', 'system');
-- Statuts litiges
CREATE TYPE litigation_status_enum AS ENUM ('open', 'in_review', 'resolved', 'closed');
-- Statuts signalements
CREATE TYPE report_status_enum AS ENUM ('submitted', 'in_review', 'resolved', 'dismissed');



CREATE TABLE project_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);


CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    budget DECIMAL(12,2),
    deadline DATE,
    status project_status_enum DEFAULT 'draft',
    type_work VARCHAR(50),
    category_id UUID REFERENCES project_categories(id) ON DELETE SET NULL,
    enterprise_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);
