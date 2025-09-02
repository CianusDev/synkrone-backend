import { Router } from "express";
import { AuthController } from "./auth.controller";
const router = Router();
const controller = new AuthController();

// AUTH ROUTE FREELANCE
router.post(
  "/freelance/register",
  controller.registerFreelance.bind(controller),
);
router.post("/freelance/login/", controller.loginFreelance.bind(controller));
router.post(
  "/freelance/verify-email",
  controller.verifyEmailFreelance.bind(controller),
);
router.post(
  "/freelance/resend-email-otp",
  controller.resendEmailVerificationOTPFreelance.bind(controller),
);
router.post(
  "/freelance/forgot-password",
  controller.forgotPasswordFreelance.bind(controller),
);
router.post(
  "/freelance/reset-password",
  controller.resetPasswordFreelance.bind(controller),
);
router.post(
  "/freelance/resend-reset-otp",
  controller.resendResetPasswordOTPFreelance.bind(controller),
);

// AUTH ROUTE COMPANY
router.post("/company/register", controller.registerCompany.bind(controller));
router.post("/company/login", controller.loginCompany.bind(controller));
router.post(
  "/company/verify-email",
  controller.verifyEmailCompany.bind(controller),
);
router.post(
  "/company/resend-email-otp",
  controller.resendEmailVerificationOTPCompany.bind(controller),
);
router.post(
  "/company/forgot-password",
  controller.forgotPasswordCompany.bind(controller),
);
router.post(
  "/company/reset-password",
  controller.resetPasswordCompany.bind(controller),
);
router.post(
  "/company/resend-reset-otp",
  controller.resendResetPasswordOTPCompany.bind(controller),
);

// AUTH ROUTE COMMON
router.post("/logout", controller.logout.bind(controller));
export default router;
