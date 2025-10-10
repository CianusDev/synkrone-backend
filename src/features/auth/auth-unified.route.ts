import { Router } from "express";
import { AuthUnifiedController } from "./auth-unified.controller";

const router = Router();
const controller = new AuthUnifiedController();

// ===========================================
// ROUTES UNIFIÉES (FREELANCES + ENTREPRISES)
// ===========================================

// Mot de passe oublié unifié
router.post("/forgot-password", controller.forgotPassword.bind(controller));

// Réinitialisation de mot de passe unifiée
router.post("/reset-password", controller.resetPassword.bind(controller));

// Vérification d'email unifiée
router.post("/verify-email", controller.verifyEmail.bind(controller));

// Renvoi du code de vérification d'email unifié
router.post("/resend-email-otp", controller.resendEmailVerificationOTP.bind(controller));

// Renvoi du code de réinitialisation de mot de passe unifié
router.post("/resend-reset-otp", controller.resendResetPasswordOTP.bind(controller));

// ===========================================
// ROUTES SPÉCIFIQUES FREELANCES
// ===========================================

// Inscription freelance (reste spécifique)
router.post("/freelance/register", controller.registerFreelance.bind(controller));

// Connexion freelance (reste spécifique)
router.post("/freelance/login", controller.loginFreelance.bind(controller));

// ===========================================
// ROUTES SPÉCIFIQUES ENTREPRISES
// ===========================================

// Inscription entreprise (reste spécifique)
router.post("/company/register", controller.registerCompany.bind(controller));

// Connexion entreprise (reste spécifique)
router.post("/company/login", controller.loginCompany.bind(controller));

// ===========================================
// ROUTES COMMUNES
// ===========================================

// Déconnexion
router.post("/logout", controller.logout.bind(controller));

export default router;
