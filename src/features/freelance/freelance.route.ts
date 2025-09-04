import { Router } from "express";
import { FreelanceController } from "./freelance.controller";

const router = Router();
const controller = new FreelanceController();

// Créer un freelance
router.post("/", (req, res) => controller.createFreelance(req, res));

// Récupérer la liste paginée des freelances avec recherche et filtres
router.get("/", (req, res) => controller.getFreelances(req, res));

// Récupérer un freelance par ID
router.get("/:id", (req, res) => controller.getFreelanceById(req, res));

// // Mettre à jour le profil d'un freelance
// router.patch("/:id", (req, res) => controller.updateFreelanceProfile(req, res));

// // Vérifier l'email d'un freelance
// router.post("/verify-email", (req, res) => controller.verifyEmail(req, res));

// // Mettre à jour le mot de passe d'un freelance
// router.post("/update-password", (req, res) =>
//   controller.updateFreelancePassword(req, res),
// );

export default router;
