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
            firstname, lastname, email, country, password_hashed
        ) VALUES (
            $1, $2, $3, $4, $5
        ) RETURNING *`;

    const values = [
      freelance.firstname,
      freelance.lastname,
      freelance.email,
      freelance.country,
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
            experience = COALESCE($3, experience),
            description = COALESCE($4, description),
            photo_url = COALESCE($5, photo_url),
            job_title = COALESCE($6, job_title),
            cover_url = COALESCE($7, cover_url),
            linkedin_url = COALESCE($8, linkedin_url),
            tjm = COALESCE($9, tjm),
            availability = COALESCE($10, availability),
            location = COALESCE($11, location),
            phone = COALESCE($12, phone),
            country = COALESCE($13, country),
            updated_at = NOW()
        WHERE id = $14 RETURNING *`;

    const values = [
      freelanceData.firstname?.trim(),
      freelanceData.lastname?.trim(),
      freelanceData.experience,
      freelanceData.description?.trim(),
      freelanceData.photo_url,
      freelanceData.job_title?.trim(),
      freelanceData.cover_url,
      freelanceData.linkedin_url,
      freelanceData.tjm,
      freelanceData.availability,
      freelanceData.location,
      freelanceData.phone?.trim(),
      freelanceData.country?.trim(),
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
   * Récupère une liste paginée de freelances avec recherche et filtres.
   * @param params - { page, limit, search, skills, experience, tjmMin, tjmMax }
   * @returns { data: Freelance[], total: number, page: number, limit: number }
   */
  async getFreelancesWithFilters(params: {
    page?: number;
    limit?: number;
    search?: string;
    skills?: string[]; // tableau d'ID de skills ou de noms de skills
    experience?: string[]; // niveaux d'expérience (beginner, intermediate, expert)
    tjmMin?: number;
    tjmMax?: number;
  }): Promise<{
    data: Freelance[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 10;
    const offset = (page - 1) * limit;

    // Construction dynamique du WHERE
    let whereClauses: string[] = ["f.deleted_at IS NULL"];
    let values: (string | number)[] = [];
    let joins: string[] = [];

    // Recherche texte sur nom, prénom, email, job_title
    if (params.search) {
      whereClauses.push(
        "(LOWER(f.firstname) LIKE $" +
          (values.length + 1) +
          " OR LOWER(f.lastname) LIKE $" +
          (values.length + 1) +
          " OR LOWER(f.email) LIKE $" +
          (values.length + 1) +
          " OR LOWER(f.job_title) LIKE $" +
          (values.length + 1) +
          ")",
      );
      values.push(`%${params.search.toLowerCase()}%`);
    }

    // Filtre expérience
    if (params.experience && params.experience.length > 0) {
      whereClauses.push(
        "f.experience = ANY($" + (values.length + 1) + "::text[])",
      );
      values.push(params.experience as unknown as string); // workaround for pg driver
    }

    // Filtre TJM min/max
    if (typeof params.tjmMin === "number") {
      whereClauses.push("f.tjm >= $" + (values.length + 1));
      values.push(params.tjmMin);
    }
    if (typeof params.tjmMax === "number") {
      whereClauses.push("f.tjm <= $" + (values.length + 1));
      values.push(params.tjmMax);
    }

    // Filtre par compétences (skills)
    if (params.skills && params.skills.length > 0) {
      joins.push(
        "INNER JOIN freelance_skills fs ON fs.freelance_id = f.id " +
          "INNER JOIN skills s ON s.id = fs.skill_id",
      );
      whereClauses.push("s.id = ANY($" + (values.length + 1) + "::text[])");
      values.push(params.skills as unknown as string); // workaround for pg driver
    }

    // Construction de la requête principale
    const baseQuery = `
      SELECT DISTINCT f.*
      FROM freelances f
      ${joins.join(" ")}
      ${whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : ""}
      ORDER BY f.created_at DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;
    values.push(limit, offset);

    // Construction de la requête de comptage
    const countQuery = `
      SELECT COUNT(DISTINCT f.id) AS total
      FROM freelances f
      ${joins.join(" ")}
      ${whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : ""}
    `;

    try {
      const dataResult = await db.query(baseQuery, values);
      const countResult = await db.query(
        countQuery,
        values.slice(0, values.length - 2),
      );
      const total = parseInt(countResult.rows[0]?.total ?? "0", 10);

      return {
        data: dataResult.rows,
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error("Error fetching freelances with filters:", error);
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
            is_first_login = false,
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
