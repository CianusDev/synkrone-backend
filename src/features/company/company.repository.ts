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
      return result.rows[0] as Company;
    } catch (error) {
      console.error("Error fetching company by email:", error);
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
            company_name = $1,
            logo_url = $2 ,
            company_description = $3,
            industry = $4,
            website_url = $5,
            address = $6,
            company_size = $7,
            company_phone = $8,
            country = $9,
            certification_doc_url = $10
        WHERE id = $11
        RETURNING *`;

    const values = [
      companyData.company_name?.trim(),
      companyData.logo_url,
      companyData.company_description?.trim(),
      companyData.industry?.trim(),
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
