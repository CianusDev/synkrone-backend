-- =============================================
-- MISE À JOUR SCHEMA DELIVERABLES - SYNKRONE BACKEND
-- Ajout des champs amount et due_date + améliorations
-- =============================================

BEGIN;

-- Ajouter les nouveaux champs à la table deliverables
ALTER TABLE deliverables
ADD COLUMN IF NOT EXISTS amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS due_date DATE;

-- Ajouter les champs de timestamp s'ils n'existent pas déjà
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'deliverables' AND column_name = 'created_at') THEN
        ALTER TABLE deliverables ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'deliverables' AND column_name = 'updated_at') THEN
        ALTER TABLE deliverables ADD COLUMN updated_at TIMESTAMP NULL;
    END IF;
END $$;

-- Ajouter des index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_deliverables_due_date ON deliverables(due_date);
CREATE INDEX IF NOT EXISTS idx_deliverables_amount ON deliverables(amount);
CREATE INDEX IF NOT EXISTS idx_deliverables_is_milestone_amount ON deliverables(is_milestone, amount);

-- Ajouter des contraintes de validation
ALTER TABLE deliverables
ADD CONSTRAINT IF NOT EXISTS chk_deliverables_amount_positive
CHECK (amount >= 0);

-- Ajouter les commentaires sur les colonnes
COMMENT ON COLUMN deliverables.amount IS 'Montant associé au livrable pour les paiements par milestone';
COMMENT ON COLUMN deliverables.due_date IS 'Date d échéance prévue pour ce livrable';

-- Ajouter le trigger pour updated_at si il n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_deliverables_updated_at') THEN
        CREATE TRIGGER update_deliverables_updated_at
            BEFORE UPDATE ON deliverables
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Mettre à jour les livrables existants avec des valeurs par défaut
UPDATE deliverables
SET amount = 0
WHERE amount IS NULL;

-- Fonction utilitaire pour valider les montants des livrables d'un contrat
CREATE OR REPLACE FUNCTION validate_deliverables_amount(contract_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    contract_agreed_rate DECIMAL(12,2);
    total_deliverables_amount DECIMAL(12,2);
BEGIN
    -- Récupérer le montant convenu du contrat
    SELECT agreed_rate INTO contract_agreed_rate
    FROM contracts
    WHERE id = contract_uuid;

    -- Calculer la somme des montants des livrables
    SELECT COALESCE(SUM(amount), 0) INTO total_deliverables_amount
    FROM deliverables
    WHERE contract_id = contract_uuid;

    -- Retourner vrai si la somme ne dépasse pas le montant convenu
    RETURN total_deliverables_amount <= COALESCE(contract_agreed_rate, 0);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les livrables en retard
CREATE OR REPLACE FUNCTION get_overdue_deliverables()
RETURNS TABLE (
    deliverable_id UUID,
    contract_id UUID,
    title VARCHAR(200),
    due_date DATE,
    days_overdue INTEGER,
    freelance_id UUID,
    company_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id as deliverable_id,
        d.contract_id,
        d.title,
        d.due_date,
        (CURRENT_DATE - d.due_date)::INTEGER as days_overdue,
        c.freelance_id,
        c.company_id
    FROM deliverables d
    JOIN contracts c ON d.contract_id = c.id
    WHERE d.due_date < CURRENT_DATE
    AND d.status NOT IN ('validated', 'cancelled')
    ORDER BY d.due_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Vue pour les statistiques des livrables par contrat
CREATE OR REPLACE VIEW deliverables_contract_stats AS
SELECT
    contract_id,
    COUNT(*) as total_deliverables,
    COUNT(*) FILTER (WHERE is_milestone = true) as milestones_count,
    SUM(amount) as total_amount,
    SUM(amount) FILTER (WHERE is_milestone = true) as milestones_amount,
    COUNT(*) FILTER (WHERE status = 'validated') as completed_count,
    COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('validated', 'cancelled')) as overdue_count,
    AVG(amount) as average_amount,
    MIN(due_date) as earliest_due_date,
    MAX(due_date) as latest_due_date
FROM deliverables
GROUP BY contract_id;

-- Commentaires sur les nouvelles fonctions et vues
COMMENT ON FUNCTION validate_deliverables_amount(UUID) IS 'Valide que la somme des montants des livrables ne dépasse pas le montant convenu du contrat';
COMMENT ON FUNCTION get_overdue_deliverables() IS 'Retourne la liste des livrables en retard avec informations associées';
COMMENT ON VIEW deliverables_contract_stats IS 'Statistiques agrégées des livrables par contrat incluant montants et échéances';

COMMIT;

-- Vérification post-migration
SELECT
    COUNT(*) as total_deliverables,
    COUNT(amount) as deliverables_with_amount,
    COUNT(due_date) as deliverables_with_due_date,
    ROUND(AVG(amount), 2) as average_amount,
    COUNT(*) FILTER (WHERE amount > 0) as deliverables_with_positive_amount
FROM deliverables;

-- Afficher la structure mise à jour
\d deliverables;

-- Test de la nouvelle fonction de validation
-- SELECT validate_deliverables_amount('your-contract-uuid-here');

-- Test de la fonction des livrables en retard
-- SELECT * FROM get_overdue_deliverables() LIMIT 5;

-- Test de la vue des statistiques
-- SELECT * FROM deliverables_contract_stats LIMIT 5;
