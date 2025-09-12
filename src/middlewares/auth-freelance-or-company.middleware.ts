import { RequestHandler } from "express";
import { HTTP_STATUS } from "../utils/constant";
import { verifyUserToken } from "../utils/utils";
import { FreelanceRepository } from "../features/freelance/freelance.repository";
import { CompanyRepository } from "../features/company/company.repository";

const freelanceRepository = new FreelanceRepository();
const companyRepository = new CompanyRepository();

export const AuthFreelanceOrCompanyMiddleware: RequestHandler = async (
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

  if (!user || (role !== "freelance" && role !== "company")) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Token invalide ou expiré. Accès refusé.",
    });
  }

  try {
    if (role === "freelance") {
      const existingFreelance = await freelanceRepository.getFreelanceById(
        user.id,
      );
      if (!existingFreelance) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "Freelance non trouvé. Accès refusé.",
        });
      }
      (req as any).freelance = user;
    } else if (role === "company") {
      const existingCompany = await companyRepository.getCompanyById(user.id);
      if (!existingCompany) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "Entreprise non trouvée. Accès refusé.",
        });
      }
      (req as any).company = user;
    }
    next();
  } catch (error) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: "Utilisateur non trouvé. Accès refusé.",
    });
  }
};
