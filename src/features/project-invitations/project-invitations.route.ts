import { Router } from "express";
import { ProjectInvitationsController } from "./project-invitations.controller";
import { AuthFreelanceMiddleware } from "../../middlewares/auth-freelance.middleware";
import { AuthCompanyMiddleware } from "../../middlewares/auth-company.middleware";
import { AuthAdminMiddleware } from "../../middlewares/auth-admin.middleware";

const router = Router();
const controller = new ProjectInvitationsController();

// Créer une invitation (company ou admin)
router.post("/", AuthCompanyMiddleware, (req, res) =>
  controller.createInvitation(req, res),
);

// Récupérer une invitation par ID (admin ou concerné)
router.get("/:id", AuthAdminMiddleware, (req, res) =>
  controller.getInvitationById(req, res),
);

// Récupérer les invitations reçues par un freelance (freelance ou admin)
router.get("/freelance/:freelanceId", AuthFreelanceMiddleware, (req, res) =>
  controller.getInvitationsByFreelanceId(req, res),
);

// Récupérer les invitations envoyées par une entreprise (company ou admin)
router.get("/company/:companyId", AuthCompanyMiddleware, (req, res) =>
  controller.getInvitationsByCompanyId(req, res),
);

// Récupérer les invitations pour un projet (company ou admin)
router.get("/project/:projectId", AuthCompanyMiddleware, (req, res) =>
  controller.getInvitationsByProjectId(req, res),
);

// Mettre à jour le statut d'une invitation (freelance ou admin)
router.patch("/:id/status", AuthFreelanceMiddleware, (req, res) =>
  controller.updateInvitationStatus(req, res),
);

// Supprimer une invitation (admin uniquement)
router.delete("/:id", AuthAdminMiddleware, (req, res) =>
  controller.deleteInvitation(req, res),
);

// Filtrer les invitations (admin uniquement)
router.post("/filter", AuthAdminMiddleware, (req, res) =>
  controller.filterInvitations(req, res),
);

export default router;
