import { Router } from "express";
import { ProfileController } from "./profile.controller";

const router = Router();
const controller = new ProfileController();

// Routes pour le profil freelance
router.get(
  "/freelance/:id",
  controller.getFreelanceProfile.bind(controller)
);
router.put(
  "/freelance/:id",
  controller.completeFreelanceProfile.bind(controller)
);
router.get(
  "/freelance/:id/complete",
  controller.isFreelanceProfileComplete.bind(controller)
);

// Routes pour le profil entreprise
router.get(
  "/company/:id",
  controller.getCompanyProfile.bind(controller)
);
router.put(
  "/company/:id",
  controller.completeCompanyProfile.bind(controller)
);
router.get(
  "/company/:id/complete",
  controller.isCompanyProfileComplete.bind(controller)
);

export default router;
