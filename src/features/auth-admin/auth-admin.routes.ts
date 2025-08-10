import { Router } from "express";
import { AuthAdminController } from "./auth-admin.controller";

const router = Router();
const controller = new AuthAdminController();

// AUTH ROUTES ADMIN
router.post("/login", controller.loginAdmin.bind(controller));
router.post("/logout", controller.logoutAdmin.bind(controller));
router.post("/validate-session", controller.validateSession.bind(controller));
router.post(
  "/revoke-other-sessions",
  controller.revokeOtherSessions.bind(controller),
);
router.post(
  "/change-password/:adminId",
  controller.changePassword.bind(controller),
);

export default router;
