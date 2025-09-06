import { Router } from "express";
import { MediaController } from "./media.controller";
import { AuthAdminMiddleware } from "../../middlewares/auth-admin.middleware";
import { AuthFreelanceMiddleware } from "../../middlewares/auth-freelance.middleware";
import { AuthCompanyMiddleware } from "../../middlewares/auth-company.middleware";

const router = Router();
const controller = new MediaController();

// Liste tous les médias (accessible à tous les utilisateurs authentifiés)
router.get(
  "/",
  AuthAdminMiddleware,
  AuthFreelanceMiddleware,
  AuthCompanyMiddleware,
  (req, res) => controller.listMedia(req, res),
);

// Récupère un média par son id (accessible à tous les utilisateurs authentifiés)
router.get(
  "/:id",
  AuthAdminMiddleware,
  AuthFreelanceMiddleware,
  AuthCompanyMiddleware,
  (req, res) => controller.getMediaById(req, res),
);

// Crée un média (accessible à admin, freelance, company)
router.post(
  "/",
  AuthAdminMiddleware,
  AuthFreelanceMiddleware,
  AuthCompanyMiddleware,
  (req, res) => controller.createMedia(req, res),
);

// Met à jour un média (accessible à admin, freelance, company)
router.put(
  "/:id",
  AuthAdminMiddleware,
  AuthFreelanceMiddleware,
  AuthCompanyMiddleware,
  (req, res) => controller.updateMedia(req, res),
);

// Supprime un média (accessible à admin, freelance, company)
router.delete(
  "/:id",
  AuthAdminMiddleware,
  AuthFreelanceMiddleware,
  AuthCompanyMiddleware,
  (req, res) => controller.deleteMedia(req, res),
);

export default router;
