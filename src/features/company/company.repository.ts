import { db } from "../../config/database";
import { Company } from "./company.model";

export class CompanyRepository {
  /**
   * Crée une nouvelle entreprise dans la base de données
   * @param company - Les données de l'entreprise à créer
   * @returns L'entreprise créée
   */
  async createCompany(company: Partial<Company>): Promise<Company> {
    const query = `
        INSERT INTO companies (
            company_name, company_email, country, password_hashed
        ) VALUES (
            $1, $2, $3, $4
        ) RETURNING *`;

    const values = [
      company.company_name,
      company.company_email,
      company.country,
      company.password_hashed,
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0] as Company;
    } catch (error) {
      console.error("Error creating company:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Récupère une entreprise par son ID
   * @param id - L'ID de l'entreprise à récupérer
   * @returns L'entreprise correspondante ou null si non trouvée
   */
  async getCompanyById(id: string): Promise<Company | null> {
    const query = `SELECT * FROM companies WHERE id = $1`;
    try {
      const result = await db.query(query, [id]);
      return result.rows[0] as Company;
    } catch (error) {
      console.error("Error fetching company by ID:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Récupère une entreprise par son email
   * @param email - L'email de l'entreprise à récupérer
   * @returns L'entreprise correspondante ou null si non trouvée
   */

  async getCompanyByEmail(email: string): Promise<Company | null> {
    const query = `SELECT * FROM companies WHERE company_email = $1`;
    try {
      const result = await db.query(query, [email]);
      // Cette requête retourne toutes les colonnes (*) de la table companies pour l'email donné
      return result.rows[0] as Company;
    } catch (error) {
      console.error("Error fetching company by email:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Récupère une liste paginée d'entreprises avec recherche et filtres.
   * @param params - { page, limit, search, country, industry, is_verified, company_size, ... }
   * @returns { data: Company[], total: number, page: number, limit: number }
   */
  async getCompaniesWithFilters(params: {
    page?: number;
    limit?: number;
    search?: string;
    country?: string;
    industry?: string;
    is_verified?: boolean;
    company_size?: string;
    company_name?: string;
  }): Promise<{
    data: Company[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 10;
    const offset = (page - 1) * limit;

    let whereClauses: string[] = [];
    let values: (string | number | boolean)[] = [];

    // Recherche texte sur company_name, company_email, industry
    if (params.search) {
      whereClauses.push(
        "(LOWER(company_name) LIKE $" +
          (values.length + 1) +
          " OR LOWER(company_email) LIKE $" +
          (values.length + 1) +
          " OR LOWER(industry) LIKE $" +
          (values.length + 1) +
          ")",
      );
      values.push(`%${params.search.toLowerCase()}%`);
    }

    if (params.country) {
      whereClauses.push(`country = $${values.length + 1}`);
      values.push(params.country);
    }
    if (params.industry) {
      whereClauses.push(`industry = $${values.length + 1}`);
      values.push(params.industry);
    }
    if (typeof params.is_verified === "boolean") {
      whereClauses.push(`is_verified = $${values.length + 1}`);
      values.push(params.is_verified);
    }
    if (params.company_size) {
      whereClauses.push(`company_size = $${values.length + 1}`);
      values.push(params.company_size);
    }
    if (params.company_name) {
      whereClauses.push(`company_name ILIKE $${values.length + 1}`);
      values.push(`%${params.company_name}%`);
    }

    // Construction de la requête principale
    const baseQuery = `
      SELECT *
      FROM companies
      ${whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : ""}
      ORDER BY created_at DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;
    values.push(limit, offset);

    // Construction de la requête de comptage
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM companies
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
      console.error("Error fetching companies with filters:", error);
      throw new Error("Database error");
    }
  }

  /**
   * Met à jour les informations d'une entreprise
   * @param id - L'ID de l'entreprise à mettre à jour
   * @param companyData - Les données à mettre à jour
   * @returns L'entreprise mise à jour ou null si non trouvée
   */
  async updateCompany(
    id: string,
    companyData: Partial<Company>,
  ): Promise<Company | null> {
    const query = `
      UPDATE companies SET
          company_name = COALESCE($1, company_name),
          logo_url = COALESCE($2, logo_url),
          company_description = COALESCE($3, company_description),
          industry = COALESCE($4, industry),
          website_url = COALESCE($5, website_url),
          address = COALESCE($6, address),
          company_size = COALESCE($7, company_size),
          company_phone = COALESCE($8, company_phone),
          country = COALESCE($9, country),
          certification_doc_url = COALESCE($10, certification_doc_url)
      WHERE id = $11
      RETURNING *`;

    const values = [
      companyData.company_name,
      companyData.logo_url,
      companyData.company_description,
      companyData.industry,
      companyData.website_url,
      companyData.address,
      companyData.company_size,
      companyData.company_phone,
      companyData.country,
      companyData.certification_doc_url,
      id,
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0] as Company;
    } catch (error) {
      console.error("Error updating company profile:", error);
      throw new Error("Database error");
    }
  }

  /**
   * mettre a jour le mot de passe d'une entreprise
   * @param id - L'ID de l'entreprise dont le mot de passe doit être mis à jour
   * @param newPassword - Le nouveau mot de passe à définir
   * @returns L'entreprise mise à jour ou null si non trouvée
   */
  async updateCompanyPassword(
    id: string,
    newPassword: string,
  ): Promise<Company | null> {
    const query = `
        UPDATE companies SET
            password_hashed = $1
        WHERE id = $2
        RETURNING *`;

    const values = [newPassword, id];

    try {
      const result = await db.query(query, values);
      return result.rows[0] as Company;
    } catch (error) {
      console.error("Error updating company password:", error);
      throw new Error("Database error");
    }
  }

  /**
   * passer le statut de vérification d'une entreprise a true
   * @param email - L'email de l'entreprise dont le statut doit être mis à jour
   * @returns L'entreprise mise à jour ou null si non trouvée
   */
  async verifyEmail(email: string): Promise<Company | null> {
    const query = `
        UPDATE companies SET
            is_verified = true
        WHERE company_email = $1
        RETURNING *`;

    try {
      const result = await db.query(query, [email]);
      return result.rows[0] as Company;
    } catch (error) {
      console.error("Error verifying company email:", error);
      throw new Error("Database error");
    }
  }

  async updateCompanyFirstLogin(id: string): Promise<Company | null> {
    const query = `
        UPDATE companies SET
            is_first_login = false,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *`;

    const values = [id];

    try {
      const result = await db.query(query, values);
      return result.rows[0] as Company;
    } catch (error) {
      console.error("Error updating company first login:", error);
      throw new Error("Database error");
    }
  }
}
