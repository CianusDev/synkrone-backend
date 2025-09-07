import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { StringValue } from "ms";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { Freelance } from "../features/freelance/freelance.model";
import { Company } from "../features/company/company.model";
import { Admin } from "../features/admin/admin.model";
import { envConfig } from "../config/env.config";
dotenv.config();

const secret = envConfig.jwtSecret!;

/**
 * Hashe un mot de passe en utilisant bcryptjs
 * @param password - Le mot de passe à hasher
 * @param saltRounds - Le nombre de rounds pour le salt (par défaut: 10)
 * @returns Le mot de passe hashé
 */
export const hashPassword = async (
  password: string,
  saltRounds: number = 10,
): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw new Error("Erreur lors du hashage du mot de passe");
  }
};

/**
 * Compare un mot de passe en clair avec un hash
 * @param password - Le mot de passe en clair
 * @param hashedPassword - Le hash à comparer
 * @returns true si le mot de passe correspond, false sinon
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error("Erreur lors de la comparaison du mot de passe");
  }
};

/**
 * Crée un token JWT pour un utilisateur (Freelance, Company, Admin)
 * @param user - L'utilisateur pour lequel créer le token
 * @param role - Le rôle de l'utilisateur ('freelance', 'company', 'admin')
 * @param expiresIn - Durée de validité du token (par défaut: '7d' pour freelance/company, '1d' pour admin)
 * @returns Le token JWT signé
 */
export const createUserToken = (
  user: Freelance | Company | Admin,
  role: "freelance" | "company" | "admin",
  expiresIn?: StringValue,
): string => {
  try {
    let defaultExpiresIn: StringValue = "7d";
    if (role === "admin") defaultExpiresIn = "1d";
    const options: SignOptions = { expiresIn: expiresIn || defaultExpiresIn };
    return jwt.sign({ user, role }, secret, options);
  } catch (error) {
    throw new Error("Erreur lors de la création du token utilisateur");
  }
};

/**
 * Vérifie un token JWT et retourne l'utilisateur décodé et son rôle
 * @param token - Le token JWT à vérifier
 * @returns L'utilisateur décodé et son rôle ou null si le token est invalide
 */
export const verifyUserToken = (
  token: string,
): {
  user: Freelance | Company | Admin | null;
  role: "freelance" | "company" | "admin" | null;
} => {
  try {
    const decoded = jwt.verify(token, secret) as {
      user: Freelance | Company | Admin;
      role: "freelance" | "company" | "admin";
    };
    return { user: decoded.user, role: decoded.role };
  } catch (error) {
    return { user: null, role: null };
  }
};

export const createResetOTPToken = (
  email: string,
  code: string,
  expiresIn: StringValue = "10m",
): string => {
  try {
    const options: SignOptions = { expiresIn };
    return jwt.sign({ email, code }, secret, options);
  } catch (error) {
    throw new Error("Erreur lors de la création du token OTP");
  }
};

export const verifyResetOTPToken = (
  token: string,
): { email: string | null; code: string | null } => {
  try {
    const decoded = jwt.verify(token, secret) as {
      email: string;
      code: string;
    };
    return { email: decoded.email, code: decoded.code };
  } catch (error) {
    return { email: null, code: null };
  }
};

/**
 * Génère un UUID v4
 * @returns Un UUID v4 sous forme de chaîne de caractères
 */
export const generateUUID = (): string => {
  return uuidv4();
};

/**
 * Génère un OTP (One Time Password) de la longueur spécifiée
 * @param length - La longueur du OTP (par défaut: 6)
 * @returns Un OTP sous forme de chaîne de caractères
 */
export const generateCodeOTP = (length: number = 6): string => {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};
