import { Router } from "express";
import { ContractsController } from "./contracts.controller";
import { AuthFreelanceMiddleware } from "../../middlewares/auth-freelance.middleware";
import { AuthCompanyMiddleware } from "../../middlewares/auth-company.middleware";
import { AuthAdminMiddleware } from "../../middlewares/auth-admin.middleware";
import { AuthMiddleware } from "../../middlewares/auth.middleware";

const router = Router();
const controller = new ContractsController();

// Créer un contrat (company ou admin)
router.post("/", AuthCompanyMiddleware, (req, res) =>
  controller.createContract(req, res),
);

// Récupérer un contrat par ID
router.get("/:id", AuthMiddleware, (req, res) =>
  controller.getContractById(req, res),
);

// Récupérer les contrats d'un freelance (freelance ou admin)
router.get("/freelance/:freelanceId", AuthFreelanceMiddleware, (req, res) =>
  controller.getContractsByFreelanceId(req, res),
);

// Récupérer les contrats d'une entreprise (company ou admin)
router.get("/company/:companyId", AuthCompanyMiddleware, (req, res) =>
  controller.getContractsByCompanyId(req, res),
);

// Récupérer les contrats d'un projet (company ou admin)
router.get("/project/:projectId", AuthCompanyMiddleware, (req, res) =>
  controller.getContractsByProjectId(req, res),
);

// Modifier un contrat (company uniquement, statut draft)
router.patch("/:id", AuthCompanyMiddleware, (req, res) =>
  controller.updateContract(req, res),
);

// Accepter un contrat (freelance uniquement)
router.patch("/:id/accept", AuthFreelanceMiddleware, (req, res) =>
  controller.acceptContract(req, res),
);

// Refuser un contrat (freelance uniquement)
router.patch("/:id/refuse", AuthFreelanceMiddleware, (req, res) =>
  controller.refuseContract(req, res),
);

// Mettre à jour le statut d'un contrat (admin uniquement)
router.patch("/:id/status", AuthAdminMiddleware, (req, res) =>
  controller.updateContractStatus(req, res),
);

// Supprimer un contrat (admin uniquement)
router.delete("/:id", AuthAdminMiddleware, (req, res) =>
  controller.deleteContract(req, res),
);

// Filtrer les contrats (admin uniquement)
router.post("/filter", AuthAdminMiddleware, (req, res) =>
  controller.filterContracts(req, res),
);

export default router;
