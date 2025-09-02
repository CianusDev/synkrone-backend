import { RequestHandler } from "express";
import { HTTP_STATUS } from "../utils/constant";
import { verifyFreelanceToken } from "../utils/utils";
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

  const { freelance } = verifyFreelanceToken(token);

  if (!freelance) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Token invalide ou expiré. Accès refusé.",
    });
  }

  try {
    const existingFreelance = await freelanceRepository.getFreelanceById(
      freelance?.id || "",
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
  (req as any).freelance = freelance;
  next();
};
