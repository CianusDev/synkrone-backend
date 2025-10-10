import { Router } from "express";
import { DeliverablesController } from "./deliverables.controller";
import { AuthFreelanceOrCompanyMiddleware } from "../../middlewares/auth-freelance-or-company.middleware";
import { AuthMiddleware } from "../../middlewares/auth.middleware";
import { AuthCompanyMiddleware } from "../../middlewares/auth-company.middleware";
// Ajoute ici le middleware adapté selon ta logique métier (ex: AuthFreelanceMiddleware, AuthCompanyMiddleware)
// import { AuthFreelanceMiddleware } from "../../middlewares/auth-freelance.middleware";
// import { AuthCompanyMiddleware } from "../../middlewares/auth-company.middleware";

const controller = new DeliverablesController();
const router = Router();

/**
 * POST /deliverables
 * Crée un livrable
 */
// Exemple avec middleware : router.post("/", AuthFreelanceMiddleware, (req, res) => controller.createDeliverable(req, res));
router.post("/", AuthFreelanceOrCompanyMiddleware, (req, res) =>
  controller.createDeliverable(req, res),
);

/**
 * GET /deliverables/:id
 * Récupère un livrable par son id
 */
router.get("/:id", AuthMiddleware, (req, res) =>
  controller.getDeliverableById(req, res),
);

/**
 * GET /deliverables/contract/:contractId
 * Récupère tous les livrables d'un contrat
 */
router.get("/contract/:contractId", AuthMiddleware, (req, res) =>
  controller.getDeliverablesByContract(req, res),
);

/**
 * PATCH /deliverables/:id
 * Met à jour un livrable (freelance uniquement - statuts limités)
 */
router.patch("/:id", AuthFreelanceOrCompanyMiddleware, (req, res) =>
  controller.updateDeliverable(req, res),
);

/**
 * PATCH /deliverables/:id/company
 * Met à jour un livrable (company - tous les statuts autorisés)
 */
// Exemple avec middleware : router.patch("/:id/company", AuthCompanyMiddleware, (req, res) => controller.updateDeliverableCompany(req, res));
router.patch("/:id/company", AuthCompanyMiddleware, (req, res) =>
  controller.updateDeliverableCompany(req, res),
);

/**
 * PATCH /deliverables/:id/validate
 * Valide un livrable (company uniquement)
 */
// Exemple avec middleware : router.patch("/:id/validate", AuthCompanyMiddleware, (req, res) => controller.validateDeliverable(req, res));
router.patch("/:id/validate", AuthCompanyMiddleware, (req, res) =>
  controller.validateDeliverable(req, res),
);

/**
 * PATCH /deliverables/:id/reject
 * Rejette un livrable (company uniquement)
 */
// Exemple avec middleware : router.patch("/:id/reject", AuthCompanyMiddleware, (req, res) => controller.rejectDeliverable(req, res));
router.patch("/:id/reject", AuthCompanyMiddleware, (req, res) =>
  controller.rejectDeliverable(req, res),
);

/**
 * DELETE /deliverables/:id
 * Supprime un livrable
 */
router.delete("/:id", AuthCompanyMiddleware, (req, res) =>
  controller.deleteDeliverable(req, res),
);

export default router;
