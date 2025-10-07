import { CompanyRepository } from "../company/company.repository";
import { FreelanceRepository } from "../freelance/freelance.repository";
import { ProjectsRepository } from "../projects/projects.repository";
import {
  Admin,
  AdminCompanyFilters,
  AdminCompanyView,
  AdminFreelanceFilters,
  AdminFreelanceView,
  AdminLevel,
  AdminProjectFilters,
  AdminProjectView,
  AdminSession,
  AdminSessionFilters,
  DashboardStats,
  SessionStats,
  SuspiciousActivity,
  UserSession,
} from "./admin.model";
import { AdminRepository } from "./admin.repository";

export class AdminService {
  private readonly repository: AdminRepository;
  private readonly freelanceRepository: FreelanceRepository;
  private readonly companyRepository: CompanyRepository;
  private readonly projectsRepository: ProjectsRepository;

  constructor() {
    this.repository = new AdminRepository();
    this.freelanceRepository = new FreelanceRepository();
    this.companyRepository = new CompanyRepository();
    this.projectsRepository = new ProjectsRepository();
  }

  // =============================================
  // GESTION DES ADMINS
  // =============================================

  async createAdmin(data: {
    username: string;
    email?: string;
    password_hashed: string;
    level: AdminLevel;
  }): Promise<Admin> {
    // Vérifier que le nom d'utilisateur n'existe pas déjà
    const existingAdmin = await this.repository.getAdminByUsername(
      data.username,
    );
    if (existingAdmin) {
      throw new Error("Ce nom d'utilisateur existe déjà");
    }

    // Vérifier l'email s'il est fourni
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error("Format d'email invalide");
      }
    }

    return this.repository.createAdmin(data);
  }

  async getAdminById(id: string): Promise<Admin | null> {
    return this.repository.getAdminById(id);
  }

  async getAdminByUsername(username: string): Promise<Admin | null> {
    return this.repository.getAdminByUsername(username);
  }

  async updateAdminPassword(
    adminId: string,
    newPasswordHashed: string,
  ): Promise<Admin | null> {
    const admin = await this.repository.getAdminById(adminId);
    if (!admin) {
      throw new Error("Administrateur non trouvé");
    }

    return this.repository.updateAdminPassword(adminId, newPasswordHashed);
  }

  async updateAdminLevel(
    adminId: string,
    newLevel: AdminLevel,
    requestingAdminId: string,
  ): Promise<Admin | null> {
    // Seuls les super_admin peuvent modifier les niveaux
    const requestingAdmin =
      await this.repository.getAdminById(requestingAdminId);
    if (!requestingAdmin || requestingAdmin.level !== AdminLevel.SUPER_ADMIN) {
      throw new Error("Permissions insuffisantes");
    }

    const targetAdmin = await this.repository.getAdminById(adminId);
    if (!targetAdmin) {
      throw new Error("Administrateur non trouvé");
    }

    // Un admin ne peut pas modifier son propre niveau
    if (adminId === requestingAdminId) {
      throw new Error("Impossible de modifier son propre niveau d'accès");
    }

    return this.repository.updateAdminLevel(adminId, newLevel);
  }

  async deleteAdmin(adminId: string, requestingAdminId: string): Promise<void> {
    // Seuls les super_admin peuvent supprimer des admins
    const requestingAdmin =
      await this.repository.getAdminById(requestingAdminId);
    if (!requestingAdmin || requestingAdmin.level !== AdminLevel.SUPER_ADMIN) {
      throw new Error("Permissions insuffisantes");
    }

    const targetAdmin = await this.repository.getAdminById(adminId);
    if (!targetAdmin) {
      throw new Error("Administrateur non trouvé");
    }

    // Un admin ne peut pas se supprimer lui-même
    if (adminId === requestingAdminId) {
      throw new Error("Impossible de supprimer son propre compte");
    }

    await this.repository.deleteAdminById(adminId);
  }

  async getAllAdmins(): Promise<Admin[]> {
    return this.repository.getAllAdmins();
  }

  // =============================================
  // STATISTIQUES DASHBOARD
  // =============================================

  async getDashboardStats(): Promise<DashboardStats> {
    return this.repository.getDashboardStats();
  }

  // =============================================
  // GESTION DES SESSIONS
  // =============================================

  async getUserSessions(filters?: AdminSessionFilters): Promise<{
    data: UserSession[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.repository.getUserSessions(filters);
    const totalPages = Math.ceil(result.total / result.limit);

    return {
      ...result,
      totalPages,
    };
  }

  async getAdminSessions(filters?: AdminSessionFilters): Promise<{
    data: AdminSession[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.repository.getAdminSessions(filters);
    const totalPages = Math.ceil(result.total / result.limit);

    return {
      ...result,
      totalPages,
    };
  }

  async getSessionStats(): Promise<{
    userSessions: SessionStats;
    adminSessions: SessionStats;
  }> {
    return this.repository.getSessionStats();
  }

  async getSuspiciousActivity(): Promise<SuspiciousActivity[]> {
    return this.repository.getSuspiciousActivity();
  }

  async revokeUserSession(
    sessionId: string,
    adminId: string,
    reason?: string,
  ): Promise<boolean> {
    const admin = await this.repository.getAdminById(adminId);
    if (!admin) {
      throw new Error("Administrateur non trouvé");
    }

    const success = await this.repository.revokeUserSession(sessionId);

    // TODO: Log de l'action admin
    if (success) {
      console.log(
        `Admin ${admin.username} a révoqué la session ${sessionId}. Raison: ${reason || "Non spécifiée"}`,
      );
    }

    return success;
  }

  async revokeAdminSession(
    sessionId: string,
    requestingAdminId: string,
    reason?: string,
  ): Promise<boolean> {
    const requestingAdmin =
      await this.repository.getAdminById(requestingAdminId);
    if (!requestingAdmin || requestingAdmin.level !== AdminLevel.SUPER_ADMIN) {
      throw new Error("Permissions insuffisantes");
    }

    const success = await this.repository.revokeAdminSession(sessionId);

    if (success) {
      console.log(
        `Admin ${requestingAdmin.username} a révoqué la session admin ${sessionId}. Raison: ${reason || "Non spécifiée"}`,
      );
    }

    return success;
  }

  async revokeAllUserSessions(
    userId: string,
    adminId: string,
    reason?: string,
  ): Promise<number> {
    const admin = await this.repository.getAdminById(adminId);
    if (!admin) {
      throw new Error("Administrateur non trouvé");
    }

    const revokedCount = await this.repository.revokeAllUserSessions(userId);

    if (revokedCount > 0) {
      console.log(
        `Admin ${admin.username} a révoqué ${revokedCount} session(s) pour l'utilisateur ${userId}. Raison: ${reason || "Non spécifiée"}`,
      );
    }

    return revokedCount;
  }

  // =============================================
  // GESTION DES FREELANCES
  // =============================================

  async getFreelances(filters?: AdminFreelanceFilters): Promise<{
    data: AdminFreelanceView[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.repository.getFreelances(filters);
    const totalPages = Math.ceil(result.total / result.limit);

    return {
      ...result,
      totalPages,
    };
  }

  async getFreelanceById(id: string): Promise<AdminFreelanceView | null> {
    return this.repository.getFreelanceById(id);
  }

  async blockFreelance(
    freelanceId: string,
    adminId: string,
    durationDays: number = -1,
    reason?: string,
  ): Promise<boolean> {
    const admin = await this.repository.getAdminById(adminId);
    if (!admin) {
      throw new Error("Administrateur non trouvé");
    }

    const freelance = await this.repository.getFreelanceById(freelanceId);
    if (!freelance) {
      throw new Error("Freelance non trouvé");
    }

    if (freelance.blocked_at) {
      throw new Error("Ce freelance est déjà bloqué");
    }

    const success = await this.repository.blockFreelance(
      freelanceId,
      durationDays,
    );

    if (success) {
      const duration =
        durationDays === -1 ? "indéfiniment" : `${durationDays} jour(s)`;
      console.log(
        `Admin ${admin.username} a bloqué le freelance ${freelance.email} pour ${duration}. Raison: ${reason || "Non spécifiée"}`,
      );
    }

    return success;
  }

  async unblockFreelance(
    freelanceId: string,
    adminId: string,
    reason?: string,
  ): Promise<boolean> {
    const admin = await this.repository.getAdminById(adminId);
    if (!admin) {
      throw new Error("Administrateur non trouvé");
    }

    const freelance = await this.repository.getFreelanceById(freelanceId);
    if (!freelance) {
      throw new Error("Freelance non trouvé");
    }

    if (!freelance.is_blocked) {
      throw new Error("Ce freelance n'est pas bloqué");
    }

    const success = await this.repository.unblockFreelance(freelanceId);

    if (success) {
      console.log(
        `Admin ${admin.username} a débloqué le freelance ${freelance.email}. Raison: ${reason || "Non spécifiée"}`,
      );
    }

    return success;
  }

  async verifyFreelance(
    freelanceId: string,
    adminId: string,
    reason?: string,
  ): Promise<boolean> {
    const admin = await this.repository.getAdminById(adminId);
    if (!admin) {
      throw new Error("Administrateur non trouvé");
    }

    const freelance = await this.repository.getFreelanceById(freelanceId);
    if (!freelance) {
      throw new Error("Freelance non trouvé");
    }

    if (freelance.is_verified) {
      throw new Error("Ce freelance est déjà vérifié");
    }

    const success = await this.repository.verifyFreelance(freelanceId);

    if (success) {
      console.log(
        `Admin ${admin.username} a vérifié le freelance ${freelance.email}. Raison: ${reason || "Vérification manuelle"}`,
      );
    }

    return success;
  }

  async unverifyFreelance(
    freelanceId: string,
    adminId: string,
    reason?: string,
  ): Promise<boolean> {
    const admin = await this.repository.getAdminById(adminId);
    if (!admin) {
      throw new Error("Administrateur non trouvé");
    }

    const freelance = await this.repository.getFreelanceById(freelanceId);
    if (!freelance) {
      throw new Error("Freelance non trouvé");
    }

    if (!freelance.is_verified) {
      throw new Error("Ce freelance n'est pas vérifié");
    }

    const success = await this.repository.unverifyFreelance(freelanceId);

    if (success) {
      console.log(
        `Admin ${admin.username} a retiré la vérification du freelance ${freelance.email}. Raison: ${reason || "Non spécifiée"}`,
      );
    }

    return success;
  }

  // =============================================
  // GESTION DES ENTREPRISES
  // =============================================

  async getCompanies(filters?: AdminCompanyFilters): Promise<{
    data: AdminCompanyView[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.repository.getCompanies(filters);
    const totalPages = Math.ceil(result.total / result.limit);

    return {
      ...result,
      totalPages,
    };
  }

  async getCompanyById(id: string): Promise<AdminCompanyView | null> {
    return this.repository.getCompanyById(id);
  }

  async blockCompany(
    companyId: string,
    adminId: string,
    durationDays: number = -1,
    reason?: string,
  ): Promise<boolean> {
    const admin = await this.repository.getAdminById(adminId);
    if (!admin) {
      throw new Error("Administrateur non trouvé");
    }

    const company = await this.repository.getCompanyById(companyId);
    if (!company) {
      throw new Error("Entreprise non trouvée");
    }

    if (company.is_blocked) {
      throw new Error("Cette entreprise est déjà bloquée");
    }

    const success = await this.repository.blockCompany(companyId, durationDays);

    if (success) {
      const duration =
        durationDays === -1 ? "indéfiniment" : `${durationDays} jour(s)`;
      console.log(
        `Admin ${admin.username} a bloqué l'entreprise ${company.company_email} pour ${duration}. Raison: ${reason || "Non spécifiée"}`,
      );
    }

    return success;
  }

  async unblockCompany(
    companyId: string,
    adminId: string,
    reason?: string,
  ): Promise<boolean> {
    const admin = await this.repository.getAdminById(adminId);
    if (!admin) {
      throw new Error("Administrateur non trouvé");
    }

    const company = await this.repository.getCompanyById(companyId);
    if (!company) {
      throw new Error("Entreprise non trouvée");
    }

    if (!company.is_blocked) {
      throw new Error("Cette entreprise n'est pas bloquée");
    }

    const success = await this.repository.unblockCompany(companyId);

    if (success) {
      console.log(
        `Admin ${admin.username} a débloqué l'entreprise ${company.company_email}. Raison: ${reason || "Non spécifiée"}`,
      );
    }

    return success;
  }

  async verifyCompany(
    companyId: string,
    adminId: string,
    reason?: string,
  ): Promise<boolean> {
    const admin = await this.repository.getAdminById(adminId);
    if (!admin) {
      throw new Error("Administrateur non trouvé");
    }

    const company = await this.repository.getCompanyById(companyId);
    if (!company) {
      throw new Error("Entreprise non trouvée");
    }

    if (company.is_verified) {
      throw new Error("Cette entreprise est déjà vérifiée");
    }

    const success = await this.repository.verifyCompany(companyId);

    if (success) {
      console.log(
        `Admin ${admin.username} a vérifié l'entreprise ${company.company_email}. Raison: ${reason || "Vérification manuelle"}`,
      );
    }

    return success;
  }

  async unverifyCompany(
    companyId: string,
    adminId: string,
    reason?: string,
  ): Promise<boolean> {
    const admin = await this.repository.getAdminById(adminId);
    if (!admin) {
      throw new Error("Administrateur non trouvé");
    }

    const company = await this.repository.getCompanyById(companyId);
    if (!company) {
      throw new Error("Entreprise non trouvée");
    }

    if (!company.is_verified) {
      throw new Error("Cette entreprise n'est pas vérifiée");
    }

    const success = await this.repository.unverifyCompany(companyId);

    if (success) {
      console.log(
        `Admin ${admin.username} a retiré la vérification de l'entreprise ${company.company_email}. Raison: ${reason || "Non spécifiée"}`,
      );
    }

    return success;
  }

  async certifyCompany(
    companyId: string,
    adminId: string,
    reason?: string,
  ): Promise<boolean> {
    const admin = await this.repository.getAdminById(adminId);
    if (!admin) {
      throw new Error("Administrateur non trouvé");
    }

    const company = await this.repository.getCompanyById(companyId);
    if (!company) {
      throw new Error("Entreprise non trouvée");
    }

    if (company.is_certified) {
      throw new Error("Cette entreprise est déjà certifiée");
    }

    // Une entreprise doit être vérifiée avant d'être certifiée
    if (!company.is_verified) {
      throw new Error("L'entreprise doit être vérifiée avant d'être certifiée");
    }

    const success = await this.repository.certifyCompany(companyId);

    if (success) {
      console.log(
        `Admin ${admin.username} a certifié l'entreprise ${company.company_email}. Raison: ${reason || "Certification accordée"}`,
      );
    }

    return success;
  }

  async uncertifyCompany(
    companyId: string,
    adminId: string,
    reason?: string,
  ): Promise<boolean> {
    const admin = await this.repository.getAdminById(adminId);
    if (!admin) {
      throw new Error("Administrateur non trouvé");
    }

    const company = await this.repository.getCompanyById(companyId);
    if (!company) {
      throw new Error("Entreprise non trouvée");
    }

    if (!company.is_certified) {
      throw new Error("Cette entreprise n'est pas certifiée");
    }

    const success = await this.repository.uncertifyCompany(companyId);

    if (success) {
      console.log(
        `Admin ${admin.username} a retiré la certification de l'entreprise ${company.company_email}. Raison: ${reason || "Non spécifiée"}`,
      );
    }

    return success;
  }

  // =============================================
  // GESTION DES PROJETS
  // =============================================

  async getProjects(filters?: AdminProjectFilters): Promise<{
    data: AdminProjectView[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.repository.getProjects(filters);
    const totalPages = Math.ceil(result.total / result.limit);

    return {
      ...result,
      totalPages,
    };
  }

  async getProjectById(id: string): Promise<AdminProjectView | null> {
    return this.repository.getProjectById(id);
  }

  async updateProjectStatus(
    projectId: string,
    status: string,
    adminId: string,
    reason?: string,
  ): Promise<boolean> {
    const admin = await this.repository.getAdminById(adminId);
    if (!admin) {
      throw new Error("Administrateur non trouvé");
    }

    const project = await this.repository.getProjectById(projectId);
    if (!project) {
      throw new Error("Projet non trouvé");
    }

    // Validation du statut
    const validStatuses = ["draft", "published", "is_pending"];
    if (!validStatuses.includes(status)) {
      throw new Error("Statut de projet invalide");
    }

    const success = await this.repository.updateProjectStatus(
      projectId,
      status,
    );

    if (success) {
      console.log(
        `Admin ${admin.username} a changé le statut du projet "${project.title}" en "${status}". Raison: ${reason || "Modération"}`,
      );
    }

    return success;
  }

  async deleteProject(
    projectId: string,
    adminId: string,
    reason?: string,
  ): Promise<boolean> {
    const admin = await this.repository.getAdminById(adminId);
    if (!admin) {
      throw new Error("Administrateur non trouvé");
    }

    const project = await this.repository.getProjectById(projectId);
    if (!project) {
      throw new Error("Projet non trouvé");
    }

    // Vérifier qu'il n'y a pas de contrats actifs
    // TODO: Ajouter cette vérification si nécessaire

    const success = await this.repository.deleteProject(projectId);

    if (success) {
      console.log(
        `Admin ${admin.username} a supprimé le projet "${project.title}". Raison: ${reason || "Modération"}`,
      );
    }

    return success;
  }

  // =============================================
  // FONCTIONS UTILITAIRES
  // =============================================

  async cleanupExpiredSessions(): Promise<{
    userSessions: number;
    adminSessions: number;
    otps: number;
  }> {
    return this.repository.cleanupExpiredSessions();
  }

  /**
   * Valide les permissions d'un admin pour une action donnée
   */
  async validateAdminPermissions(
    adminId: string,
    action: string,
    targetType?: string,
  ): Promise<boolean> {
    const admin = await this.repository.getAdminById(adminId);
    if (!admin) {
      return false;
    }

    // Les super_admin ont tous les droits
    if (admin.level === AdminLevel.SUPER_ADMIN) {
      return true;
    }

    // Les modérateurs peuvent gérer les utilisateurs et projets
    if (admin.level === AdminLevel.MODERATEUR) {
      const allowedActions = [
        "view_users",
        "block_user",
        "verify_user",
        "view_projects",
        "moderate_project",
        "view_sessions",
        "revoke_user_session",
      ];
      return allowedActions.includes(action);
    }

    // Le support peut seulement consulter
    if (admin.level === AdminLevel.SUPPORT) {
      const allowedActions = [
        "view_users",
        "view_projects",
        "view_sessions",
        "view_stats",
      ];
      return allowedActions.includes(action);
    }

    return false;
  }

  /**
   * Génère un rapport d'activité pour un utilisateur
   */
  async generateUserActivityReport(
    userId: string,
    userType: "freelance" | "company",
    adminId: string,
  ): Promise<any> {
    const admin = await this.repository.getAdminById(adminId);
    if (!admin) {
      throw new Error("Administrateur non trouvé");
    }

    // TODO: Implémenter la génération de rapport
    // Cela pourrait inclure:
    // - Historique des connexions
    // - Projets/candidatures
    // - Transactions
    // - Évaluations
    // - Messages/litiges

    return {
      userId,
      userType,
      generatedBy: admin.username,
      generatedAt: new Date(),
      // ... autres données du rapport
    };
  }
}
