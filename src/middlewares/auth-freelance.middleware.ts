import { RequestHandler } from "express";
import { HTTP_STATUS } from "../utils/constant";
import { verifyUserToken } from "../utils/utils";
import { FreelanceRepository } from "../features/freelance/freelance.repository";
const freelanceRepository = new FreelanceRepository();

export const AuthFreelanceMiddleware: RequestHandler = async (
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

  if (role !== "freelance" || !user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Token invalide ou expiré. Accès refusé.",
    });
  }

  try {
    const existingFreelance = await freelanceRepository.getFreelanceById(
      user?.id || "",
    );
    if (!existingFreelance) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Freelance non trouvé. Accès refusé.",
      });
    }
  } catch (error) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: "Freelance non trouvé. Accès refusé.",
    });
  }

  // Ajoute la propriété freelance dynamiquement
  (req as any).freelance = user;
  next();
};
