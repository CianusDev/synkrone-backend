import crypto from "crypto";
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

// La clé doit faire exactement 32 bytes (256 bits) pour AES-256
function getKey(): Buffer {
  const envKey = process.env.CHAT_MESSAGE_SECRET_KEY;
  let keyStr = envKey ? envKey : "default_key_32_bytes_long!!default_key_32_b";
  if (keyStr.length < 32) {
    keyStr = keyStr.padEnd(32, "0");
  } else if (keyStr.length > 32) {
    keyStr = keyStr.slice(0, 32);
  }
  return Buffer.from(keyStr, "utf8");
}
const KEY = getKey();

/**
 * Chiffre un message texte avec AES-256-CBC.
 * Retourne une chaîne sous forme "ivHex:encryptedHex"
 */
export function encryptMessage(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Déchiffre un message texte chiffré avec encryptMessage.
 * Attend une chaîne sous forme "ivHex:encryptedHex"
 * Retourne le texte original si le déchiffrement échoue
 */
export function decryptMessage(encryptedText: string): string {
  // Vérifier si le texte est null/undefined/vide
  if (!encryptedText || typeof encryptedText !== "string") {
    console.warn(
      "decryptMessage: encryptedText is null, undefined or not a string",
    );
    return "";
  }

  // Si pas de ":", c'est probablement du texte non chiffré
  if (!encryptedText.includes(":")) {
    return encryptedText;
  }

  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 2) {
      console.warn(
        'decryptMessage: Invalid encrypted format, expected "iv:encrypted"',
      );
      return encryptedText; // Retourner le texte original si format invalide
    }

    const [ivHex, encrypted] = parts;

    // Vérifier que l'IV et le contenu chiffré ne sont pas vides
    if (!ivHex || !encrypted) {
      console.warn("decryptMessage: IV or encrypted content is empty");
      return encryptedText;
    }

    // Vérifier que l'IV a la bonne longueur (32 caractères hex = 16 bytes)
    if (ivHex.length !== IV_LENGTH * 2) {
      console.warn(
        `decryptMessage: Invalid IV length, expected ${IV_LENGTH * 2}, got ${ivHex.length}`,
      );
      return encryptedText;
    }

    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("decryptMessage: Decryption failed:", error);
    console.error("decryptMessage: Encrypted text:", encryptedText);
    // Retourner le texte original en cas d'erreur de déchiffrement
    return encryptedText;
  }
}

/**
 * Vérifie si un texte est chiffré (format "iv:encrypted")
 */
export function isEncrypted(text: string): boolean {
  if (!text || typeof text !== "string") {
    return false;
  }

  const parts = text.split(":");
  if (parts.length !== 2) {
    return false;
  }

  const [ivHex, encrypted] = parts;

  // Vérifier que l'IV a la bonne longueur (32 caractères hex = 16 bytes)
  if (ivHex.length !== IV_LENGTH * 2) {
    return false;
  }

  // Vérifier que les parties sont des chaînes hexadécimales valides
  const hexRegex = /^[0-9a-fA-F]+$/;
  return hexRegex.test(ivHex) && hexRegex.test(encrypted);
}

/**
 * Fonction utilitaire pour déchiffrer de manière sécurisée
 * avec gestion des cas où les messages ne sont pas chiffrés
 */
export function safeDecryptMessage(encryptedText: string): string {
  if (!encryptedText) {
    return "";
  }

  // Si le message n'est pas au format chiffré, le retourner tel quel
  if (!isEncrypted(encryptedText)) {
    return encryptedText;
  }

  // Sinon, essayer de le déchiffrer
  return decryptMessage(encryptedText);
}
