import { Router } from "express";
import { DeliverablesController } from "./deliverables.controller";
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
router.post("/", (req, res) => controller.createDeliverable(req, res));

/**
 * GET /deliverables/:id
 * Récupère un livrable par son id
 */
router.get("/:id", (req, res) => controller.getDeliverableById(req, res));

/**
 * GET /deliverables/contract/:contractId
 * Récupère tous les livrables d'un contrat
 */
router.get("/contract/:contractId", (req, res) => controller.getDeliverablesByContract(req, res));

/**
 * PATCH /deliverables/:id
 * Met à jour un livrable
 */
router.patch("/:id", (req, res) => controller.updateDeliverable(req, res));

/**
 * DELETE /deliverables/:id
 * Supprime un livrable
 */
router.delete("/:id", (req, res) => controller.deleteDeliverable(req, res));

export default router;
