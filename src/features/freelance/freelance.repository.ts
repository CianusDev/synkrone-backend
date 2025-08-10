import { Freelance } from "./freelance.model";
import { db } from "../../config/database";

export class FreelanceRepository {
  /**
   * Crée un nouveau freelance dans la base de données
   * @param freelance - Les données du freelance à créer
   * @returns Le freelance créé
   */
  async createFreelance(freelance: Partial<Freelance>): Promise<Freelance> {
    const query = `
        INSERT INTO freelances (
            firstname, lastname, email, password_hashed
        ) VALUES (
            $1, $2, $3, $4
        ) RETURNING *`;

    const values = [
      freelance.firstname,
      freelance.lastname,
      freelance.email,
      freelance.password_hashed,
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0] as Freelance;
    } catch (error) {
      console.error("Error creating freelance:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Récupère un freelance par son ID
   * @param id - L'ID du freelance à récupérer
   * @returns Le freelance correspondant ou null si non trouvé
   */
  async getFreelanceById(id: string): Promise<Freelance | null> {
    const query = `SELECT * FROM freelances WHERE id = $1`;
    try {
      const result = await db.query(query, [id]);
      return result.rows[0] as Freelance;
    } catch (error) {
      console.error("Error fetching freelance by ID:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Met à jour les informations d'un freelance
   * @param id - L'ID du freelance à mettre à jour
   * @param freelanceData - Les données à mettre à jour
   * @return Le freelance mis à jour
   */
  async updateFreelanceProfile(
    id: string,
    freelanceData: Partial<Freelance>,
  ): Promise<Freelance | null> {
    const query = `
        UPDATE freelances SET
            firstname = COALESCE($1, firstname),
            lastname = COALESCE($2, lastname),
            experience_years = COALESCE($3, experience_years),
            description = COALESCE($4, description),
            portfolio_url = COALESCE($5, portfolio_url),
            photo_url = COALESCE($6, photo_url),
            job_title = COALESCE($7, job_title),
            cover_url = COALESCE($8, cover_url),
            video_url = COALESCE($9, video_url),
            linkedin_url = COALESCE($10, linkedin_url),
            tjm = COALESCE($11, tjm),
            availability = COALESCE($12, availability),
            location = COALESCE($13, location),
            phone = COALESCE($14, phone),
            country = COALESCE($15, country),
            updated_at = NOW()
        WHERE id = $16 RETURNING *`;

    const values = [
      freelanceData.firstname,
      freelanceData.lastname,
      freelanceData.experience_years,
      freelanceData.description,
      freelanceData.portfolio_url,
      freelanceData.photo_url,
      freelanceData.job_title,
      freelanceData.cover_url,
      freelanceData.video_url,
      freelanceData.linkedin_url,
      freelanceData.tjm,
      freelanceData.availability,
      freelanceData.location,
      freelanceData.phone,
      freelanceData.country,
      id,
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0] as Freelance;
    } catch (error) {
      console.error("Error updating freelance:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Récupère un freelance par son email
   * @param email - L'email du freelance à récupérer
   * @returns Le freelance correspondant ou null si non trouvé
   */
  async getFreelanceByEmail(email: string): Promise<Freelance | null> {
    const query = `SELECT * FROM freelances WHERE email = $1`;
    try {
      const result = await db.query(query, [email]);
      return result.rows[0] as Freelance;
    } catch (error) {
      console.error("Error fetching freelance by email:", error);
      throw new Error("Database error");
    }
  }

  async verifyEmail(email: string): Promise<Freelance | null> {
    const query = `UPDATE freelances SET is_verified = true WHERE email = $1 RETURNING *`;
    try {
      const result = await db.query(query, [email]);
      return result.rows[0] as Freelance;
    } catch (error) {
      console.error("Error verifying email:", error);
      throw new Error("Database error");
    }
  }

  async updateFreelancePassword(
    email: string,
    password_hashed: string,
  ): Promise<Freelance | null> {
    const query = `
        UPDATE freelances SET
            password_hashed = $1,
            updated_at = NOW()
        WHERE email = $2 RETURNING *`;

    const values = [password_hashed, email];

    try {
      const result = await db.query(query, values);
      return result.rows[0] as Freelance;
    } catch (error) {
      console.error("Error updating freelance password:", error);
      throw new Error("Database error");
    }
  }

  async updateFreelanceFirstLogin(id: string): Promise<Freelance | null> {
    const query = `
        UPDATE freelances SET
            first_login = false,
            updated_at = NOW()
        WHERE id = $1 RETURNING *`;

    const values = [id];

    try {
      const result = await db.query(query, values);
      return result.rows[0] as Freelance;
    } catch (error) {
      console.error("Error updating freelance first login:", error);
      throw new Error("Database error");
    }
  }
}
