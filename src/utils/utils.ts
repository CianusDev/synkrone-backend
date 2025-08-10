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
 * Crée un token JWT pour un utilisateur
 * @param freelance - Le freelance pour lequel créer le token
 * @param secret - La clé secrète utilisée pour signer le token
 * @param expiresIn - Durée de validité du token (par défaut: '7d')
 * @returns Le token JWT signé
 */
export const createFreelanceToken = (
  freelance: Freelance,
  expiresIn: StringValue = "7d",
): string => {
  try {
    const options: SignOptions = { expiresIn };
    return jwt.sign({ freelance }, secret, options);
  } catch (error) {
    throw new Error("Erreur lors de la création du token de freelance");
  }
};

/**
 * Vérifie un token JWT et retourne le freelance décodé
 * @param token - Le token JWT à vérifier
 * @param secret - La clé secrète utilisée pour vérifier le token
 * @returns L'utilisateur décodé ou null si le token est invalide
 */
export const verifyFreelanceToken = (
  token: string,
  secret: string,
): { freelance: Freelance | null } => {
  try {
    const decoded = jwt.verify(token, secret) as Freelance;
    return { freelance: decoded };
  } catch (error) {
    return { freelance: null };
  }
};

// export const expireToken = (token: string): boolean => {
//   try {
//     // Créer un token expiré immédiatement
//     const blacklistedPayload = jwt.verify(token, secret) as any;

//     // Régénérer un token avec la même payload mais qui expire immédiatement
//     jwt.sign(blacklistedPayload, secret, { expiresIn: 0 });

//     return true;
//   } catch (error) {
//     // Si le token est déjà invalide ou expiré
//     return false;
//   }
// };

/**
 * Crée un token JWT pour une entreprise
 * @param company - L'entreprise pour laquelle créer le token
 * @param expiresIn - Durée de validité du token (par défaut: '7d')
 * @returns Le token JWT signé
 */
export const createCompanyToken = (
  company: Company,
  expiresIn: StringValue = "7d",
): string => {
  try {
    const options: SignOptions = { expiresIn };
    return jwt.sign({ company }, secret, options);
  } catch (error) {
    throw new Error("Erreur lors de la création du token d'entreprise");
  }
};

/**
 * Vérifie un token JWT et retourne l'entreprise décodée
 * @param token - Le token JWT à vérifier
 * @param secret - La clé secrète utilisée pour vérifier le token
 * @returns L'entreprise décodée ou null si le token est invalide
 */
export const verifyCompanyToken = (
  token: string,
  secret: string,
): { company: Company | null } => {
  try {
    const decoded = jwt.verify(token, secret) as Company;
    return { company: decoded };
  } catch (error) {
    return { company: null };
  }
};

/**
 * Crée un token JWT pour un administrateur
 * @param admin - L'administrateur pour lequel créer le token
 * @param expiresIn - Durée de validité du token (par défaut: '7d')
 * @returns Le token JWT signé
 */
export const createAdminToken = (
  admin: Admin,
  expiresIn: StringValue = "1d",
): string => {
  try {
    const options: SignOptions = { expiresIn };
    return jwt.sign({ admin }, secret, options);
  } catch (error) {
    throw new Error("Erreur lors de la création du token d'administrateur");
  }
};

/**
 * Vérifie un token JWT et retourne l'administrateur décodé
 * @param token - Le token JWT à vérifier
 * @param secret - La clé secrète utilisée pour vérifier le token
 * @returns L'administrateur décodé ou null si le token est invalide
 */
export const verifyAdminToken = (
  token: string,
  secret: string,
): { admin: Admin | null } => {
  try {
    const decoded = jwt.verify(token, secret) as Admin;
    return { admin: decoded };
  } catch (error) {
    return { admin: null };
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
