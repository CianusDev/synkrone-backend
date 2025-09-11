import { RequestHandler } from "express";
import { HTTP_STATUS } from "../utils/constant";
import { verifyUserToken } from "../utils/utils";
import { AdminRepository } from "../features/admin/admin.repository";
import { CompanyRepository } from "../features/company/company.repository";

const adminRepository = new AdminRepository();
const companyRepository = new CompanyRepository();

/**
 * Middleware qui autorise l'accès si le token est valide pour un admin OU une company.
 * Ajoute la propriété req.admin ou req.company selon le type d'utilisateur authentifié.
 */
export const AuthAdminOrCompanyMiddleware: RequestHandler = async (
  req,
  res,
  next,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Token manquant. Accès refusé.",
    });
  }

  const { user, role } = verifyUserToken(token);

  if (!user || (role !== "admin" && role !== "company")) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Token invalide ou expiré. Accès refusé.",
    });
  }

  try {
    if (role === "admin") {
      const existingAdmin = await adminRepository.getAdminById(user?.id || "");
      if (!existingAdmin) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "Admin non trouvé. Accès refusé.",
        });
      }
      (req as any).admin = user;
      return next();
    } else if (role === "company") {
      const existingCompany = await companyRepository.getCompanyById(
        user?.id || "",
      );
      if (!existingCompany) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "Entreprise non trouvée. Accès refusé.",
        });
      }
      (req as any).company = user;
      return next();
    }
  } catch (error) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: "Utilisateur non trouvé. Accès refusé.",
    });
  }
};
