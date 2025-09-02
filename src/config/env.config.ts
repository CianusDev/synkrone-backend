import dotenv from "dotenv";
dotenv.config();

const requiredEnvVars = [
  "PORT_SERVER",
  "DB_USER",
  "DB_PASSWORD",
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "NODE_ENV",
  "JWT_SECRET",
  "CORS_ORIGIN",
  "APP_URL",
  "GMAIL_USER",
  "GMAIL_APP_PASSWORD",
  "APP_NAME",
  "FRONTEND_URL",
  "ROOT_NAME",
  "ROOT_PASSWORD",
];

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    throw new Error(
      `La variable d'environnement ${varName} est requise mais n'est pas définie.`,
    );
  }
}

export const envConfig = {
  port: process.env.PORT_SERVER,
  db: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
    connectionString:
      `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}` +
      (process.env.NODE_ENV === "production" ? "?sslmode=require" : ""),
  },
  nodeEnv: process.env.NODE_ENV,
  jwtSecret: process.env.JWT_SECRET,
  corsOrigin: process.env.CORS_ORIGIN,
  appUrl: process.env.APP_URL,
  gmailUser: process.env.GMAIL_USER,
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD,
  appName: process.env.APP_NAME,
  frontendUrl: process.env.FRONTEND_URL,
  rootName: process.env.ROOT_NAME,
  rootPassword: process.env.ROOT_PASSWORD,
};
