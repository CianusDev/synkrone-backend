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
 */
export function decryptMessage(encryptedText: string): string {
  if (!encryptedText.includes(":")) return encryptedText; // Pas chiffré
  const [ivHex, encrypted] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
