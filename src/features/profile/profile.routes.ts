import { Router } from "express";
import { ProfileController } from "./profile.controller";
import { AuthFreelanceMiddleware } from "../../middlewares/auth-freelance.middleware";
import { AuthCompanyMiddleware } from "../../middlewares/auth-company.middleware";

const router = Router();
const controller = new ProfileController();

// Routes pour le profil freelance
router.get(
  "/freelance",
  AuthFreelanceMiddleware,
  controller.getFreelanceProfile.bind(controller),
);
router.patch(
  "/freelance",
  AuthFreelanceMiddleware,
  controller.completeFreelanceProfile.bind(controller),
);
router.get(
  "/freelance/complete",
  AuthFreelanceMiddleware,
  controller.isFreelanceProfileComplete.bind(controller),
);

// Routes pour le profil entreprise
router.get(
  "/company",
  AuthCompanyMiddleware,
  controller.getCompanyProfile.bind(controller),
);

router.patch(
  "/company",
  AuthCompanyMiddleware,
  controller.completeCompanyProfile.bind(controller),
);

router.get(
  "/company/complete",
  AuthCompanyMiddleware,
  controller.isCompanyProfileComplete.bind(controller),
);

export default router;
