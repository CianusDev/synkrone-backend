import { db, query } from "../../config/database";
import fs from "fs";
import path from "path";

/**
 * Parse le SQL PostgreSQL en respectant les délimiteurs $$ pour les fonctions
 * et les délimiteurs spéciaux -- DELIMITER //
 */
function parsePostgreSQLBlocks(sqlContent: string): string[] {
  const blocks: string[] = [];
  let currentBlock = "";
  let insideDollarQuotes = false;
  let dollarQuoteTag = "";

  // Nettoyer le contenu en supprimant les commentaires de ligne d'abord
  const cleanedLines = sqlContent
    .split("\n")
    .map((line) => {
      // Supprimer les commentaires de ligne mais pas ceux dans les chaînes
      const commentIndex = line.indexOf("--");
      if (commentIndex !== -1) {
        // Vérifier si le commentaire est dans une chaîne (approximation simple)
        const beforeComment = line.substring(0, commentIndex);
        const singleQuotes = (beforeComment.match(/'/g) || []).length;
        const doubleQuotes = (beforeComment.match(/"/g) || []).length;

        // Si nombre impair de guillemets, le commentaire est probablement dans une chaîne
        if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0) {
          return beforeComment.trim();
        }
      }
      return line;
    })
    .filter((line) => line.trim().length > 0);

  let i = 0;
  while (i < cleanedLines.length) {
    const line = cleanedLines[i];
    const trimmedLine = line.trim();

    // Détecter les délimiteurs spéciaux
    if (trimmedLine.includes("-- DELIMITER //")) {
      // Terminer le bloc courant s'il n'est pas vide
      if (currentBlock.trim()) {
        blocks.push(currentBlock.trim());
        currentBlock = "";
      }
      i++;
      continue;
    }

    // Ignorer les lignes vides
    if (!trimmedLine) {
      i++;
      continue;
    }

    // Détecter le début d'un bloc dollar-quoted
    if (!insideDollarQuotes) {
      const dollarMatch = line.match(/\$([a-zA-Z_]*)\$/);
      if (dollarMatch) {
        insideDollarQuotes = true;
        dollarQuoteTag = dollarMatch[0];
      }
    }

    currentBlock += line + "\n";

    // Détecter la fin d'un bloc dollar-quoted
    if (insideDollarQuotes && line.includes(dollarQuoteTag)) {
      // Chercher la deuxième occurrence du tag
      const firstIndex = line.indexOf(dollarQuoteTag);
      const secondIndex = line.indexOf(dollarQuoteTag, firstIndex + 1);
      if (secondIndex !== -1) {
        insideDollarQuotes = false;
        dollarQuoteTag = "";

        // Si c'est une fonction qui se termine par un ;, on force la séparation
        if (
          line.trim().endsWith(";") &&
          currentBlock.includes("CREATE OR REPLACE FUNCTION")
        ) {
          const block = currentBlock.trim();
          if (block && !block.startsWith("--")) {
            blocks.push(block);
          }
          currentBlock = "";
          i++;
          continue;
        }
      }
    }

    // Si on n'est pas dans un bloc dollar-quoted et qu'on trouve un ;
    if (!insideDollarQuotes && line.includes(";")) {
      const block = currentBlock.trim();
      if (block && !block.startsWith("--")) {
        blocks.push(block);
      }
      currentBlock = "";
    }

    i++;
  }

  // Ajouter le dernier bloc s'il existe
  if (currentBlock.trim()) {
    const block = currentBlock.trim();
    if (!block.startsWith("--")) {
      blocks.push(block);
    }
  }

  return blocks.filter((block) => block.length > 0);
}

/**
 * Trie les blocs SQL par ordre de priorité pour éviter les erreurs de dépendances
 */
function sortSQLBlocks(blocks: string[]): string[] {
  const sortedBlocks: string[] = [];

  // Séparer les blocs par type pour un meilleur contrôle
  const extensions = blocks.filter((block) => /^CREATE EXTENSION/i.test(block));
  const types = blocks.filter((block) => /^CREATE TYPE.*AS ENUM/i.test(block));
  const tables = blocks.filter((block) => /^CREATE TABLE/i.test(block));
  const indexes = blocks.filter((block) => /^CREATE INDEX/i.test(block));
  const functions = blocks.filter((block) =>
    /^CREATE OR REPLACE FUNCTION(?!.*trigger)/i.test(block),
  );
  const triggerFunctions = blocks.filter((block) =>
    /^CREATE OR REPLACE FUNCTION.*trigger/i.test(block),
  );
  const triggers = blocks.filter((block) => /^CREATE TRIGGER/i.test(block));
  const views = blocks.filter((block) => /^CREATE VIEW/i.test(block));
  const alterTables = blocks.filter((block) => /^ALTER TABLE/i.test(block));
  const policies = blocks.filter((block) => /^CREATE POLICY/i.test(block));
  const comments = blocks.filter((block) => /^COMMENT ON/i.test(block));
  const inserts = blocks.filter((block) => /^INSERT INTO/i.test(block));

  // Assembler dans l'ordre correct
  sortedBlocks.push(...extensions);
  sortedBlocks.push(...types);
  sortedBlocks.push(...tables);
  sortedBlocks.push(...indexes);
  sortedBlocks.push(...functions);
  sortedBlocks.push(...triggerFunctions);
  sortedBlocks.push(...triggers);
  sortedBlocks.push(...views);
  sortedBlocks.push(...alterTables);
  sortedBlocks.push(...policies);
  sortedBlocks.push(...comments);
  sortedBlocks.push(...inserts);

  // Ajouter tous les blocs restants qui ne correspondent à aucune catégorie
  const usedBlocks = new Set(sortedBlocks);
  const remainingBlocks = blocks.filter((block) => !usedBlocks.has(block));
  sortedBlocks.push(...remainingBlocks);

  return sortedBlocks;
}

/**
 * Script d'initialisation de la base de données
 * Exécute le fichier database.sql pour créer toutes les tables, types, fonctions et vues
 */

async function initializeDatabase(): Promise<void> {
  const client = await db.connect();

  try {
    console.log("🚀 Début de l'initialisation de la base de données...");

    // Lire le fichier SQL
    const sqlFilePath = path.join(__dirname, "../../../database.sql");

    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(
        `Le fichier database.sql n'a pas été trouvé à l'emplacement: ${sqlFilePath}`,
      );
    }

    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

    console.log("📄 Fichier SQL lu avec succès");

    // Commencer une transaction
    await client.query("BEGIN");

    console.log("📦 Exécution du script SQL complet...");

    try {
      // Exécuter le script SQL complet en une fois
      await client.query(sqlContent);

      // Valider la transaction
      await client.query("COMMIT");

      console.log("✅ Base de données initialisée avec succès!");

      // Vérifier que les tables principales sont créées
      await verifyTables();
    } catch (error) {
      // Si l'exécution en bloc échoue, essayer bloc par bloc
      await client.query("ROLLBACK");
      console.log(
        "⚠️  L'exécution en bloc a échoué, tentative bloc par bloc...",
      );

      await executeBlockByBlock(client, sqlContent);
    }
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Erreur lors du rollback:", rollbackError);
    }
    console.error(
      "❌ Erreur lors de l'initialisation de la base de données:",
      error,
    );
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Exécute le SQL bloc par bloc en cas d'échec de l'exécution globale
 */
async function executeBlockByBlock(
  client: any,
  sqlContent: string,
): Promise<void> {
  console.log("🔄 Exécution bloc par bloc...");

  // Nettoyer et préparer le contenu SQL de manière plus intelligente
  let cleanedSQL = sqlContent
    .replace(/\/\*[\s\S]*?\*\//g, "") // Supprimer les commentaires de bloc
    .trim();

  // Diviser le contenu SQL en respectant les blocs de fonctions PostgreSQL
  const sqlBlocks = parsePostgreSQLBlocks(cleanedSQL);

  console.log(`📦 ${sqlBlocks.length} blocs SQL détectés`);

  // Filtrer les blocs vides ou qui ne contiennent que des commentaires
  const filteredBlocks = sqlBlocks.filter((block) => {
    const trimmedBlock = block.trim();
    return (
      trimmedBlock && !trimmedBlock.startsWith("--") && trimmedBlock.length > 0
    );
  });

  console.log(`📦 ${filteredBlocks.length} blocs SQL valides après filtrage`);

  // Trier les blocs SQL par ordre de priorité pour éviter les erreurs de dépendances
  const sortedBlocks = sortSQLBlocks(filteredBlocks);

  console.log(
    `📦 ${sortedBlocks.length} blocs SQL triés et prêts à être exécutés`,
  );

  // Nettoyer les objets existants problématiques avant de commencer
  await cleanupProblematicObjects(client);

  let successCount = 0;
  let skipCount = 0;

  for (let i = 0; i < sortedBlocks.length; i++) {
    const block = sortedBlocks[i];

    try {
      // Ignorer les commentaires et les blocs vides
      if (block.startsWith("--") || block.trim() === "") {
        skipCount++;
        continue;
      }

      // Gestion spéciale pour les objets qui peuvent déjà exister
      if (await shouldSkipExistingObject(client, block)) {
        console.log(`⏭️  Bloc ${i + 1} ignoré (objet existe déjà)`);
        skipCount++;
        continue;
      }

      // Exécuter le bloc SQL
      await client.query(block);
      successCount++;

      // Afficher le progrès
      if (successCount % 5 === 0 && successCount > 0) {
        console.log(
          `⏳ Progression: ${successCount}/${sortedBlocks.length - skipCount} blocs exécutés`,
        );
      }
    } catch (error: any) {
      const blockType = getBlockType(block);

      console.error(
        `❌ Erreur lors de l'exécution du bloc SQL (${blockType}):`,
      );
      console.error(`📍 Bloc ${i + 1}/${sortedBlocks.length}:`);
      console.error(
        `📄 SQL: ${block.substring(0, 300)}${block.length > 300 ? "..." : ""}`,
      );
      console.error(`🔍 Code d'erreur: ${error.code || "N/A"}`);
      console.error(`🔍 Message: ${error.message || "N/A"}`);

      // Gestion intelligente des erreurs
      if (await handleKnownErrors(client, error, block, blockType)) {
        console.log(`✅ Erreur gérée automatiquement`);
        successCount++;
      } else {
        console.error(`⚠️  Erreur critique détectée, mais on continue...`);
      }
    }
  }

  console.log("✅ Base de données initialisée avec succès (bloc par bloc)!");
  console.log(`📊 Statistiques:`);
  console.log(`   - Blocs exécutés: ${successCount}`);
  console.log(`   - Blocs ignorés: ${skipCount}`);
  console.log(`   - Total traité: ${successCount + skipCount}`);

  // Vérifier que les tables principales sont créées
  await verifyTables();
}

/**
 * Nettoie les objets problématiques avant l'initialisation
 */
async function cleanupProblematicObjects(client: any): Promise<void> {
  console.log("🧹 Nettoyage préventif des objets problématiques...");

  const cleanupQueries = [
    // Supprimer les types enum corrompus
    "DROP TYPE IF EXISTS message_type_enum CASCADE;",
    "DROP TYPE IF EXISTS work_day_status_enum CASCADE;",

    // Supprimer les tables qui peuvent causer des problèmes
    "DROP TABLE IF EXISTS messages CASCADE;",
    "DROP TABLE IF EXISTS message_media CASCADE;",
    "DROP TABLE IF EXISTS work_days CASCADE;",
  ];

  for (const query of cleanupQueries) {
    try {
      await client.query(query);
    } catch (error) {
      // Ignorer les erreurs de nettoyage
    }
  }

  console.log("✅ Nettoyage préventif terminé");
}

/**
 * Détermine le type de bloc SQL
 */
function getBlockType(block: string): string {
  if (block.includes("CREATE EXTENSION")) return "EXTENSION";
  if (block.includes("CREATE TYPE")) return "TYPE ENUM";
  if (block.includes("CREATE TABLE")) return "TABLE";
  if (block.includes("CREATE INDEX")) return "INDEX";
  if (block.includes("CREATE OR REPLACE FUNCTION")) return "FUNCTION";
  if (block.includes("CREATE TRIGGER")) return "TRIGGER";
  if (block.includes("CREATE VIEW")) return "VIEW";
  if (block.includes("CREATE POLICY")) return "POLICY";
  if (block.includes("ALTER TABLE")) return "ALTER TABLE";
  if (block.includes("COMMENT ON")) return "COMMENT";
  return "UNKNOWN";
}

/**
 * Vérifie si un objet existe déjà et peut être ignoré
 */
async function shouldSkipExistingObject(
  client: any,
  block: string,
): Promise<boolean> {
  try {
    // Vérifier les extensions
    if (block.includes("CREATE EXTENSION")) {
      const extensionMatch = block.match(
        /CREATE EXTENSION IF NOT EXISTS "([^"]+)"/,
      );
      if (extensionMatch) {
        const result = await client.query(
          "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = $1)",
          [extensionMatch[1]],
        );
        return result.rows[0].exists;
      }
    }

    // Vérifier les types enum
    if (block.includes("CREATE TYPE") && block.includes("AS ENUM")) {
      const typeMatch = block.match(/CREATE TYPE (\w+) AS ENUM/);
      if (typeMatch) {
        const result = await client.query(
          "SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = $1)",
          [typeMatch[1]],
        );
        return result.rows[0].exists;
      }
    }

    // Vérifier les tables
    if (block.includes("CREATE TABLE")) {
      const tableMatch = block.match(/CREATE TABLE (\w+)/);
      if (tableMatch) {
        const result = await client.query(
          "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = $1)",
          [tableMatch[1]],
        );
        return result.rows[0].exists;
      }
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Gère les erreurs connues et tente de les résoudre
 */
async function handleKnownErrors(
  client: any,
  error: any,
  block: string,
  blockType: string,
): Promise<boolean> {
  const errorCode = error.code;
  const errorMessage = error.message;

  // Erreur: type already exists
  if (errorCode === "42710" && blockType === "TYPE ENUM") {
    console.log(`ℹ️  Type enum existe déjà, continuons...`);
    return true;
  }

  // Erreur: relation already exists
  if (
    errorCode === "42P07" &&
    (blockType === "TABLE" || blockType === "INDEX")
  ) {
    console.log(`ℹ️  ${blockType} existe déjà, continuons...`);
    return true;
  }

  // Erreur: relation does not exist pour les index
  if (errorCode === "42P01" && blockType === "INDEX") {
    console.log(`ℹ️  Table manquante pour l'index, ignoré`);
    return true;
  }

  // Erreur de syntaxe critique
  if (errorCode === "42601") {
    console.error(`⚠️  Erreur de syntaxe critique détectée`);
    return false;
  }

  return false;
}

/**
 * Vérifie que les tables principales ont été créées
 */
async function verifyTables(): Promise<void> {
  const expectedTables = [
    "freelances",
    "companies",
    "admins",
    "user_sessions",
    "admin_sessions",
    "otps",
    "category_skills",
    "skills",
    "freelance_skills",
    "media",
    "project_categories",
    "projects",
    "project_skills",
    "applications",
    "contracts",
    "deliverables",
    "deliverable_media",
    "invoices",
    "payments",
    "notifications",
    "user_notifications",
    "conversations",
    "messages",
    "message_media",
    "project_invitations",
    "litigations",
    "reports",
  ];

  console.log("🔍 Vérification des tables créées...");

  for (const tableName of expectedTables) {
    try {
      const result = await query(
        `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )
      `,
        [tableName],
      );

      const exists = result.rows[0].exists;

      if (exists) {
        console.log(`✅ Table '${tableName}' créée avec succès`);
      } else {
        console.log(`❌ Table '${tableName}' non trouvée`);
      }
    } catch (error) {
      console.error(
        `❌ Erreur lors de la vérification de la table '${tableName}':`,
        error,
      );
    }
  }
}

/**
 * Vérifie que les types enum ont été créés
 */
async function verifyEnumTypes(): Promise<void> {
  const expectedEnums = [
    "availability_enum",
    "company_size_enum",
    "admin_level_enum",
    "otp_type_enum",
    "experience_level_enum",
    "type_work_enum",
    "type_media_enum",
    "project_status_enum",
    "application_status_enum",
    "contract_status_enum",
    "payment_mode_enum",
    "deliverable_status_enum",
    "invoice_status_enum",
    "payment_status_enum",
    "payment_type_enum",
    "notification_type_enum",
    "invitation_status_enum",
    "litigation_status_enum",
    "report_status_enum",
    "message_type_enum", // Ajouté
    "user_type_enum", // Ajouté
  ];

  console.log("🔍 Vérification des types énumérés...");

  for (const enumName of expectedEnums) {
    try {
      const result = await query(
        `
        SELECT EXISTS (
          SELECT FROM pg_type
          WHERE typname = $1
        )
      `,
        [enumName],
      );

      const exists = result.rows[0].exists;

      if (exists) {
        console.log(`✅ Type enum '${enumName}' créé avec succès`);
      } else {
        console.log(`❌ Type enum '${enumName}' non trouvé`);
      }
    } catch (error) {
      console.error(
        `❌ Erreur lors de la vérification du type '${enumName}':`,
        error,
      );
    }
  }
}

/**
 * Vérifie que les vues principales ont été créées
 */
async function verifyViews(): Promise<void> {
  const expectedViews = [
    "active_freelances",
    "active_companies",
    "available_freelances",
    "admin_user_sessions",
    "admin_admin_sessions",
    "admin_session_stats",
    "admin_admin_session_stats",
    "admin_suspicious_activity",
    "admin_suspicious_admin_activity",
    "freelance_average_rating",
    "company_average_rating",
    "contract_summary",
    "deliverable_work_summary",
  ];

  console.log("🔍 Vérification des vues créées...");

  for (const viewName of expectedViews) {
    try {
      const result = await query(
        `
        SELECT EXISTS (
          SELECT FROM information_schema.views
          WHERE table_schema = 'public'
          AND table_name = $1
        )
      `,
        [viewName],
      );

      const exists = result.rows[0].exists;

      if (exists) {
        console.log(`✅ Vue '${viewName}' créée avec succès`);
      } else {
        console.log(`❌ Vue '${viewName}' non trouvée`);
      }
    } catch (error) {
      console.error(
        `❌ Erreur lors de la vérification de la vue '${viewName}':`,
        error,
      );
    }
  }
}

/**
 * Fonction utilitaire pour réinitialiser complètement la base de données
 * ATTENTION: Cette fonction supprime TOUTES les données!
 */
async function resetDatabase(): Promise<void> {
  console.log(
    "⚠️  ATTENTION: Réinitialisation complète de la base de données!",
  );
  console.log("⚠️  Toutes les données seront supprimées!");

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Supprimer toutes les tables dans l'ordre inverse des dépendances
    const dropQueries = [
      // Tables de liaison et dépendantes
      "DROP TABLE IF EXISTS evaluations CASCADE;",
      "DROP TABLE IF EXISTS deliverable_media CASCADE;",
      "DROP TABLE IF EXISTS message_media CASCADE;",
      "DROP TABLE IF EXISTS freelance_skills CASCADE;",
      "DROP TABLE IF EXISTS project_skills CASCADE;",
      "DROP TABLE IF EXISTS applications CASCADE;",
      "DROP TABLE IF EXISTS contracts CASCADE;",
      "DROP TABLE IF EXISTS deliverables CASCADE;",
      "DROP TABLE IF EXISTS invoices CASCADE;",
      "DROP TABLE IF EXISTS payments CASCADE;",
      "DROP TABLE IF EXISTS notifications CASCADE;",
      "DROP TABLE IF EXISTS user_notifications CASCADE;",
      "DROP TABLE IF EXISTS messages CASCADE;",
      "DROP TABLE IF EXISTS conversations CASCADE;",
      "DROP TABLE IF EXISTS project_invitations CASCADE;",
      "DROP TABLE IF EXISTS litigations CASCADE;",
      "DROP TABLE IF EXISTS reports CASCADE;",
      "DROP TABLE IF EXISTS projects CASCADE;",
      "DROP TABLE IF EXISTS project_categories CASCADE;",
      "DROP TABLE IF EXISTS media CASCADE;",
      "DROP TABLE IF EXISTS skills CASCADE;",
      "DROP TABLE IF EXISTS category_skills CASCADE;",
      "DROP TABLE IF EXISTS otps CASCADE;",
      "DROP TABLE IF EXISTS user_sessions CASCADE;",
      "DROP TABLE IF EXISTS admin_sessions CASCADE;",
      "DROP TABLE IF EXISTS admins CASCADE;",
      "DROP TABLE IF EXISTS companies CASCADE;",
      "DROP TABLE IF EXISTS freelances CASCADE;",

      // Types ENUMs
      "DROP TYPE IF EXISTS report_status_enum CASCADE;",
      "DROP TYPE IF EXISTS litigation_status_enum CASCADE;",
      "DROP TYPE IF EXISTS invitation_status_enum CASCADE;",
      "DROP TYPE IF EXISTS notification_type_enum CASCADE;",
      "DROP TYPE IF EXISTS payment_type_enum CASCADE;",
      "DROP TYPE IF EXISTS payment_status_enum CASCADE;",
      "DROP TYPE IF EXISTS invoice_status_enum CASCADE;",
      "DROP TYPE IF EXISTS deliverable_status_enum CASCADE;",
      "DROP TYPE IF EXISTS payment_mode_enum CASCADE;",
      "DROP TYPE IF EXISTS contract_status_enum CASCADE;",
      "DROP TYPE IF EXISTS application_status_enum CASCADE;",
      "DROP TYPE IF EXISTS project_status_enum CASCADE;",
      "DROP TYPE IF EXISTS type_media_enum CASCADE;",
      "DROP TYPE IF EXISTS type_work_enum CASCADE;",
      "DROP TYPE IF EXISTS otp_type_enum CASCADE;",
      "DROP TYPE IF EXISTS admin_level_enum CASCADE;",
      "DROP TYPE IF EXISTS company_size_enum CASCADE;",
      "DROP TYPE IF EXISTS availability_enum CASCADE;",
      "DROP TYPE IF EXISTS experience_level_enum CASCADE;",
      "DROP TYPE IF EXISTS message_type_enum CASCADE;",
      "DROP TYPE IF EXISTS user_type_enum CASCADE;",

      // Supprimer les fonctions
      "DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;",
      "DROP FUNCTION IF EXISTS is_freelance_blocked(UUID) CASCADE;",
      "DROP FUNCTION IF EXISTS is_company_blocked(UUID) CASCADE;",
      "DROP FUNCTION IF EXISTS cleanup_expired_sessions() CASCADE;",
      "DROP FUNCTION IF EXISTS cleanup_expired_admin_sessions() CASCADE;",
      "DROP FUNCTION IF EXISTS cleanup_expired_otps() CASCADE;",
      "DROP FUNCTION IF EXISTS admin_revoke_session(UUID) CASCADE;",
      "DROP FUNCTION IF EXISTS admin_revoke_admin_session(UUID) CASCADE;",
      "DROP FUNCTION IF EXISTS admin_revoke_user_sessions(UUID) CASCADE;",
      "DROP FUNCTION IF EXISTS admin_revoke_admin_sessions(UUID) CASCADE;",
      "DROP FUNCTION IF EXISTS admin_block_freelance(UUID, INTEGER) CASCADE;",
      "DROP FUNCTION IF EXISTS admin_block_company(UUID, INTEGER) CASCADE;",

      // Supprimer les vues
      "DROP VIEW IF EXISTS admin_suspicious_admin_activity CASCADE;",
      "DROP VIEW IF EXISTS admin_suspicious_activity CASCADE;",
      "DROP VIEW IF EXISTS admin_admin_session_stats CASCADE;",
      "DROP VIEW IF EXISTS admin_session_stats CASCADE;",
      "DROP VIEW IF EXISTS admin_admin_sessions CASCADE;",
      "DROP VIEW IF EXISTS admin_user_sessions CASCADE;",
      "DROP VIEW IF EXISTS available_freelances CASCADE;",
      "DROP VIEW IF EXISTS active_companies CASCADE;",
      "DROP VIEW IF EXISTS active_freelances CASCADE;",
    ];

    for (const dropQuery of dropQueries) {
      try {
        await client.query(dropQuery);
      } catch (error) {
        // Ignorer les erreurs si l'objet n'existe pas
        console.log(`ℹ️  ${dropQuery.split(" ")[2]} non trouvé, ignoré`);
      }
    }

    await client.query("COMMIT");
    console.log("✅ Base de données réinitialisée avec succès");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Erreur lors de la réinitialisation:", error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Fonction principale qui gère les arguments de ligne de commande
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case "reset":
        await resetDatabase();
        await initializeDatabase();
        break;

      case "force-clean":
        console.log("🧹 Nettoyage forcé de la base de données...");
        await forceCleanDatabase();
        await initializeDatabase();
        break;

      case "verify":
        await verifyTables();
        await verifyEnumTypes();
        await verifyViews();
        break;

      case "init":
      default:
        await initializeDatabase();
        break;
    }

    console.log("🎉 Opération terminée avec succès!");
    process.exit(0);
  } catch (error) {
    console.error("💥 Échec de l'opération:", error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

/**
 * Nettoyage forcé pour résoudre les problèmes de dépendances
 */
async function forceCleanDatabase(): Promise<void> {
  const client = await db.connect();

  try {
    console.log("🔥 Suppression forcée de tous les objets...");

    // Désactiver RLS temporairement
    const disableRLSQueries = [
      "ALTER TABLE IF EXISTS freelances DISABLE ROW LEVEL SECURITY;",
      "ALTER TABLE IF EXISTS companies DISABLE ROW LEVEL SECURITY;",
      "ALTER TABLE IF EXISTS user_sessions DISABLE ROW LEVEL SECURITY;",
      "ALTER TABLE IF EXISTS admin_sessions DISABLE ROW LEVEL SECURITY;",
      "ALTER TABLE IF EXISTS otps DISABLE ROW LEVEL SECURITY;",
    ];

    for (const query of disableRLSQueries) {
      try {
        await client.query(query);
      } catch (error) {
        // Ignorer les erreurs
      }
    }

    // Supprimer tous les objets dans l'ordre
    const dropAllQuery = `
      DO $$
      DECLARE
          r RECORD;
      BEGIN
          -- Drop all views
          FOR r IN (SELECT schemaname, viewname FROM pg_views WHERE schemaname = 'public') LOOP
              EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.schemaname) || '.' || quote_ident(r.viewname) || ' CASCADE';
          END LOOP;

          -- Drop all tables
          FOR r IN (SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public') LOOP
              EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;

          -- Drop all types
          FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e') LOOP
              EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
          END LOOP;

          -- Drop all functions
          FOR r IN (SELECT proname, oidvectortypes(proargtypes) as argtypes FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) LOOP
              EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || '(' || r.argtypes || ') CASCADE';
          END LOOP;
      END $$;
    `;

    await client.query(dropAllQuery);
    console.log("✅ Nettoyage forcé terminé");
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage forcé:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Exécuter le script seulement s'il est appelé directement
if (require.main === module) {
  main();
}

export {
  initializeDatabase,
  resetDatabase,
  verifyTables,
  verifyEnumTypes,
  forceCleanDatabase,
};
