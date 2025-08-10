import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { HTTP_STATUS } from "./utils/constant";
import authRoutes from "./features/auth/auth.route";
dotenv.config();

export const app = express();
const CORS_ORIGIN = process.env.CORS_ORIGIN;

if (!CORS_ORIGIN) {
  throw new Error(
    "La variable d'environnement CORS_ORIGIN est requise mais n'est pas définie.",
  );
}

app.use(express.json()); // 👈 nécessaire pour parser le JSON

// Configuration de CORS pour autoriser les origines spécifiques
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*", // à adapter selon vos besoins de sécurité
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
