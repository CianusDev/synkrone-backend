import { Router } from "express";
import { ApplicationsController } from "./applications.controller";
import { AuthFreelanceMiddleware } from "../../middlewares/auth-freelance.middleware";
import { AuthCompanyMiddleware } from "../../middlewares/auth-company.middleware";
import { AuthAdminMiddleware } from "../../middlewares/auth-admin.middleware";
import { AuthAdminOrCompanyMiddleware } from "../../middlewares/auth-admin-or-company.middleware";

const router = Router();
const controller = new ApplicationsController();

// Créer une candidature (freelance connecté)
router.post("/", AuthFreelanceMiddleware, (req, res) =>
  controller.createApplication(req, res),
);

// Initialiser une négociation (admin ou company)
router.post(
  "/:id/initialize-negotiate",
  AuthAdminOrCompanyMiddleware,
  (req, res) => controller.initializeNegotiate(req, res),
);

// Récupérer une candidature par ID (admin ou concerné)
router.get("/:id", AuthAdminMiddleware, (req, res) =>
  controller.getApplicationById(req, res),
);

// Récupérer les candidatures d'un freelance (freelance ou admin)
router.get("/freelance/:freelanceId", AuthFreelanceMiddleware, (req, res) =>
  controller.getApplicationsByFreelanceId(req, res),
);

// Retirer une candidature (freelance connecté)
router.patch("/:id/withdraw", AuthFreelanceMiddleware, (req, res) =>
  controller.withdrawApplication(req, res),
);

// Mettre à jour le contenu d'une candidature (freelance connecté)
router.patch("/:id/update", AuthFreelanceMiddleware, (req, res) =>
  controller.updateApplicationContent(req, res),
);

// Récupérer les candidatures d'un projet (company ou admin)
router.get("/project/:projectId", AuthAdminOrCompanyMiddleware, (req, res) =>
  controller.getApplicationsByProjectId(req, res),
);

// Accepter une candidature (admin ou company)
router.patch("/:id/accept", AuthAdminOrCompanyMiddleware, (req, res) =>
  controller.acceptApplication(req, res),
);

// Rejeter une candidature (admin ou company)
router.patch("/:id/reject", AuthAdminOrCompanyMiddleware, (req, res) =>
  controller.rejectApplication(req, res),
);

// Mettre à jour le statut d'une candidature (admin ou company)
router.patch("/:id/status", AuthAdminOrCompanyMiddleware, (req, res) =>
  controller.updateApplicationStatus(req, res),
);

// Supprimer une candidature (admin uniquement)
router.delete("/:id", AuthAdminMiddleware, (req, res) =>
  controller.deleteApplication(req, res),
);

// Filtrer les candidatures (admin uniquement)
router.post("/filter", AuthAdminMiddleware, (req, res) =>
  controller.filterApplications(req, res),
);

export default router;
