import { RequestHandler } from "express";
import { HTTP_STATUS } from "../utils/constant";
import { verifyUserToken } from "../utils/utils";
import { AdminRepository } from "../features/admin/admin.repository";
const adminRepository = new AdminRepository();

export const AuthAdminMiddleware: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  // console.log("AuthAdminMiddleware je fais ");
  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Token manquant. Accès refusé.",
    });
  }

  const { user, role } = verifyUserToken(token);

  // console.log("Decoded admin from token:", user);

  if (role !== "admin" || !user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Token invalide ou expiré. Accès refusé.",
    });
  }

  try {
    const existingAdmin = await adminRepository.getAdminById(user?.id || "");
    if (!existingAdmin) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Admin non trouvé. Accès refusé.",
      });
    }
  } catch (error) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: "Admin non trouvé. Accès refusé.",
    });
  }

  // Ajoute la propriété admin dynamiquement
  (req as any).admin = user;
  next();
};
