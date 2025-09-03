import cors from "cors";
import dotenv from "dotenv";
import express, { Response } from "express";
import { envConfig } from "./config/env.config";
import authAdminRoutes from "./features/auth-admin/auth-admin.routes";
import authRoutes from "./features/auth/auth.route";
import freelanceSkillRoutes from "./features/freelance-skills/freelance-skills.route";
import profileRoutes from "./features/profile/profile.routes";
import skillsRoutes from "./features/skills/skill.route";
import projectCategoryRoutes from "./features/project-categories/project-categories.route";
import { HTTP_STATUS } from "./utils/constant";
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
app.use("/api/freelance-skills/", freelanceSkillRoutes);
app.use("/api/skills", skillsRoutes);
app.use("/api/project-categories", projectCategoryRoutes);
