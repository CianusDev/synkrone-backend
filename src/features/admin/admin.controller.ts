import { Request, Response } from "express";
import { ZodError } from "zod";
import { AdminService } from "./admin.service";
import {
  createAdminSchema,
  updateAdminPasswordSchema,
  updateAdminLevelSchema,
  adminIdSchema,
  blockUserSchema,
  verifyUserSchema,
  updateProjectStatusSchema,
  adminFreelanceFiltersSchema,
  adminCompanyFiltersSchema,
  adminProjectFiltersSchema,
  adminSessionFiltersSchema,
  revokeSessionSchema,
} from "./admin.schema";
import { Admin } from "./admin.model";

export class AdminController {
  private readonly service: AdminService;

  constructor() {
    this.service = new AdminService();
  }

  private handleError(error: unknown, res: Response) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Erreur de validation",
        errors: error.issues,
      });
    }
    if (typeof error === "object" && error !== null && "message" in error) {
      return res.status(400).json({
        success: false,
        message:
          (error as { message?: string }).message || "Une erreur est survenue",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Une erreur interne est survenue",
    });
  }

  // =============================================
  // DASHBOARD & STATS
  // =============================================

  async getDashboardStats(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const stats = await this.service.getDashboardStats();

      res.status(200).json({
        success: true,
        data: stats,
        message: "Statistiques du dashboard récupérées avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // =============================================
  // GESTION DES ADMINS
  // =============================================

  async createAdmin(req: Request & { admin?: Admin }, res: Response) {
    try {
      const requestingAdmin = req.admin;
      if (!requestingAdmin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const validated = createAdminSchema.parse(req.body);
      const newAdmin = await this.service.createAdmin(validated);

      // Ne pas retourner le mot de passe
      const { password_hashed, ...adminResponse } = newAdmin;

      res.status(201).json({
        success: true,
        data: adminResponse,
        message: "Administrateur créé avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getAllAdmins(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const admins = await this.service.getAllAdmins();

      // Ne pas retourner les mots de passe
      const adminsResponse = admins.map(
        ({ password_hashed, ...admin }) => admin,
      );

      res.status(200).json({
        success: true,
        data: adminsResponse,
        message: "Liste des administrateurs récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getAdminById(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const { id } = adminIdSchema.parse(req.params);
      const targetAdmin = await this.service.getAdminById(id);

      if (!targetAdmin) {
        return res.status(404).json({
          success: false,
          message: "Administrateur non trouvé",
        });
      }

      // Ne pas retourner le mot de passe
      const { password_hashed, ...adminResponse } = targetAdmin;

      res.status(200).json({
        success: true,
        data: adminResponse,
        message: "Administrateur récupéré avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async updateAdminPassword(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const { id } = adminIdSchema.parse(req.params);
      const validated = updateAdminPasswordSchema.parse(req.body);

      const updatedAdmin = await this.service.updateAdminPassword(
        id,
        validated.password_hashed,
      );

      if (!updatedAdmin) {
        return res.status(404).json({
          success: false,
          message: "Administrateur non trouvé",
        });
      }

      // Ne pas retourner le mot de passe
      const { password_hashed, ...adminResponse } = updatedAdmin;

      res.status(200).json({
        success: true,
        data: adminResponse,
        message: "Mot de passe mis à jour avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async updateAdminLevel(req: Request & { admin?: Admin }, res: Response) {
    try {
      const requestingAdmin = req.admin;
      if (!requestingAdmin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const { id } = adminIdSchema.parse(req.params);
      const validated = updateAdminLevelSchema.parse(req.body);

      const updatedAdmin = await this.service.updateAdminLevel(
        id,
        validated.level,
        requestingAdmin.id,
      );

      if (!updatedAdmin) {
        return res.status(404).json({
          success: false,
          message: "Administrateur non trouvé",
        });
      }

      // Ne pas retourner le mot de passe
      const { password_hashed, ...adminResponse } = updatedAdmin;

      res.status(200).json({
        success: true,
        data: adminResponse,
        message: "Niveau d'accès mis à jour avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async deleteAdmin(req: Request & { admin?: Admin }, res: Response) {
    try {
      const requestingAdmin = req.admin;
      if (!requestingAdmin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const { id } = adminIdSchema.parse(req.params);

      await this.service.deleteAdmin(id, requestingAdmin.id);

      res.status(204).send();
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // =============================================
  // GESTION DES SESSIONS
  // =============================================

  async getUserSessions(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const filters = adminSessionFiltersSchema.parse(req.query);
      const result = await this.service.getUserSessions(filters);

      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        message: "Sessions utilisateurs récupérées avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getAdminSessions(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const filters = adminSessionFiltersSchema.parse(req.query);
      const result = await this.service.getAdminSessions(filters);

      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        message: "Sessions administrateurs récupérées avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getSessionStats(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const stats = await this.service.getSessionStats();

      res.status(200).json({
        success: true,
        data: stats,
        message: "Statistiques des sessions récupérées avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getSuspiciousActivity(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const activities = await this.service.getSuspiciousActivity();

      res.status(200).json({
        success: true,
        data: activities,
        message: "Activités suspectes récupérées avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async revokeUserSession(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const validated = revokeSessionSchema.parse(req.body);
      const success = await this.service.revokeUserSession(
        validated.sessionId,
        admin.id,
        validated.reason,
      );

      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Session non trouvée ou déjà révoquée",
        });
      }

      res.status(200).json({
        success: true,
        message: "Session utilisateur révoquée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async revokeAdminSession(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const validated = revokeSessionSchema.parse(req.body);
      const success = await this.service.revokeAdminSession(
        validated.sessionId,
        admin.id,
        validated.reason,
      );

      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Session admin non trouvée ou déjà révoquée",
        });
      }

      res.status(200).json({
        success: true,
        message: "Session administrateur révoquée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async revokeAllUserSessions(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const { id: userId } = adminIdSchema.parse(req.params);
      const { reason } = req.body;

      const revokedCount = await this.service.revokeAllUserSessions(
        userId,
        admin.id,
        reason,
      );

      res.status(200).json({
        success: true,
        data: { revokedCount },
        message: `${revokedCount} session(s) révoquée(s) avec succès`,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // =============================================
  // GESTION DES FREELANCES
  // =============================================

  async getFreelances(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const filters = adminFreelanceFiltersSchema.parse(req.query);
      const result = await this.service.getFreelances(filters);

      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        message: "Liste des freelances récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getFreelanceById(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const { id } = adminIdSchema.parse(req.params);
      const freelance = await this.service.getFreelanceById(id);

      if (!freelance) {
        return res.status(404).json({
          success: false,
          message: "Freelance non trouvé",
        });
      }

      res.status(200).json({
        success: true,
        data: freelance,
        message: "Freelance récupéré avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async blockFreelance(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const { id } = adminIdSchema.parse(req.params);
      const validated = blockUserSchema.parse(req.body);

      const success = await this.service.blockFreelance(
        id,
        admin.id,
        validated.durationDays,
        validated.reason,
      );

      if (!success) {
        return res.status(400).json({
          success: false,
          message: "Impossible de bloquer ce freelance",
        });
      }

      res.status(200).json({
        success: true,
        message: "Freelance bloqué avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async unblockFreelance(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const { id } = adminIdSchema.parse(req.params);
      const { reason } = req.body;

      const success = await this.service.unblockFreelance(id, admin.id, reason);

      if (!success) {
        return res.status(400).json({
          success: false,
          message: "Impossible de débloquer ce freelance",
        });
      }

      res.status(200).json({
        success: true,
        message: "Freelance débloqué avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async verifyFreelance(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const { id } = adminIdSchema.parse(req.params);
      const validated = verifyUserSchema.parse(req.body);

      const success = await this.service.verifyFreelance(
        id,
        admin.id,
        validated.reason,
      );

      if (!success) {
        return res.status(400).json({
          success: false,
          message: "Impossible de vérifier ce freelance",
        });
      }

      res.status(200).json({
        success: true,
        message: "Freelance vérifié avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async unverifyFreelance(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const { id } = adminIdSchema.parse(req.params);
      const validated = verifyUserSchema.parse(req.body);

      const success = await this.service.unverifyFreelance(
        id,
        admin.id,
        validated.reason,
      );

      if (!success) {
        return res.status(400).json({
          success: false,
          message: "Impossible de retirer la vérification de ce freelance",
        });
      }

      res.status(200).json({
        success: true,
        message: "Vérification du freelance retirée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // =============================================
  // GESTION DES ENTREPRISES
  // =============================================

  async getCompanies(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const filters = adminCompanyFiltersSchema.parse(req.query);
      const result = await this.service.getCompanies(filters);

      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        message: "Liste des entreprises récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getCompanyById(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const { id } = adminIdSchema.parse(req.params);
      const company = await this.service.getCompanyById(id);

      if (!company) {
        return res.status(404).json({
          success: false,
          message: "Entreprise non trouvée",
        });
      }

      res.status(200).json({
        success: true,
        data: company,
        message: "Entreprise récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async blockCompany(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const { id } = adminIdSchema.parse(req.params);
      const validated = blockUserSchema.parse(req.body);

      const success = await this.service.blockCompany(
        id,
        admin.id,
        validated.durationDays,
        validated.reason,
      );

      if (!success) {
        return res.status(400).json({
          success: false,
          message: "Impossible de bloquer cette entreprise",
        });
      }

      res.status(200).json({
        success: true,
        message: "Entreprise bloquée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async unblockCompany(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const { id } = adminIdSchema.parse(req.params);
      const { reason } = req.body;

      const success = await this.service.unblockCompany(id, admin.id, reason);

      if (!success) {
        return res.status(400).json({
          success: false,
          message: "Impossible de débloquer cette entreprise",
        });
      }

      res.status(200).json({
        success: true,
        message: "Entreprise débloquée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async verifyCompany(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const { id } = adminIdSchema.parse(req.params);
      const validated = verifyUserSchema.parse(req.body);

      const success = await this.service.verifyCompany(
        id,
        admin.id,
        validated.reason,
      );

      if (!success) {
        return res.status(400).json({
          success: false,
          message: "Impossible de vérifier cette entreprise",
        });
      }

      res.status(200).json({
        success: true,
        message: "Entreprise vérifiée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async unverifyCompany(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const { id } = adminIdSchema.parse(req.params);
      const validated = verifyUserSchema.parse(req.body);

      const success = await this.service.unverifyCompany(
        id,
        admin.id,
        validated.reason,
      );

      if (!success) {
        return res.status(400).json({
          success: false,
          message: "Impossible de retirer la vérification de cette entreprise",
        });
      }

      res.status(200).json({
        success: true,
        message: "Vérification de l'entreprise retirée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async certifyCompany(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const { id } = adminIdSchema.parse(req.params);
      const validated = verifyUserSchema.parse(req.body);

      const success = await this.service.certifyCompany(
        id,
        admin.id,
        validated.reason,
      );

      if (!success) {
        return res.status(400).json({
          success: false,
          message: "Impossible de certifier cette entreprise",
        });
      }

      res.status(200).json({
        success: true,
        message: "Entreprise certifiée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async uncertifyCompany(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const { id } = adminIdSchema.parse(req.params);
      const validated = verifyUserSchema.parse(req.body);

      const success = await this.service.uncertifyCompany(
        id,
        admin.id,
        validated.reason,
      );

      if (!success) {
        return res.status(400).json({
          success: false,
          message: "Impossible de retirer la certification de cette entreprise",
        });
      }

      res.status(200).json({
        success: true,
        message: "Certification de l'entreprise retirée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // =============================================
  // GESTION DES PROJETS
  // =============================================

  async getProjects(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const filters = adminProjectFiltersSchema.parse(req.query);
      const result = await this.service.getProjects(filters);

      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        message: "Liste des projets récupérée avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async getProjectById(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const { id } = adminIdSchema.parse(req.params);
      const project = await this.service.getProjectById(id);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Projet non trouvé",
        });
      }

      res.status(200).json({
        success: true,
        data: project,
        message: "Projet récupéré avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async updateProjectStatus(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const { id } = adminIdSchema.parse(req.params);
      const validated = updateProjectStatusSchema.parse(req.body);

      const success = await this.service.updateProjectStatus(
        id,
        validated.status,
        admin.id,
        validated.reason,
      );

      if (!success) {
        return res.status(400).json({
          success: false,
          message: "Impossible de mettre à jour le statut du projet",
        });
      }

      res.status(200).json({
        success: true,
        message: "Statut du projet mis à jour avec succès",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async deleteProject(req: Request & { admin?: Admin }, res: Response) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const { id } = adminIdSchema.parse(req.params);
      const { reason } = req.body;

      const success = await this.service.deleteProject(id, admin.id, reason);

      if (!success) {
        return res.status(400).json({
          success: false,
          message: "Impossible de supprimer ce projet",
        });
      }

      res.status(204).send();
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // =============================================
  // FONCTIONS UTILITAIRES
  // =============================================

  async cleanupExpiredSessions(
    req: Request & { admin?: Admin },
    res: Response,
  ) {
    try {
      const admin = req.admin;
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Administrateur non authentifié",
        });
      }

      const result = await this.service.cleanupExpiredSessions();

      res.status(200).json({
        success: true,
        data: result,
        message: "Nettoyage des sessions expirées terminé",
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }
}
