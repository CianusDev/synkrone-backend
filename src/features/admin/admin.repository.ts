import { query } from "../../config/database";
import {
  Admin,
  AdminLevel,
  DashboardStats,
  UserSession,
  AdminSession,
  SessionStats,
  SuspiciousActivity,
  AdminFreelanceView,
  AdminCompanyView,
  AdminProjectView,
  AdminFreelanceFilters,
  AdminCompanyFilters,
  AdminProjectFilters,
  AdminSessionFilters,
} from "./admin.model";

export class AdminRepository {
  // =============================================
  // GESTION DES ADMINS
  // =============================================

  async createAdmin(admin: Partial<Admin>): Promise<Admin> {
    const result = await query(
      `INSERT INTO admins (username, email, password_hashed, level)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [admin.username, admin.email, admin.password_hashed, admin.level],
    );
    return result.rows[0] as Admin;
  }

  async getAdminById(id: string): Promise<Admin | null> {
    const result = await query(`SELECT * FROM admins WHERE id = $1`, [id]);
    return result.rows[0] as Admin | null;
  }

  async getAdminByUsername(username: string): Promise<Admin | null> {
    const result = await query(`SELECT * FROM admins WHERE username = $1`, [
      username,
    ]);
    return result.rows[0] as Admin | null;
  }

  async updateAdminPassword(
    adminId: string,
    newPasswordHashed: string,
  ): Promise<Admin | null> {
    const result = await query(
      `UPDATE admins SET password_hashed = $1 WHERE id = $2 RETURNING *`,
      [newPasswordHashed, adminId],
    );
    return result.rows[0] as Admin | null;
  }

  async updateAdminLevel(
    adminId: string,
    newLevel: AdminLevel,
  ): Promise<Admin | null> {
    const result = await query(
      `UPDATE admins SET level = $1 WHERE id = $2 RETURNING *`,
      [newLevel, adminId],
    );
    return result.rows[0] as Admin | null;
  }

  async deleteAdminById(id: string): Promise<void> {
    await query(`DELETE FROM admins WHERE id = $1`, [id]);
  }

  async getAllAdmins(): Promise<Admin[]> {
    const result = await query(`SELECT * FROM admins ORDER BY created_at DESC`);
    return result.rows as Admin[];
  }

  // =============================================
  // STATISTIQUES DASHBOARD
  // =============================================

  async getDashboardStats(): Promise<DashboardStats> {
    // Stats utilisateurs
    const userStatsResult = await query(`
      SELECT
        (SELECT COUNT(*) FROM freelances WHERE deleted_at IS NULL) AS total_freelances,
        (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL) AS total_companies,
        (SELECT COUNT(*) FROM freelances WHERE is_verified = true AND deleted_at IS NULL) AS verified_freelances,
        (SELECT COUNT(*) FROM companies WHERE is_verified = true AND deleted_at IS NULL) AS verified_companies,
        (SELECT COUNT(*) FROM freelances WHERE blocked_at IS NOT NULL AND deleted_at IS NULL) AS blocked_freelances,
        (SELECT COUNT(*) FROM companies WHERE blocked_at IS NOT NULL AND deleted_at IS NULL) AS blocked_companies,
        (SELECT COUNT(*) FROM freelances WHERE created_at >= date_trunc('month', CURRENT_DATE) AND deleted_at IS NULL) AS new_freelances_this_month,
        (SELECT COUNT(*) FROM companies WHERE created_at >= date_trunc('month', CURRENT_DATE) AND deleted_at IS NULL) AS new_companies_this_month
    `);

    // Stats projets
    const projectStatsResult = await query(`
      SELECT
        COUNT(*) AS total_projects,
        COUNT(*) FILTER (WHERE status = 'draft') AS draft_projects,
        COUNT(*) FILTER (WHERE status = 'published') AS published_projects,
        COUNT(*) FILTER (WHERE status = 'is_pending') AS pending_projects,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) AS new_projects_this_month
      FROM projects
    `);

    // Stats contrats
    const contractStatsResult = await query(`
      SELECT
        COUNT(*) AS total_contracts,
        COUNT(*) FILTER (WHERE status = 'active') AS active_contracts,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_contracts,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_contracts
      FROM contracts
    `);

    // Stats sessions utilisateurs
    const sessionStatsResult = await query(`
      SELECT * FROM admin_session_stats
    `);

    // Stats sessions admin
    const adminSessionStatsResult = await query(`
      SELECT * FROM admin_admin_session_stats
    `);

    // Stats plateforme - Revenus et commissions depuis les paiements
    const revenueStatsResult = await query(`
      SELECT
        COALESCE(SUM(amount), 0) AS total_revenue,
        COALESCE(SUM(platform_fee), 0) AS total_commissions
      FROM payments
      WHERE status = 'completed'
    `);

    // Stats plateforme - Moyenne des projets et taux de completion depuis les contrats
    const platformContractStats = await query(`
      SELECT
        COALESCE(AVG(total_amount), 0) AS average_project_value,
        CASE
          WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE status = 'completed')::float / COUNT(*)::float) * 100
          ELSE 0
        END AS completion_rate
      FROM contracts
    `);

    const userStats = userStatsResult.rows[0];
    const projectStats = projectStatsResult.rows[0];
    const contractStats = contractStatsResult.rows[0];
    const sessionStats = sessionStatsResult.rows[0];
    const adminSessionStats = adminSessionStatsResult.rows[0];
    const revenueStats = revenueStatsResult.rows[0];
    const contractPlatformStats = platformContractStats.rows[0];

    return {
      users: {
        totalFreelances: parseInt(userStats.total_freelances || "0"),
        totalCompanies: parseInt(userStats.total_companies || "0"),
        verifiedFreelances: parseInt(userStats.verified_freelances || "0"),
        verifiedCompanies: parseInt(userStats.verified_companies || "0"),
        blockedFreelances: parseInt(userStats.blocked_freelances || "0"),
        blockedCompanies: parseInt(userStats.blocked_companies || "0"),
        newFreelancesThisMonth: parseInt(
          userStats.new_freelances_this_month || "0",
        ),
        newCompaniesThisMonth: parseInt(
          userStats.new_companies_this_month || "0",
        ),
      },
      projects: {
        totalProjects: parseInt(projectStats.total_projects || "0"),
        draftProjects: parseInt(projectStats.draft_projects || "0"),
        publishedProjects: parseInt(projectStats.published_projects || "0"),
        pendingProjects: parseInt(projectStats.pending_projects || "0"),
        newProjectsThisMonth: parseInt(
          projectStats.new_projects_this_month || "0",
        ),
      },
      contracts: {
        totalContracts: parseInt(contractStats.total_contracts || "0"),
        activeContracts: parseInt(contractStats.active_contracts || "0"),
        completedContracts: parseInt(contractStats.completed_contracts || "0"),
        cancelledContracts: parseInt(contractStats.cancelled_contracts || "0"),
      },
      sessions: {
        totalActiveSessions: parseInt(sessionStats.active_sessions || "0"),
        activeFreelanceSessions: 0, // À calculer séparément si nécessaire
        activeCompanySessions: 0, // À calculer séparément si nécessaire
        activeAdminSessions: parseInt(
          adminSessionStats.active_admin_sessions || "0",
        ),
        sessionsLast24h: parseInt(sessionStats.sessions_last_24h || "0"),
      },
      platform: {
        totalRevenue: parseFloat(revenueStats.total_revenue || "0"),
        totalCommissions: parseFloat(revenueStats.total_commissions || "0"),
        averageProjectValue: parseFloat(
          contractPlatformStats.average_project_value || "0",
        ),
        completionRate: parseFloat(
          contractPlatformStats.completion_rate || "0",
        ),
      },
    };
  }

  // =============================================
  // GESTION DES SESSIONS
  // =============================================

  async getUserSessions(filters?: AdminSessionFilters): Promise<{
    data: UserSession[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    let values: any[] = [];
    let paramIndex = 1;

    if (filters?.userType) {
      whereConditions.push(`user_type = $${paramIndex++}`);
      values.push(filters.userType);
    }

    if (filters?.sessionStatus) {
      whereConditions.push(`session_status = $${paramIndex++}`);
      values.push(filters.sessionStatus);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const sortBy = filters?.sortBy || "last_activity_at";
    const sortOrder = filters?.sortOrder || "desc";

    const result = await query(
      `SELECT * FROM admin_user_sessions
       ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...values, limit, offset],
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM admin_user_sessions ${whereClause}`,
      values,
    );

    return {
      data: result.rows as UserSession[],
      total: parseInt(countResult.rows[0].total),
      page,
      limit,
    };
  }

  async getAdminSessions(filters?: AdminSessionFilters): Promise<{
    data: AdminSession[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    const sortBy = filters?.sortBy || "last_activity_at";
    const sortOrder = filters?.sortOrder || "desc";

    const result = await query(
      `SELECT * FROM admin_admin_sessions
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM admin_admin_sessions`,
    );

    return {
      data: result.rows as AdminSession[],
      total: parseInt(countResult.rows[0].total),
      page,
      limit,
    };
  }

  async getSessionStats(): Promise<{
    userSessions: SessionStats;
    adminSessions: SessionStats;
  }> {
    const userSessionStats = await query(`SELECT * FROM admin_session_stats`);
    const adminSessionStats = await query(
      `SELECT * FROM admin_admin_session_stats`,
    );

    return {
      userSessions: userSessionStats.rows[0] as SessionStats,
      adminSessions: adminSessionStats.rows[0] as SessionStats,
    };
  }

  async getSuspiciousActivity(): Promise<SuspiciousActivity[]> {
    const result = await query(`SELECT * FROM admin_suspicious_activity`);
    return result.rows as SuspiciousActivity[];
  }

  async revokeUserSession(sessionId: string): Promise<boolean> {
    const result = await query(`SELECT admin_revoke_session($1)`, [sessionId]);
    return result.rows[0].admin_revoke_session;
  }

  async revokeAdminSession(sessionId: string): Promise<boolean> {
    const result = await query(`SELECT admin_revoke_admin_session($1)`, [
      sessionId,
    ]);
    return result.rows[0].admin_revoke_admin_session;
  }

  async revokeAllUserSessions(userId: string): Promise<number> {
    const result = await query(`SELECT admin_revoke_user_sessions($1)`, [
      userId,
    ]);
    return result.rows[0].admin_revoke_user_sessions;
  }

  // =============================================
  // GESTION DES FREELANCES
  // =============================================

  async getFreelances(filters?: AdminFreelanceFilters): Promise<{
    data: AdminFreelanceView[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    let whereConditions: string[] = ["f.deleted_at IS NULL"];
    let values: any[] = [];
    let paramIndex = 1;

    // Construction des filtres
    if (filters?.search) {
      whereConditions.push(
        `(LOWER(f.firstname) LIKE $${paramIndex} OR LOWER(f.lastname) LIKE $${paramIndex + 1} OR LOWER(f.email) LIKE $${paramIndex + 2})`,
      );
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      values.push(searchTerm, searchTerm, searchTerm);
      paramIndex += 3;
    }

    if (filters?.isVerified !== undefined) {
      whereConditions.push(`f.is_verified = $${paramIndex++}`);
      values.push(filters.isVerified);
    }

    if (filters?.isBlocked !== undefined) {
      if (filters.isBlocked) {
        whereConditions.push(`f.blocked_at IS NOT NULL`);
      } else {
        whereConditions.push(`f.blocked_at IS NULL`);
      }
    }

    if (filters?.availability) {
      whereConditions.push(`f.availability = $${paramIndex++}`);
      values.push(filters.availability);
    }

    if (filters?.experience) {
      whereConditions.push(`f.experience = $${paramIndex++}`);
      values.push(filters.experience);
    }

    if (filters?.country) {
      whereConditions.push(`f.country = $${paramIndex++}`);
      values.push(filters.country);
    }

    if (filters?.minTjm) {
      whereConditions.push(`f.tjm >= $${paramIndex++}`);
      values.push(filters.minTjm);
    }

    if (filters?.maxTjm) {
      whereConditions.push(`f.tjm <= $${paramIndex++}`);
      values.push(filters.maxTjm);
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;
    const sortBy = filters?.sortBy || "created_at";
    const sortOrder = filters?.sortOrder || "desc";

    const queryText = `
      SELECT
        f.*,
        (SELECT COUNT(*) FROM applications a WHERE a.freelance_id = f.id) AS applications_count,
        (SELECT COUNT(*) FROM contracts c WHERE c.freelance_id = f.id) AS contracts_count,
        (SELECT AVG(rating) FROM evaluations e WHERE e.evaluated_id = f.id AND e.evaluated_type = 'freelance') AS average_rating,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payments p
         INNER JOIN contracts c ON p.contract_id = c.id
         WHERE c.freelance_id = f.id AND p.status = 'completed') AS total_earnings,
        (SELECT MAX(s.last_activity_at) FROM user_sessions s WHERE s.user_id = f.id) AS last_activity,
        CASE WHEN f.blocked_at IS NOT NULL THEN true ELSE false END AS is_blocked,
        CASE
          WHEN f.blocked_at IS NOT NULL AND f.block_duration = -1 THEN NULL
          WHEN f.blocked_at IS NOT NULL THEN f.blocked_at + INTERVAL '1 day' * f.block_duration
          ELSE NULL
        END AS block_expires_at
      FROM freelances f
      ${whereClause}
      ORDER BY f.${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(limit, offset);

    const result = await query(queryText, values);

    const countResult = await query(
      `SELECT COUNT(*) as total FROM freelances f ${whereClause}`,
      values.slice(0, -2),
    );

    return {
      data: result.rows as AdminFreelanceView[],
      total: parseInt(countResult.rows[0].total),
      page,
      limit,
    };
  }

  async getFreelanceById(id: string): Promise<AdminFreelanceView | null> {
    const result = await query(
      `SELECT
        f.*,
        (SELECT COUNT(*) FROM applications a WHERE a.freelance_id = f.id) AS applications_count,
        (SELECT COUNT(*) FROM contracts c WHERE c.freelance_id = f.id) AS contracts_count,
        (SELECT AVG(rating) FROM evaluations e WHERE e.evaluated_id = f.id AND e.evaluated_type = 'freelance') AS average_rating,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payments p
         INNER JOIN contracts c ON p.contract_id = c.id
         WHERE c.freelance_id = f.id AND p.status = 'completed') AS total_earnings,
        (SELECT MAX(s.last_activity_at) FROM user_sessions s WHERE s.user_id = f.id) AS last_activity,
        CASE WHEN f.blocked_at IS NOT NULL THEN true ELSE false END AS is_blocked,
        CASE
          WHEN f.blocked_at IS NOT NULL AND f.block_duration = -1 THEN NULL
          WHEN f.blocked_at IS NOT NULL THEN f.blocked_at + INTERVAL '1 day' * f.block_duration
          ELSE NULL
        END AS block_expires_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', sk.id,
              'name', sk.name,
              'description', sk.description
            )
          ) FILTER (WHERE sk.id IS NOT NULL),
          '[]'::json
        ) AS skills
       FROM freelances f
       LEFT JOIN freelance_skills fs ON f.id = fs.freelance_id
       LEFT JOIN skills sk ON fs.skill_id = sk.id
       WHERE f.id = $1
       GROUP BY f.id`,
      [id],
    );
    return result.rows[0] as AdminFreelanceView | null;
  }

  async blockFreelance(
    freelanceId: string,
    durationDays: number = -1,
  ): Promise<boolean> {
    const result = await query(`SELECT admin_block_freelance($1, $2)`, [
      freelanceId,
      durationDays,
    ]);
    return result.rows[0].admin_block_freelance;
  }

  async unblockFreelance(freelanceId: string): Promise<boolean> {
    const result = await query(
      `UPDATE freelances SET blocked_at = NULL, block_duration = 0 WHERE id = $1`,
      [freelanceId],
    );
    return (result.rowCount || 0) > 0;
  }

  async verifyFreelance(freelanceId: string): Promise<boolean> {
    const result = await query(
      `UPDATE freelances SET is_verified = true WHERE id = $1`,
      [freelanceId],
    );
    return (result.rowCount || 0) > 0;
  }

  async unverifyFreelance(freelanceId: string): Promise<boolean> {
    const result = await query(
      `UPDATE freelances SET is_verified = false WHERE id = $1`,
      [freelanceId],
    );
    return (result.rowCount || 0) > 0;
  }

  // =============================================
  // GESTION DES ENTREPRISES
  // =============================================

  async getCompanies(filters?: AdminCompanyFilters): Promise<{
    data: AdminCompanyView[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    let whereConditions: string[] = ["c.deleted_at IS NULL"];
    let values: any[] = [];
    let paramIndex = 1;

    // Construction des filtres
    if (filters?.search) {
      whereConditions.push(
        `(LOWER(c.company_name) LIKE $${paramIndex} OR LOWER(c.company_email) LIKE $${paramIndex + 1} OR LOWER(c.industry) LIKE $${paramIndex + 2})`,
      );
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      values.push(searchTerm, searchTerm, searchTerm);
      paramIndex += 3;
    }

    if (filters?.isVerified !== undefined) {
      whereConditions.push(`c.is_verified = $${paramIndex++}`);
      values.push(filters.isVerified);
    }

    if (filters?.isCertified !== undefined) {
      whereConditions.push(`c.is_certified = $${paramIndex++}`);
      values.push(filters.isCertified);
    }

    if (filters?.isBlocked !== undefined) {
      if (filters.isBlocked) {
        whereConditions.push(`c.blocked_at IS NOT NULL`);
      } else {
        whereConditions.push(`c.blocked_at IS NULL`);
      }
    }

    if (filters?.industry) {
      whereConditions.push(`c.industry = $${paramIndex++}`);
      values.push(filters.industry);
    }

    if (filters?.companySize) {
      whereConditions.push(`c.company_size = $${paramIndex++}`);
      values.push(filters.companySize);
    }

    if (filters?.country) {
      whereConditions.push(`c.country = $${paramIndex++}`);
      values.push(filters.country);
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;
    const sortBy = filters?.sortBy || "created_at";
    const sortOrder = filters?.sortOrder || "desc";

    const queryText = `
      SELECT
        c.*,
        (SELECT COUNT(*) FROM projects p WHERE p.company_id = c.id) AS projects_count,
        (SELECT COUNT(*) FROM contracts ct WHERE ct.company_id = c.id) AS contracts_count,
        (SELECT AVG(rating) FROM evaluations e WHERE e.evaluated_id = c.id AND e.evaluated_type = 'company') AS average_rating,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payments p
         INNER JOIN contracts ct ON p.contract_id = ct.id
         WHERE ct.company_id = c.id AND p.status = 'completed') AS total_spent,
        (SELECT MAX(s.last_activity_at) FROM user_sessions s WHERE s.user_id = c.id) AS last_activity,
        CASE WHEN c.blocked_at IS NOT NULL THEN true ELSE false END AS is_blocked,
        CASE
          WHEN c.blocked_at IS NOT NULL AND c.block_duration = -1 THEN NULL
          WHEN c.blocked_at IS NOT NULL THEN c.blocked_at + INTERVAL '1 day' * c.block_duration
          ELSE NULL
        END AS block_expires_at
      FROM companies c
      ${whereClause}
      ORDER BY c.${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(limit, offset);

    const result = await query(queryText, values);

    const countResult = await query(
      `SELECT COUNT(*) as total FROM companies c ${whereClause}`,
      values.slice(0, -2),
    );

    return {
      data: result.rows as AdminCompanyView[],
      total: parseInt(countResult.rows[0].total),
      page,
      limit,
    };
  }

  async getCompanyById(id: string): Promise<AdminCompanyView | null> {
    const result = await query(
      `SELECT
        c.*,
        (SELECT COUNT(*) FROM projects p WHERE p.company_id = c.id) AS projects_count,
        (SELECT COUNT(*) FROM contracts ct WHERE ct.company_id = c.id) AS contracts_count,
        (SELECT AVG(rating) FROM evaluations e WHERE e.evaluated_id = c.id AND e.evaluated_type = 'company') AS average_rating,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payments p
         INNER JOIN contracts ct ON p.contract_id = ct.id
         WHERE ct.company_id = c.id AND p.status = 'completed') AS total_spent,
        (SELECT MAX(s.last_activity_at) FROM user_sessions s WHERE s.user_id = c.id) AS last_activity,
        CASE WHEN c.blocked_at IS NOT NULL THEN true ELSE false END AS is_blocked,
        CASE
          WHEN c.blocked_at IS NOT NULL AND c.block_duration = -1 THEN NULL
          WHEN c.blocked_at IS NOT NULL THEN c.blocked_at + INTERVAL '1 day' * c.block_duration
          ELSE NULL
        END AS block_expires_at
       FROM companies c
       WHERE c.id = $1`,
      [id],
    );
    return result.rows[0] as AdminCompanyView | null;
  }

  async blockCompany(
    companyId: string,
    durationDays: number = -1,
  ): Promise<boolean> {
    const result = await query(`SELECT admin_block_company($1, $2)`, [
      companyId,
      durationDays,
    ]);
    return result.rows[0].admin_block_company;
  }

  async unblockCompany(companyId: string): Promise<boolean> {
    const result = await query(
      `UPDATE companies SET blocked_at = NULL, block_duration = 0 WHERE id = $1`,
      [companyId],
    );
    return (result.rowCount || 0) > 0;
  }

  async verifyCompany(companyId: string): Promise<boolean> {
    const result = await query(
      `UPDATE companies SET is_verified = true WHERE id = $1`,
      [companyId],
    );
    return (result.rowCount || 0) > 0;
  }

  async unverifyCompany(companyId: string): Promise<boolean> {
    const result = await query(
      `UPDATE companies SET is_verified = false WHERE id = $1`,
      [companyId],
    );
    return (result.rowCount || 0) > 0;
  }

  async certifyCompany(companyId: string): Promise<boolean> {
    const result = await query(
      `UPDATE companies SET is_certified = true WHERE id = $1`,
      [companyId],
    );
    return (result.rowCount || 0) > 0;
  }

  async uncertifyCompany(companyId: string): Promise<boolean> {
    const result = await query(
      `UPDATE companies SET is_certified = false WHERE id = $1`,
      [companyId],
    );
    return (result.rowCount || 0) > 0;
  }

  // =============================================
  // GESTION DES PROJETS
  // =============================================

  async getProjects(filters?: AdminProjectFilters): Promise<{
    data: AdminProjectView[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    let values: any[] = [];
    let paramIndex = 1;

    // Construction des filtres
    if (filters?.search) {
      whereConditions.push(
        `(LOWER(p.title) LIKE $${paramIndex} OR LOWER(p.description) LIKE $${paramIndex + 1})`,
      );
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      values.push(searchTerm, searchTerm);
      paramIndex += 2;
    }

    if (filters?.status) {
      whereConditions.push(`p.status = $${paramIndex++}`);
      values.push(filters.status);
    }

    if (filters?.typeWork) {
      whereConditions.push(`p.type_work = $${paramIndex++}`);
      values.push(filters.typeWork);
    }

    if (filters?.companyId) {
      whereConditions.push(`p.company_id = $${paramIndex++}`);
      values.push(filters.companyId);
    }

    if (filters?.categoryId) {
      whereConditions.push(`p.category_id = $${paramIndex++}`);
      values.push(filters.categoryId);
    }

    if (filters?.minBudget) {
      whereConditions.push(`p.budget_min >= $${paramIndex++}`);
      values.push(filters.minBudget);
    }

    if (filters?.maxBudget) {
      whereConditions.push(`p.budget_max <= $${paramIndex++}`);
      values.push(filters.maxBudget);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";
    const sortBy = filters?.sortBy || "created_at";
    const sortOrder = filters?.sortOrder || "desc";

    const queryText = `
      SELECT
        p.*,
        (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id) AS applications_count,
        (SELECT COUNT(*) FROM project_invitations pi WHERE pi.project_id = p.id) AS invitations_count,
        json_build_object(
          'id', c.id,
          'company_name', c.company_name,
          'company_email', c.company_email,
          'logo_url', c.logo_url,
          'is_verified', c.is_verified,
          'is_certified', c.is_certified
        ) AS company
      FROM projects p
      INNER JOIN companies c ON p.company_id = c.id
      ${whereClause}
      ORDER BY p.${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(limit, offset);

    const result = await query(queryText, values);

    const countResult = await query(
      `SELECT COUNT(*) as total FROM projects p ${whereClause}`,
      values.slice(0, -2),
    );

    return {
      data: result.rows as AdminProjectView[],
      total: parseInt(countResult.rows[0].total),
      page,
      limit,
    };
  }

  async getProjectById(id: string): Promise<AdminProjectView | null> {
    const result = await query(
      `SELECT
        p.*,
        (SELECT COUNT(*) FROM applications a WHERE a.project_id = p.id) AS applications_count,
        (SELECT COUNT(*) FROM project_invitations pi WHERE pi.project_id = p.id) AS invitations_count,
        json_build_object(
          'id', c.id,
          'company_name', c.company_name,
          'company_email', c.company_email,
          'logo_url', c.logo_url,
          'is_verified', c.is_verified,
          'is_certified', c.is_certified
        ) AS company
       FROM projects p
       INNER JOIN companies c ON p.company_id = c.id
       WHERE p.id = $1`,
      [id],
    );
    return result.rows[0] as AdminProjectView | null;
  }

  async updateProjectStatus(
    projectId: string,
    status: string,
  ): Promise<boolean> {
    const result = await query(
      `UPDATE projects SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [status, projectId],
    );
    return (result.rowCount || 0) > 0;
  }

  async deleteProject(projectId: string): Promise<boolean> {
    const result = await query(`DELETE FROM projects WHERE id = $1`, [
      projectId,
    ]);
    return (result.rowCount || 0) > 0;
  }

  // =============================================
  // FONCTIONS UTILITAIRES
  // =============================================

  async cleanupExpiredSessions(): Promise<{
    userSessions: number;
    adminSessions: number;
    otps: number;
  }> {
    const userSessionsResult = await query(`SELECT cleanup_expired_sessions()`);
    const adminSessionsResult = await query(
      `SELECT cleanup_expired_admin_sessions()`,
    );
    const otpsResult = await query(`SELECT cleanup_expired_otps()`);

    return {
      userSessions: userSessionsResult.rows[0].cleanup_expired_sessions,
      adminSessions: adminSessionsResult.rows[0].cleanup_expired_admin_sessions,
      otps: otpsResult.rows[0].cleanup_expired_otps,
    };
  }
}
