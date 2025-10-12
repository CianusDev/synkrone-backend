import { Router } from "express";
import { EvaluationController } from "./evaluation.controller";
import { AuthFreelanceMiddleware } from "../../middlewares/auth-freelance.middleware";
import { AuthCompanyMiddleware } from "../../middlewares/auth-company.middleware";
import { AuthAdminMiddleware } from "../../middlewares/auth-admin.middleware";
import { AuthMiddleware } from "../../middlewares/auth.middleware";

const router = Router();
const controller = new EvaluationController();

// Créer une évaluation (freelance ou company)
router.post("/", AuthMiddleware, (req, res) =>
  controller.createEvaluation(req, res),
);

// Récupérer une évaluation par ID (authentified users)
router.get("/:id", AuthMiddleware, (req, res) =>
  controller.getEvaluationById(req, res),
);

// Mettre à jour une évaluation (auteur uniquement)
router.patch("/:id", AuthMiddleware, (req, res) =>
  controller.updateEvaluation(req, res),
);

// Supprimer une évaluation (auteur uniquement)
router.delete("/:id", AuthMiddleware, (req, res) =>
  controller.deleteEvaluation(req, res),
);

// Filtrer les évaluations (admin uniquement)
router.post("/filter", AuthAdminMiddleware, (req, res) =>
  controller.filterEvaluations(req, res),
);

// Récupérer les statistiques d'un utilisateur (public ou auth selon l'implémentation)
router.get("/user/:userId/stats", (req, res) =>
  controller.getUserEvaluationStats(req, res),
);

// Récupérer les évaluations données par un utilisateur (auth requis)
router.get("/user/:userId/given", AuthMiddleware, (req, res) =>
  controller.getEvaluationsByEvaluator(req, res),
);

// Récupérer les évaluations reçues par un utilisateur (auth requis)
router.get("/user/:userId/received", AuthMiddleware, (req, res) =>
  controller.getEvaluationsByEvaluated(req, res),
);

// Récupérer un résumé complet des évaluations d'un utilisateur
router.get("/user/:userId/summary", AuthMiddleware, (req, res) =>
  controller.getUserEvaluationSummary(req, res),
);

// Récupérer les évaluations d'un contrat
router.get("/contract/:contractId", AuthMiddleware, (req, res) =>
  controller.getEvaluationsByContract(req, res),
);

// Vérifier si l'utilisateur peut évaluer dans le cadre d'un contrat
router.get("/contract/:contractId/can-evaluate", AuthMiddleware, (req, res) =>
  controller.canUserEvaluate(req, res),
);

export default router;
