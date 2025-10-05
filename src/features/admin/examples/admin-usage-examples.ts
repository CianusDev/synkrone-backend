/**
 * Exemples d'utilisation de l'API Admin - Synkrone Backend
 *
 * Ce fichier contient des exemples concrets d'utilisation de toutes les fonctionnalités
 * de l'API d'administration de la plateforme Synkrone.
 */

import { AdminService } from '../admin.service';
import { AdminLevel } from '../admin.model';

// =============================================
// INITIALISATION DU SERVICE
// =============================================

const adminService = new AdminService();

// =============================================
// EXEMPLES D'UTILISATION
// =============================================

/**
 * Exemple 1: Récupération des statistiques du dashboard
 */
export async function exempleGetDashboardStats() {
  console.log('📊 Récupération des statistiques du dashboard...');

  try {
    const stats = await adminService.getDashboardStats();

    console.log('✅ Statistiques récupérées:');
    console.log(`👥 Utilisateurs: ${stats.users.totalFreelances} freelances, ${stats.users.totalCompanies} entreprises`);
    console.log(`📋 Projets: ${stats.projects.totalProjects} total, ${stats.projects.publishedProjects} publiés`);
    console.log(`💼 Contrats: ${stats.contracts.activeContracts} actifs sur ${stats.contracts.totalContracts} total`);
    console.log(`🔐 Sessions: ${stats.sessions.totalActiveSessions} actives`);
    console.log(`💰 Revenus: ${stats.platform.totalRevenue}€ de revenus total`);

    return stats;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Exemple 2: Créer un nouvel administrateur
 */
export async function exempleCreateAdmin() {
  console.log('👑 Création d\'un nouvel administrateur...');

  try {
    const newAdmin = await adminService.createAdmin({
      username: 'moderateur_test',
      email: 'moderateur@synkrone.com',
      password_hashed: 'hashed_password_here', // En réalité, utiliser bcrypt
      level: AdminLevel.MODERATEUR
    });

    console.log('✅ Administrateur créé:', {
      id: newAdmin.id,
      username: newAdmin.username,
      level: newAdmin.level,
      created_at: newAdmin.created_at
    });

    return newAdmin;
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
    throw error;
  }
}

/**
 * Exemple 3: Gestion des freelances
 */
export async function exempleGestionFreelances() {
  console.log('💼 Gestion des freelances...');

  try {
    // Récupérer la liste des freelances avec filtres
    const freelances = await adminService.getFreelances({
      page: 1,
      limit: 10,
      search: 'john',
      isVerified: false,
      isBlocked: false,
      availability: 'available',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });

    console.log(`✅ ${freelances.total} freelances trouvés (page ${freelances.page}/${freelances.totalPages})`);

    if (freelances.data.length > 0) {
      const freelance = freelances.data[0];
      console.log(`👤 Premier freelance: ${freelance.firstname} ${freelance.lastname}`);
      console.log(`📧 Email: ${freelance.email}`);
      console.log(`✅ Vérifié: ${freelance.is_verified ? 'Oui' : 'Non'}`);
      console.log(`🚫 Bloqué: ${freelance.isBlocked ? 'Oui' : 'Non'}`);
      console.log(`💰 TJM: ${freelance.tjm || 'Non défini'}`);
      console.log(`📈 Candidatures: ${freelance.applicationsCount || 0}`);
      console.log(`💼 Contrats: ${freelance.contractsCount || 0}`);
      console.log(`⭐ Note moyenne: ${freelance.averageRating || 'Non noté'}`);
    }

    return freelances;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Exemple 4: Bloquer/débloquer un freelance
 */
export async function exempleBlockerFreelance(freelanceId: string, adminId: string) {
  console.log('🚫 Blocage d\'un freelance...');

  try {
    // Bloquer pour 7 jours
    const blocked = await adminService.blockFreelance(
      freelanceId,
      adminId,
      7, // 7 jours
      'Comportement inapproprié signalé par plusieurs clients'
    );

    if (blocked) {
      console.log('✅ Freelance bloqué avec succès pour 7 jours');

      // Attendre un moment puis débloquer (exemple)
      setTimeout(async () => {
        console.log('🔓 Déblocage du freelance...');
        const unblocked = await adminService.unblockFreelance(
          freelanceId,
          adminId,
          'Situation résolue après discussion'
        );

        if (unblocked) {
          console.log('✅ Freelance débloqué avec succès');
        }
      }, 5000);
    }

    return blocked;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Exemple 5: Gestion des entreprises
 */
export async function exempleGestionEntreprises() {
  console.log('🏢 Gestion des entreprises...');

  try {
    // Récupérer les entreprises non vérifiées
    const companies = await adminService.getCompanies({
      page: 1,
      limit: 5,
      isVerified: false,
      isCertified: false,
      sortBy: 'created_at',
      sortOrder: 'desc'
    });

    console.log(`✅ ${companies.total} entreprises non vérifiées trouvées`);

    if (companies.data.length > 0) {
      const company = companies.data[0];
      console.log(`🏢 Entreprise: ${company.company_name}`);
      console.log(`📧 Email: ${company.company_email}`);
      console.log(`🏭 Secteur: ${company.industry || 'Non défini'}`);
      console.log(`📏 Taille: ${company.company_size || 'Non définie'}`);
      console.log(`📋 Projets: ${company.projectsCount || 0}`);
      console.log(`💼 Contrats: ${company.contractsCount || 0}`);
      console.log(`💰 Dépenses totales: ${company.totalSpent || 0}€`);
    }

    return companies;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Exemple 6: Vérifier et certifier une entreprise
 */
export async function exempleVerifierEntreprise(companyId: string, adminId: string) {
  console.log('✅ Vérification d\'une entreprise...');

  try {
    // Vérifier l'entreprise
    const verified = await adminService.verifyCompany(
      companyId,
      adminId,
      'Documents légaux vérifiés manuellement'
    );

    if (verified) {
      console.log('✅ Entreprise vérifiée avec succès');

      // Ensuite la certifier
      const certified = await adminService.certifyCompany(
        companyId,
        adminId,
        'Entreprise de confiance, certification accordée'
      );

      if (certified) {
        console.log('🏆 Entreprise certifiée avec succès');
      }
    }

    return { verified, certified: verified };
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Exemple 7: Gestion des sessions
 */
export async function exempleGestionSessions() {
  console.log('🔐 Gestion des sessions...');

  try {
    // Récupérer les statistiques des sessions
    const sessionStats = await adminService.getSessionStats();

    console.log('📊 Statistiques des sessions:');
    console.log(`👥 Sessions utilisateurs actives: ${sessionStats.userSessions.activeSessions}`);
    console.log(`👑 Sessions admin actives: ${sessionStats.adminSessions.activeSessions}`);
    console.log(`🕐 Sessions dernières 24h: ${sessionStats.userSessions.sessionsLast24h}`);

    // Récupérer les activités suspectes
    const suspiciousActivities = await adminService.getSuspiciousActivity();

    console.log(`⚠️  ${suspiciousActivities.length} activités suspectes détectées:`);
    suspiciousActivities.forEach((activity, index) => {
      console.log(`  ${index + 1}. ${activity.userEmail} (${activity.userType})`);
      console.log(`     - ${activity.differentIps} IP différentes`);
      console.log(`     - ${activity.totalSessions} sessions total`);
      console.log(`     - Dernière activité: ${activity.lastActivity}`);
    });

    return { sessionStats, suspiciousActivities };
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Exemple 8: Révoquer des sessions suspectes
 */
export async function exempleRevoquerSessions(userId: string, adminId: string) {
  console.log('🚫 Révocation des sessions suspectes...');

  try {
    // Révoquer toutes les sessions d'un utilisateur
    const revokedCount = await adminService.revokeAllUserSessions(
      userId,
      adminId,
      'Activité suspecte détectée - mesure de sécurité'
    );

    console.log(`✅ ${revokedCount} session(s) révoquée(s) avec succès`);

    return revokedCount;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Exemple 9: Gestion des projets
 */
export async function exempleGestionProjets() {
  console.log('📋 Gestion des projets...');

  try {
    // Récupérer les projets en attente de modération
    const projects = await adminService.getProjects({
      page: 1,
      limit: 10,
      status: 'is_pending',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });

    console.log(`✅ ${projects.total} projets en attente de modération`);

    if (projects.data.length > 0) {
      const project = projects.data[0];
      console.log(`📋 Projet: ${project.title}`);
      console.log(`💰 Budget: ${project.budgetMin || 0}€ - ${project.budgetMax || 0}€`);
      console.log(`🏢 Entreprise: ${project.company?.company_name}`);
      console.log(`📝 Candidatures: ${project.applicationsCount || 0}`);
      console.log(`📅 Créé le: ${project.createdAt}`);
    }

    return projects;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Exemple 10: Modérer un projet
 */
export async function exempleModererProjet(projectId: string, adminId: string) {
  console.log('🔍 Modération d\'un projet...');

  try {
    // Approuver le projet
    const approved = await adminService.updateProjectStatus(
      projectId,
      'published',
      adminId,
      'Projet vérifié et approuvé pour publication'
    );

    if (approved) {
      console.log('✅ Projet approuvé et publié');
    }

    return approved;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

/**
 * Exemple 11: Nettoyage de maintenance
 */
export async function exempleNettoyageMaintenance() {
  console.log('🧹 Nettoyage de maintenance...');

  try {
    const result = await adminService.cleanupExpiredSessions();

    console.log('✅ Nettoyage terminé:');
    console.log(`🔐 ${result.userSessions} sessions utilisateurs expirées supprimées`);
    console.log(`👑 ${result.adminSessions} sessions admin expirées supprimées`);
    console.log(`🔑 ${result.otps} OTP expirés supprimés`);

    return result;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

// =============================================
// FONCTIONS UTILITAIRES POUR LES TESTS
// =============================================

/**
 * Test complet de la fonctionnalité admin
 */
export async function testCompletFonctionnaliteAdmin() {
  console.log('🧪 Test complet de la fonctionnalité admin...\n');

  try {
    // 1. Stats dashboard
    console.log('1️⃣ Test des statistiques...');
    await exempleGetDashboardStats();
    console.log('');

    // 2. Gestion des freelances
    console.log('2️⃣ Test gestion des freelances...');
    await exempleGestionFreelances();
    console.log('');

    // 3. Gestion des entreprises
    console.log('3️⃣ Test gestion des entreprises...');
    await exempleGestionEntreprises();
    console.log('');

    // 4. Gestion des sessions
    console.log('4️⃣ Test gestion des sessions...');
    await exempleGestionSessions();
    console.log('');

    // 5. Gestion des projets
    console.log('5️⃣ Test gestion des projets...');
    await exempleGestionProjets();
    console.log('');

    // 6. Nettoyage
    console.log('6️⃣ Test nettoyage maintenance...');
    await exempleNettoyageMaintenance();
    console.log('');

    console.log('🎉 Tous les tests sont passés avec succès !');

    return {
      success: true,
      message: 'Test complet réussi'
    };

  } catch (error) {
    console.error('❌ Échec du test complet:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

// =============================================
// EXEMPLES D'USAGE VIA HTTP
// =============================================

export const exemplesHTTP = {
  // Récupérer les stats
  getDashboardStats: `
curl -X GET "http://localhost:3000/admin/dashboard/stats" \\
  -H "Authorization: Bearer admin-jwt-token"
  `,

  // Lister les freelances
  getFreelances: `
curl -X GET "http://localhost:3000/admin/freelances?page=1&limit=10&isVerified=false" \\
  -H "Authorization: Bearer admin-jwt-token"
  `,

  // Bloquer un freelance
  blockFreelance: `
curl -X POST "http://localhost:3000/admin/freelances/uuid/block" \\
  -H "Authorization: Bearer admin-jwt-token" \\
  -H "Content-Type: application/json" \\
  -d '{"durationDays": 7, "reason": "Violation des CGU"}'
  `,

  // Vérifier une entreprise
  verifyCompany: `
curl -X POST "http://localhost:3000/admin/companies/uuid/verify" \\
  -H "Authorization: Bearer admin-jwt-token" \\
  -H "Content-Type: application/json" \\
  -d '{"reason": "Documents vérifiés"}'
  `,

  // Révoquer une session
  revokeSession: `
curl -X POST "http://localhost:3000/admin/sessions/revoke/user" \\
  -H "Authorization: Bearer admin-jwt-token" \\
  -H "Content-Type: application/json" \\
  -d '{"sessionId": "session-uuid", "reason": "Activité suspecte"}'
  `,

  // Changer statut d'un projet
  updateProjectStatus: `
curl -X PATCH "http://localhost:3000/admin/projects/uuid/status" \\
  -H "Authorization: Bearer admin-jwt-token" \\
  -H "Content-Type: application/json" \\
  -d '{"status": "published", "reason": "Approuvé après vérification"}'
  `
};

// =============================================
// EXPORT PRINCIPAL
// =============================================

export default {
  exempleGetDashboardStats,
  exempleCreateAdmin,
  exempleGestionFreelances,
  exempleBlockerFreelance,
  exempleGestionEntreprises,
  exempleVerifierEntreprise,
  exempleGestionSessions,
  exempleRevoquerSessions,
  exempleGestionProjets,
  exempleModererProjet,
  exempleNettoyageMaintenance,
  testCompletFonctionnaliteAdmin,
  exemplesHTTP
};
