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
  const priorities = [
    // 1. Extensions d'abord
    /^CREATE EXTENSION/i,

    // 2. Types énumérés
    /^CREATE TYPE.*AS ENUM/i,

    // 3. Toutes les tables (avant les fonctions et triggers)
    /^CREATE TABLE/i,

    // 4. Index sur les tables
    /^CREATE INDEX/i,

    // 5. Fonctions utilitaires (pas de trigger)
    /^CREATE OR REPLACE FUNCTION(?!.*trigger)/i,

    // 6. Fonctions de trigger
    /^CREATE OR REPLACE FUNCTION.*trigger/i,

    // 7. Triggers
    /^CREATE TRIGGER/i,

    // 8. Vues
    /^CREATE VIEW/i,

    // 9. Politiques de sécurité
    /^ALTER TABLE.*ENABLE ROW LEVEL SECURITY/i,
    /^CREATE POLICY/i,

    // 10. Commentaires
    /^COMMENT ON/i,

    // 11. Insertions de données
    /^INSERT INTO/i,
  ];

  // Trier les blocs selon les priorités
  for (const priority of priorities) {
    const matchingBlocks = blocks.filter((block) => priority.test(block));
    sortedBlocks.push(...matchingBlocks);
  }

  // Ajouter tous les blocs restants qui ne correspondent à aucune priorité
  const remainingBlocks = blocks.filter(
    (block) => !sortedBlocks.some((sorted) => sorted === block),
  );
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

  // Commencer une nouvelle transaction
  await client.query("BEGIN");

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

      // Exécuter le bloc SQL (ne pas ajouter ; car il est déjà inclus)
      await client.query(block);
      successCount++;

      // Afficher le progrès
      if (successCount % 5 === 0 && successCount > 0) {
        console.log(
          `⏳ Progression: ${successCount}/${sortedBlocks.length - skipCount} blocs exécutés`,
        );
      }
    } catch (error) {
      // Certaines erreurs peuvent être ignorées (ex: extension déjà existante)
      const errorMessage = (error as Error).message.toLowerCase();

      if (
        errorMessage.includes("already exists") ||
        errorMessage.includes("déjà existant") ||
        errorMessage.includes("extension") ||
        (errorMessage.includes("type") &&
          errorMessage.includes("already exists")) ||
        (errorMessage.includes("function") &&
          errorMessage.includes("already exists")) ||
        (errorMessage.includes("view") &&
          errorMessage.includes("already exists")) ||
        (errorMessage.includes("policy") &&
          errorMessage.includes("already exists"))
      ) {
        console.log(`⚠️  Ignoré (déjà existant): ${block.substring(0, 60)}...`);
        skipCount++;
        continue;
      }

      // Afficher plus de contexte en cas d'erreur
      console.error(`❌ Erreur lors de l'exécution du bloc SQL:`);
      console.error(`📍 Bloc ${i + 1}/${sortedBlocks.length}:`);
      console.error(
        `📄 SQL: ${block.substring(0, 200)}${block.length > 200 ? "..." : ""}`,
      );
      console.error(`🔍 Détails de l'erreur:`, error);
      throw error;
    }
  }

  // Valider la transaction
  await client.query("COMMIT");

  console.log("✅ Base de données initialisée avec succès (bloc par bloc)!");
  console.log(`📊 Statistiques:`);
  console.log(`   - Blocs exécutés: ${successCount}`);
  console.log(`   - Blocs ignorés: ${skipCount}`);
  console.log(`   - Total traité: ${successCount + skipCount}`);

  // Vérifier que les tables principales sont créées
  await verifyTables();
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
    "otp_type_enum", // Ajout du nouveau type enum pour les OTPs
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
      "DROP TABLE IF EXISTS otps CASCADE;",
      "DROP TABLE IF EXISTS user_sessions CASCADE;",
      "DROP TABLE IF EXISTS admin_sessions CASCADE;",
      "DROP TABLE IF EXISTS admins CASCADE;",
      "DROP TABLE IF EXISTS companies CASCADE;",
      "DROP TABLE IF EXISTS freelances CASCADE;",

      // Supprimer les types enum
      "DROP TYPE IF EXISTS otp_type_enum CASCADE;",
      "DROP TYPE IF EXISTS admin_level_enum CASCADE;",
      "DROP TYPE IF EXISTS company_size_enum CASCADE;",
      "DROP TYPE IF EXISTS availability_enum CASCADE;",

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

      case "verify":
        await verifyTables();
        await verifyEnumTypes();
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

// Exécuter le script seulement s'il est appelé directement
if (require.main === module) {
  main();
}

export { initializeDatabase, resetDatabase, verifyTables, verifyEnumTypes };
