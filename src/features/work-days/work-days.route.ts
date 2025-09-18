import { Router } from "express";
import { WorkDaysController } from "./work-days.controller";
// Ajoute ici les middlewares d'authentification selon ta logique métier
// import { AuthFreelanceMiddleware } from "../../middlewares/auth-freelance.middleware";
// import { AuthCompanyMiddleware } from "../../middlewares/auth-company.middleware";

const controller = new WorkDaysController();
const router = Router();

/**
 * POST /work-days/deliverable/:deliverableId
 * Crée un jour de travail pour un livrable (freelance uniquement)
 */
// router.post("/deliverable/:deliverableId", AuthFreelanceMiddleware, (req, res) => controller.createWorkDay(req, res));
router.post("/deliverable/:deliverableId", (req, res) => controller.createWorkDay(req, res));

/**
 * GET /work-days/:id
 * Récupère un jour de travail par son id
 */
router.get("/:id", (req, res) => controller.getWorkDayById(req, res));

/**
 * GET /work-days/deliverable/:deliverableId
 * Récupère tous les jours de travail d'un livrable
 */
router.get("/deliverable/:deliverableId", (req, res) => controller.getWorkDaysByDeliverable(req, res));

/**
 * GET /work-days/deliverable/:deliverableId/stats
 * Récupère les statistiques des jours de travail pour un livrable
 */
router.get("/deliverable/:deliverableId/stats", (req, res) => controller.getWorkDayStatsByDeliverable(req, res));

/**
 * GET /work-days/freelance/:freelanceId
 * Récupère tous les jours de travail d'un freelance avec filtres
 */
router.get("/freelance/:freelanceId", (req, res) => controller.getWorkDaysByFreelance(req, res));

/**
 * PATCH /work-days/:id
 * Met à jour un jour de travail (freelance uniquement, si pas encore validé)
 */
// router.patch("/:id", AuthFreelanceMiddleware, (req, res) => controller.updateWorkDay(req, res));
router.patch("/:id", (req, res) => controller.updateWorkDay(req, res));

/**
 * DELETE /work-days/:id
 * Supprime un jour de travail (freelance uniquement, si pas encore validé)
 */
// router.delete("/:id", AuthFreelanceMiddleware, (req, res) => controller.deleteWorkDay(req, res));
router.delete("/:id", (req, res) => controller.deleteWorkDay(req, res));

/**
 * POST /work-days/submit
 * Soumet des jours de travail pour validation (freelance uniquement)
 */
// router.post("/submit", AuthFreelanceMiddleware, (req, res) => controller.submitWorkDays(req, res));
router.post("/submit", (req, res) => controller.submitWorkDays(req, res));

/**
 * PATCH /work-days/:id/validate
 * Valide un jour de travail (entreprise uniquement)
 */
// router.patch("/:id/validate", AuthCompanyMiddleware, (req, res) => controller.validateWorkDay(req, res));
router.patch("/:id/validate", (req, res) => controller.validateWorkDay(req, res));

/**
 * PATCH /work-days/:id/reject
 * Rejette un jour de travail (entreprise uniquement)
 */
// router.patch("/:id/reject", AuthCompanyMiddleware, (req, res) => controller.rejectWorkDay(req, res));
router.patch("/:id/reject", (req, res) => controller.rejectWorkDay(req, res));

/**
 * POST /work-days/bulk-validate
 * Valide plusieurs jours de travail en une fois (entreprise uniquement)
 */
// router.post("/bulk-validate", AuthCompanyMiddleware, (req, res) => controller.bulkValidateWorkDays(req, res));
router.post("/bulk-validate", (req, res) => controller.bulkValidateWorkDays(req, res));

/**
 * POST /work-days/bulk-reject
 * Rejette plusieurs jours de travail en une fois (entreprise uniquement)
 */
// router.post("/bulk-reject", AuthCompanyMiddleware, (req, res) => controller.bulkRejectWorkDays(req, res));
router.post("/bulk-reject", (req, res) => controller.bulkRejectWorkDays(req, res));

export default router;
