import { db } from "../../config/database";
import { OTP } from "./otp.model";

export class OtpRepository {
  /**
   * Crée un OTP dans la base de données
   * @param otp - Les données de l'OTP à créer
   * @returns L'OTP créé
   */
  async createOtp(otp: Partial<OTP>): Promise<OTP> {
    const query = `
        INSERT INTO otps (
            email, code, expires_at
        ) VALUES (
            $1, $2, $3
        ) RETURNING *`;

    const values = [otp.email, otp.code, otp.expiresAt];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error creating OTP:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Récupère un OTP par son email
   * @param email - L'email de l'OTP à récupérer
   * @returns L'OTP correspondant ou null si non trouvé
   */
  async getOtpByEmail(
    email: string,
  ): Promise<{ email: string; code: string; expires_at: Date } | null> {
    const query = `SELECT * FROM otps WHERE email = $1`;
    try {
      const result = await db.query(query, [email]);
      return result.rows[0];
    } catch (error) {
      console.error("Error fetching OTP by email:", error);
      throw new Error("Database error");
    }
  }
  /**
   * Vérifie si un OTP est valide
   * @param email - L'email de l'OTP à vérifier
   * @param code - Le code de l'OTP à vérifier
   * @returns True si l'OTP est valide, sinon false
   */
  async isValidOtp(email: string, code: string): Promise<boolean> {
    const query = `SELECT * FROM otps WHERE email = $1 AND code = $2 AND expires_at > NOW()`;
    try {
      const result = await db.query(query, [email, code]);
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error validating OTP:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Vérifie si un OTP est valide
   * @param email - L'email de l'OTP à vérifier
   * @param codeId - L'ID du code de l'OTP à vérifier
   * @returns True si l'OTP est valide, sinon false
   */
  async isValidOtpByCodeID(codeId: string): Promise<boolean> {
    const query = `SELECT * FROM otps WHERE id = $2 AND expires_at > NOW()`;
    try {
      const result = await db.query(query, [codeId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error validating OTP:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Supprime un OTP par son email
   * @param email - L'email de l'OTP à supprimer
   * @returns True si l'OTP a été supprimé, sinon false
   */
  async deleteOtpByEmail(email: string): Promise<boolean> {
    const query = `DELETE FROM otps WHERE email = $1`;
    try {
      const result = await db.query(query, [email]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting OTP:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Supprime un OTP par son id
   * @param codeId - L'id de l'OTP à supprimer
   * @returns True si l'OTP a été supprimé, sinon false
   */
  async deleteOtpById(id: string): Promise<boolean> {
    const query = `DELETE FROM otps WHERE  = $1`;
    try {
      const result = await db.query(query, [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting OTP:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Met à jour un OTP
   * @param email - L'email de l'OTP à mettre à jour
   * @param otpData - Les nouvelles données de l'OTP
   * @returns L'OTP mis à jour
   */
  async updateOtp(
    email: string,
    otpData: Partial<OTP>,
  ): Promise<{ email: string; code: string; expires_at: Date } | null> {
    const query = `
        UPDATE otps SET
            code = COALESCE($1, code),
            expires_at = COALESCE($2, expires_at),
        WHERE email = $3
        RETURNING *`;

    const values = [otpData.code, otpData.expiresAt, email];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error updating OTP:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Marque un OTP comme utilisé
   * @param email - L'email de l'OTP à marquer comme utilisé
   */
  async markOtpAsUsed(email: string): Promise<void> {
    const query = `
        UPDATE otps SET
            used_at = NOW()
        WHERE email = $1`;

    try {
      await db.query(query, [email]);
    } catch (error) {
      console.error("Error marking OTP as used:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Incrémente le nombre de tentatives d'un OTP
   * @param email - L'email de l'OTP dont on veut incrémenter les tentatives
   */
  async incrementOtpAttempts(email: string): Promise<void> {
    const query = `
        UPDATE otps SET
            attempts = attempts + 1,
            updated_at = NOW()
        WHERE email = $1`;

    try {
      await db.query(query, [email]);
    } catch (error) {
      console.error("Error incrementing OTP attempts:", error);
      throw new Error("Database error");
    }
  }
}
