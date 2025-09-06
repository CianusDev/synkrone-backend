import { db } from "../../config/database";

/**
 * Supprime toutes les tables, types ENUM, fonctions et vues de la base de données PostgreSQL
 * Utilise CASCADE pour gérer les dépendances
 */
const DROP_QUERIES = `
  -- Supprimer toutes les tables (ordre inverse des dépendances)
  DROP TABLE IF EXISTS deliverable_media CASCADE;
  DROP TABLE IF EXISTS message_media CASCADE;
  DROP TABLE IF EXISTS freelance_skills CASCADE;
  DROP TABLE IF EXISTS project_skills CASCADE;
  DROP TABLE IF EXISTS applications CASCADE;
  DROP TABLE IF EXISTS contracts CASCADE;
  DROP TABLE IF EXISTS deliverables CASCADE;
  DROP TABLE IF EXISTS invoices CASCADE;
  DROP TABLE IF EXISTS payments CASCADE;
  DROP TABLE IF EXISTS notifications CASCADE;
  DROP TABLE IF EXISTS user_notifications CASCADE;
  DROP TABLE IF EXISTS messages CASCADE;
  DROP TABLE IF EXISTS project_invitations CASCADE;
  DROP TABLE IF EXISTS litigations CASCADE;
  DROP TABLE IF EXISTS reports CASCADE;
  DROP TABLE IF EXISTS projects CASCADE;
  DROP TABLE IF EXISTS project_categories CASCADE;
  DROP TABLE IF EXISTS media CASCADE;
  DROP TABLE IF EXISTS skills CASCADE;
  DROP TABLE IF EXISTS category_skills CASCADE;
  DROP TABLE IF EXISTS otps CASCADE;
  DROP TABLE IF EXISTS user_sessions CASCADE;
  DROP TABLE IF EXISTS admin_sessions CASCADE;
  DROP TABLE IF EXISTS admins CASCADE;
  DROP TABLE IF EXISTS companies CASCADE;
  DROP TABLE IF EXISTS freelances CASCADE;

  -- Supprimer les types ENUM
  DROP TYPE IF EXISTS report_status_enum CASCADE;
  DROP TYPE IF EXISTS litigation_status_enum CASCADE;
  DROP TYPE IF EXISTS invitation_status_enum CASCADE;
  DROP TYPE IF EXISTS notification_type_enum CASCADE;
  DROP TYPE IF EXISTS payment_type_enum CASCADE;
  DROP TYPE IF EXISTS payment_status_enum CASCADE;
  DROP TYPE IF EXISTS invoice_status_enum CASCADE;
  DROP TYPE IF EXISTS deliverable_status_enum CASCADE;
  DROP TYPE IF EXISTS payment_mode_enum CASCADE;
  DROP TYPE IF EXISTS contract_status_enum CASCADE;
  DROP TYPE IF EXISTS application_status_enum CASCADE;
  DROP TYPE IF EXISTS project_status_enum CASCADE;
  DROP TYPE IF EXISTS type_media_enum CASCADE;
  DROP TYPE IF EXISTS type_work_enum CASCADE;
  DROP TYPE IF EXISTS otp_type_enum CASCADE;
  DROP TYPE IF EXISTS admin_level_enum CASCADE;
  DROP TYPE IF EXISTS company_size_enum CASCADE;
  DROP TYPE IF EXISTS availability_enum CASCADE;
  DROP TYPE IF EXISTS experience_level_enum CASCADE;

  -- Supprimer les fonctions
  DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
  DROP FUNCTION IF EXISTS is_freelance_blocked(UUID) CASCADE;
  DROP FUNCTION IF EXISTS is_company_blocked(UUID) CASCADE;
  DROP FUNCTION IF EXISTS cleanup_expired_sessions() CASCADE;
  DROP FUNCTION IF EXISTS cleanup_expired_admin_sessions() CASCADE;
  DROP FUNCTION IF EXISTS cleanup_expired_otps() CASCADE;
  DROP FUNCTION IF EXISTS admin_revoke_session(UUID) CASCADE;
  DROP FUNCTION IF EXISTS admin_revoke_admin_session(UUID) CASCADE;
  DROP FUNCTION IF EXISTS admin_revoke_user_sessions(UUID) CASCADE;
  DROP FUNCTION IF EXISTS admin_revoke_admin_sessions(UUID) CASCADE;
  DROP FUNCTION IF EXISTS admin_block_freelance(UUID, INTEGER) CASCADE;
  DROP FUNCTION IF EXISTS admin_block_company(UUID, INTEGER) CASCADE;

  -- Supprimer les vues
  DROP VIEW IF EXISTS admin_suspicious_admin_activity CASCADE;
  DROP VIEW IF EXISTS admin_suspicious_activity CASCADE;
  DROP VIEW IF EXISTS admin_admin_session_stats CASCADE;
  DROP VIEW IF EXISTS admin_session_stats CASCADE;
  DROP VIEW IF EXISTS admin_admin_sessions CASCADE;
  DROP VIEW IF EXISTS admin_user_sessions CASCADE;
  DROP VIEW IF EXISTS available_freelances CASCADE;
  DROP VIEW IF EXISTS active_companies CASCADE;
  DROP VIEW IF EXISTS active_freelances CASCADE;
`;

async function dropAllDatabaseObjects(): Promise<void> {
  const client = await db.connect();
  try {
    console.log(
      "⚠️  Suppression de toutes les tables, types, fonctions et vues...",
    );
    // Désactive les contraintes de clé étrangère temporairement
    await client.query("SET session_replication_role = replica;");

    // Exécute toutes les requêtes DROP
    await client.query(DROP_QUERIES);

    // Réactive les contraintes
    await client.query("SET session_replication_role = DEFAULT;");

    console.log(
      "✅ Toutes les tables, types, fonctions et vues ont été supprimés avec succès !",
    );
  } catch (error) {
    console.error("❌ Erreur lors de la suppression :", error);
    throw error;
  } finally {
    client.release();
    await db.end();
  }
}

if (require.main === module) {
  dropAllDatabaseObjects()
    .then(() => {
      console.log("🎉 Opération terminée !");
      process.exit(0);
    })
    .catch((err) => {
      console.error("💥 Échec de l'opération :", err);
      process.exit(1);
    });
}

export { dropAllDatabaseObjects };
