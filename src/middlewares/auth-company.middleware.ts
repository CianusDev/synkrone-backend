import { RequestHandler } from "express";
import { HTTP_STATUS } from "../utils/constant";
import { verifyCompanyToken } from "../utils/utils";
import { CompanyRepository } from "../features/company/company.repository";
const companyRepository = new CompanyRepository();

export const AuthCompanyMiddleware: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Token manquant. Accès refusé.",
    });
  }

  const { company } = verifyCompanyToken(token);

  console.log("Decoded company from token:", company);

  if (!company) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Token invalide ou expiré. Accès refusé.",
    });
  }

  try {
    const existingCompany = await companyRepository.getCompanyById(
      company?.id || "",
    );
    if (!existingCompany) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Entreprise non trouvé. Accès refusé.",
      });
    }
  } catch (error) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: "Entreprise non trouvé. Accès refusé.",
    });
  }

  // Ajoute la propriété company dynamiquement
  (req as any).company = company;
  next();
};
