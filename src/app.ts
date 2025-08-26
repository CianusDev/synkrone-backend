import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { HTTP_STATUS } from "./utils/constant";
import authRoutes from "./features/auth/auth.route";
import authAdminRoutes from "./features/auth-admin/auth-admin.routes";
import profileRoutes from "./features/profile/profile.routes";
import { envConfig } from "./config/env.config";
dotenv.config();

export const app = express();

const CORS_ORIGIN = envConfig.corsOrigin;

app.use(express.json()); // 👈 nécessaire pour parser le JSON

// Configuration de CORS pour autoriser les origines spécifiques
const corsOptions = {
  origin: CORS_ORIGIN || "*", // à adapter selon vos besoins de sécurité
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
};

app.use(cors(corsOptions));

app.get("/health", (_, res: Response) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Server is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/auth-admin", authAdminRoutes);
app.use("/api/profile", profileRoutes);
