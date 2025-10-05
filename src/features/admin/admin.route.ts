import { Router } from "express";
import { AdminController } from "./admin.controller";
import { AuthAdminMiddleware } from "../../middlewares/auth-admin.middleware";

const router = Router();
const controller = new AdminController();

// Toutes les routes admin nécessitent une authentification admin
router.use(AuthAdminMiddleware);

// =============================================
// DASHBOARD & STATS
// =============================================

// GET /admin/dashboard/stats - Récupérer les statistiques du dashboard
router.get("/dashboard/stats", (req, res) => controller.getDashboardStats(req, res));

// =============================================
// GESTION DES ADMINS
// =============================================

// GET /admin/admins - Liste des administrateurs
router.get("/admins", (req, res) => controller.getAllAdmins(req, res));

// GET /admin/admins/:id - Récupérer un admin par ID
router.get("/admins/:id", (req, res) => controller.getAdminById(req, res));

// POST /admin/admins - Créer un nouvel administrateur
router.post("/admins", (req, res) => controller.createAdmin(req, res));

// PATCH /admin/admins/:id/password - Mettre à jour le mot de passe d'un admin
router.patch("/admins/:id/password", (req, res) => controller.updateAdminPassword(req, res));

// PATCH /admin/admins/:id/level - Mettre à jour le niveau d'un admin
router.patch("/admins/:id/level", (req, res) => controller.updateAdminLevel(req, res));

// DELETE /admin/admins/:id - Supprimer un administrateur
router.delete("/admins/:id", (req, res) => controller.deleteAdmin(req, res));

// =============================================
// GESTION DES SESSIONS
// =============================================

// GET /admin/sessions/users - Sessions des utilisateurs (freelances/entreprises)
router.get("/sessions/users", (req, res) => controller.getUserSessions(req, res));

// GET /admin/sessions/admins - Sessions des administrateurs
router.get("/sessions/admins", (req, res) => controller.getAdminSessions(req, res));

// GET /admin/sessions/stats - Statistiques des sessions
router.get("/sessions/stats", (req, res) => controller.getSessionStats(req, res));

// GET /admin/sessions/suspicious - Activités suspectes
router.get("/sessions/suspicious", (req, res) => controller.getSuspiciousActivity(req, res));

// POST /admin/sessions/revoke/user - Révoquer une session utilisateur
router.post("/sessions/revoke/user", (req, res) => controller.revokeUserSession(req, res));

// POST /admin/sessions/revoke/admin - Révoquer une session admin
router.post("/sessions/revoke/admin", (req, res) => controller.revokeAdminSession(req, res));

// POST /admin/sessions/revoke/user/:userId/all - Révoquer toutes les sessions d'un utilisateur
router.post("/sessions/revoke/user/:userId/all", (req, res) => controller.revokeAllUserSessions(req, res));

// POST /admin/sessions/cleanup - Nettoyer les sessions expirées
router.post("/sessions/cleanup", (req, res) => controller.cleanupExpiredSessions(req, res));

// =============================================
// GESTION DES FREELANCES
// =============================================

// GET /admin/freelances - Liste des freelances avec filtres
router.get("/freelances", (req, res) => controller.getFreelances(req, res));

// GET /admin/freelances/:id - Récupérer un freelance par ID
router.get("/freelances/:id", (req, res) => controller.getFreelanceById(req, res));

// POST /admin/freelances/:id/block - Bloquer un freelance
router.post("/freelances/:id/block", (req, res) => controller.blockFreelance(req, res));

// POST /admin/freelances/:id/unblock - Débloquer un freelance
router.post("/freelances/:id/unblock", (req, res) => controller.unblockFreelance(req, res));

// POST /admin/freelances/:id/verify - Vérifier un freelance
router.post("/freelances/:id/verify", (req, res) => controller.verifyFreelance(req, res));

// POST /admin/freelances/:id/unverify - Retirer la vérification d'un freelance
router.post("/freelances/:id/unverify", (req, res) => controller.unverifyFreelance(req, res));

// =============================================
// GESTION DES ENTREPRISES
// =============================================

// GET /admin/companies - Liste des entreprises avec filtres
router.get("/companies", (req, res) => controller.getCompanies(req, res));

// GET /admin/companies/:id - Récupérer une entreprise par ID
router.get("/companies/:id", (req, res) => controller.getCompanyById(req, res));

// POST /admin/companies/:id/block - Bloquer une entreprise
router.post("/companies/:id/block", (req, res) => controller.blockCompany(req, res));

// POST /admin/companies/:id/unblock - Débloquer une entreprise
router.post("/companies/:id/unblock", (req, res) => controller.unblockCompany(req, res));

// POST /admin/companies/:id/verify - Vérifier une entreprise
router.post("/companies/:id/verify", (req, res) => controller.verifyCompany(req, res));

// POST /admin/companies/:id/unverify - Retirer la vérification d'une entreprise
router.post("/companies/:id/unverify", (req, res) => controller.unverifyCompany(req, res));

// POST /admin/companies/:id/certify - Certifier une entreprise
router.post("/companies/:id/certify", (req, res) => controller.certifyCompany(req, res));

// POST /admin/companies/:id/uncertify - Retirer la certification d'une entreprise
router.post("/companies/:id/uncertify", (req, res) => controller.uncertifyCompany(req, res));

// =============================================
// GESTION DES PROJETS
// =============================================

// GET /admin/projects - Liste des projets avec filtres
router.get("/projects", (req, res) => controller.getProjects(req, res));

// GET /admin/projects/:id - Récupérer un projet par ID
router.get("/projects/:id", (req, res) => controller.getProjectById(req, res));

// PATCH /admin/projects/:id/status - Mettre à jour le statut d'un projet
router.patch("/projects/:id/status", (req, res) => controller.updateProjectStatus(req, res));

// DELETE /admin/projects/:id - Supprimer un projet (modération)
router.delete("/projects/:id", (req, res) => controller.deleteProject(req, res));

export default router;
