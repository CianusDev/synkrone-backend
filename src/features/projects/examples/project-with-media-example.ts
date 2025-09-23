/**
 * Exemple d'utilisation de l'API getProjectById avec médias des livrables
 *
 * Ce fichier montre comment utiliser la nouvelle fonctionnalité qui retourne
 * les médias associés aux livrables d'un projet.
 */

import { ProjectsService } from '../projects.service';

// Exemple d'utilisation du service
async function exempleGetProjectWithMedia() {
  const projectsService = new ProjectsService();

  // ID du projet à récupérer
  const projectId = "123e4567-e89b-12d3-a456-426614174000";

  // ID du freelance (optionnel, pour récupérer le contrat et les livrables)
  const freelanceId = "987fcdeb-51a2-4567-b890-123456789abc";

  try {
    // Récupération du projet avec le contrat et les livrables (incluant les médias)
    const project = await projectsService.getProjectById(projectId, freelanceId);

    if (!project) {
      console.log('Projet non trouvé');
      return;
    }

    console.log('📋 Projet récupéré:', {
      id: project.id,
      title: project.title,
      status: project.status,
      company: project.company?.company_name,
    });

    // Si un contrat existe pour ce freelance
    if (project.contract) {
      console.log('📄 Contrat actif:', {
        id: project.contract.id,
        status: project.contract.status,
        paymentMode: project.contract.payment_mode,
        tjm: project.contract.tjm,
      });

      // Affichage des livrables avec leurs médias
      if (project.deliverables && project.deliverables.length > 0) {
        console.log(`📦 ${project.deliverables.length} livrable(s) trouvé(s):`);

        project.deliverables.forEach((deliverable, index) => {
          console.log(`\n  Livrable ${index + 1}:`);
          console.log(`  - ID: ${deliverable.id}`);
          console.log(`  - Titre: ${deliverable.title}`);
          console.log(`  - Statut: ${deliverable.status}`);
          console.log(`  - Milestone: ${deliverable.isMilestone ? 'Oui' : 'Non'}`);
          console.log(`  - Montant: ${deliverable.amount || 'N/A'}€`);
          console.log(`  - Date d'échéance: ${deliverable.dueDate || 'N/A'}`);

          // Affichage des médias associés
          if (deliverable.medias && deliverable.medias.length > 0) {
            console.log(`  📎 ${deliverable.medias.length} média(s) associé(s):`);
            deliverable.medias.forEach((media, mediaIndex) => {
              console.log(`    Média ${mediaIndex + 1}:`);
              console.log(`    - ID: ${media.id}`);
              console.log(`    - URL: ${media.url}`);
              console.log(`    - Type: ${media.type}`);
              console.log(`    - Taille: ${media.size ? `${(media.size / 1024).toFixed(2)} KB` : 'N/A'}`);
              console.log(`    - Uploadé le: ${media.uploadedAt}`);
              console.log(`    - Description: ${media.description || 'Aucune description'}`);
            });
          } else {
            console.log('  📎 Aucun média associé');
          }
        });
      } else {
        console.log('📦 Aucun livrable trouvé pour ce contrat');
      }
    } else {
      console.log('📄 Aucun contrat actif trouvé pour ce freelance sur ce projet');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la récupération du projet:', error);
  }
}

// Exemple de structure de données retournée
export const exempleStructureRetournee = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  title: "Développement d'une API REST",
  description: "API pour plateforme e-commerce avec authentification et paiements",
  status: "published",
  company: {
    id: "company-uuid",
    company_name: "TechCorp",
    logo_url: "https://example.com/logo.png",
    industry: "E-commerce"
  },
  contract: {
    id: "contract-uuid",
    status: "active",
    payment_mode: "daily_rate",
    tjm: 500,
    estimated_days: 20,
    start_date: "2024-01-15",
    end_date: "2024-02-15"
  },
  deliverables: [
    {
      id: "deliverable-1-uuid",
      title: "Analyse des besoins",
      description: "Document d'analyse détaillée des besoins",
      status: "validated",
      isMilestone: true,
      amount: 1000,
      dueDate: "2024-01-20",
      order: 1,
      medias: [
        {
          id: "media-1-uuid",
          url: "https://storage.example.com/documents/analyse-besoins.pdf",
          type: "pdf",
          size: 1024000, // 1MB en octets
          uploadedAt: "2024-01-18T10:30:00Z",
          uploadedBy: "freelance-uuid",
          description: "Document d'analyse complet avec recommandations"
        },
        {
          id: "media-2-uuid",
          url: "https://storage.example.com/images/schema-architecture.png",
          type: "image",
          size: 512000, // 512KB en octets
          uploadedAt: "2024-01-19T14:15:00Z",
          uploadedBy: "freelance-uuid",
          description: "Schéma de l'architecture proposée"
        }
      ]
    },
    {
      id: "deliverable-2-uuid",
      title: "Développement de l'API",
      description: "Code source de l'API REST",
      status: "in_progress",
      isMilestone: true,
      amount: 3000,
      dueDate: "2024-02-10",
      order: 2,
      medias: [] // Aucun média pour l'instant
    }
  ],
  deliverableCount: 2,
  skills: [
    // ... compétences du projet
  ]
};

// Exemple d'utilisation via une route Express
export const exempleRouteExpress = `
// GET /projects/:id?freelanceId=uuid
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const freelanceId = req.query.freelanceId as string | undefined;

    const project = await projectsService.getProjectById(id, freelanceId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }

    // Le projet contient maintenant les médias des livrables
    res.json({
      success: true,
      data: project,
      message: 'Projet récupéré avec succès'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});
`;

// Exemple de tests unitaires
export const exempleTests = `
describe('ProjectsService.getProjectById avec médias', () => {
  it('devrait retourner un projet avec les médias des livrables', async () => {
    const projectId = 'test-project-id';
    const freelanceId = 'test-freelance-id';

    const result = await projectsService.getProjectById(projectId, freelanceId);

    expect(result).toBeDefined();
    expect(result.deliverables).toBeDefined();
    expect(result.deliverables[0].medias).toBeDefined();
    expect(Array.isArray(result.deliverables[0].medias)).toBe(true);
  });

  it('devrait retourner un tableau vide de médias si aucun média associé', async () => {
    const projectId = 'test-project-without-media';
    const freelanceId = 'test-freelance-id';

    const result = await projectsService.getProjectById(projectId, freelanceId);

    expect(result.deliverables[0].medias).toEqual([]);
  });
});
`;

// Exporter la fonction d'exemple pour utilisation
export { exempleGetProjectWithMedia };
