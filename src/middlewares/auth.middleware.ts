import { RequestHandler } from "express";
import { HTTP_STATUS } from "../utils/constant";
import { verifyUserToken } from "../utils/utils";

export const AuthMiddleware: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  console.log("Mon token ");
  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Token manquant. Accès refusé.",
    });
  }
  const { user, role } = verifyUserToken(token);

  if (!user || !role) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Token invalide. Accès refusé.",
    });
  }
  // console.log({
  //   user,
  //   role,
  // });
  (req as any).user = user;
  next();
};
