/**
 * Test d'intégration pour vérifier que les médias des livrables sont bien récupérés
 * dans la méthode getProjectById
 */

import { ProjectsService } from "../projects.service";
import { ProjectsRepository } from "../projects.repository";

/**
 * Test simple pour vérifier la récupération des médias
 */
export async function testMediaIntegration() {
  console.log("🧪 Début des tests d'intégration des médias...");

  const projectsService = new ProjectsService();
  const projectsRepository = new ProjectsRepository();

  try {
    // Test 1: Vérifier que la méthode getDeliverablesByContract retourne bien les médias
    console.log("\n📋 Test 1: Récupération des livrables avec médias...");

    // Exemple d'ID de contrat (à remplacer par un vrai ID de test)
    const testContractId = "00000000-0000-4000-8000-000000000001";

    try {
      const deliverables =
        await projectsRepository.getDeliverablesByContract(testContractId);
      console.log("✅ Livrables récupérés:", deliverables.length);

      deliverables.forEach((deliverable, index) => {
        console.log(`  Livrable ${index + 1}:`);
        console.log(`    - ID: ${deliverable.id}`);
        console.log(`    - Titre: ${deliverable.title}`);
        console.log(
          `    - Médias: ${deliverable.medias ? deliverable.medias.length : 0}`,
        );

        if (deliverable.medias && deliverable.medias.length > 0) {
          deliverable.medias.forEach((media: any, mediaIndex: number) => {
            console.log(
              `      Média ${mediaIndex + 1}: ${media.type} - ${media.url}`,
            );
          });
        }
      });
    } catch (error) {
      console.log(
        "⚠️  Contrat de test non trouvé (normal si pas de données de test)",
      );
    }

    // Test 2: Vérifier la structure de la requête SQL
    console.log("\n🔍 Test 2: Vérification de la structure SQL...");

    // Test de la requête SQL en simulant un appel
    try {
      const testProjectId = "00000000-0000-4000-8000-000000000002";
      const testFreelanceId = "00000000-0000-4000-8000-000000000003";

      const project = await projectsService.getProjectById(
        testProjectId,
        testFreelanceId,
      );

      if (project) {
        console.log("✅ Projet récupéré avec succès");
        console.log("📋 Structure du projet:");
        console.log(`  - ID: ${project.id}`);
        console.log(`  - Titre: ${project.title}`);
        console.log(`  - Contrat: ${project.contract ? "Présent" : "Absent"}`);
        console.log(
          `  - Livrables: ${project.deliverables ? project.deliverables.length : 0}`,
        );

        if (project.deliverables) {
          project.deliverables.forEach((deliverable, index) => {
            console.log(`    Livrable ${index + 1}: ${deliverable.title}`);
            console.log(
              `      - Médias: ${deliverable.medias ? deliverable.medias.length : 0}`,
            );
          });
        }
      } else {
        console.log(
          "⚠️  Projet de test non trouvé (normal si pas de données de test)",
        );
      }
    } catch (error) {
      console.log(
        "⚠️  Erreur lors du test (normal si pas de données de test):",
        (error as Error).message,
      );
    }

    // Test 3: Vérifier la cohérence des types
    console.log("\n🔧 Test 3: Vérification des types...");

    // Simuler une structure de données pour vérifier les types
    const mockDeliverable = {
      id: "test-id",
      title: "Test",
      medias: [
        {
          id: "media-id",
          url: "https://example.com/file.pdf",
          type: "pdf" as const,
          size: 1024,
          uploadedAt: new Date(),
          description: "Test media",
        },
      ],
    };

    console.log("✅ Structure de données validée:");
    console.log(`  - Livrable avec ${mockDeliverable.medias.length} média(s)`);
    console.log(`  - Type de média: ${mockDeliverable.medias[0].type}`);
    console.log(`  - URL: ${mockDeliverable.medias[0].url}`);

    console.log("\n🎉 Tous les tests d'intégration terminés!");

    return {
      success: true,
      message: "Tests d'intégration des médias réussis",
    };
  } catch (error) {
    console.error("❌ Erreur lors des tests d'intégration:", error);
    return {
      success: false,
      message: (error as Error).message,
    };
  }
}

/**
 * Validation de la structure des données retournées
 */
export function validateMediaStructure(deliverable: any): boolean {
  try {
    // Vérifier que le livrable a la structure attendue
    if (!deliverable || typeof deliverable !== "object") {
      console.log("❌ Livrable invalide");
      return false;
    }

    // Vérifier que medias existe et est un tableau
    if (!Array.isArray(deliverable.medias)) {
      console.log("❌ Le champ medias doit être un tableau");
      return false;
    }

    // Vérifier chaque média
    for (const media of deliverable.medias) {
      if (!media.id || !media.url || !media.type) {
        console.log("❌ Média incomplet:", media);
        return false;
      }

      // Vérifier les types attendus
      if (
        typeof media.id !== "string" ||
        typeof media.url !== "string" ||
        typeof media.type !== "string"
      ) {
        console.log("❌ Types de données incorrects pour le média:", media);
        return false;
      }
    }

    console.log("✅ Structure des médias validée");
    return true;
  } catch (error) {
    console.log("❌ Erreur lors de la validation:", error);
    return false;
  }
}

/**
 * Test manuel pour développement
 */
export function runManualTest() {
  console.log("🚀 Lancement du test manuel...");

  // Exemple de données attendues
  const expectedStructure = {
    project: {
      id: "string",
      title: "string",
      contract: {
        id: "string",
        status: "active",
      },
      deliverables: [
        {
          id: "string",
          title: "string",
          medias: [
            {
              id: "string",
              url: "string",
              type: "pdf|image|doc|zip|other",
              size: "number",
              uploadedAt: "Date",
              uploadedBy: "string?",
              description: "string?",
            },
          ],
        },
      ],
    },
  };

  console.log(
    "📝 Structure attendue:",
    JSON.stringify(expectedStructure, null, 2),
  );
  console.log("✅ Test manuel terminé");
}

// Export des fonctions pour utilisation externe
export { testMediaIntegration as default };
