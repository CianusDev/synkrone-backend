import { db } from "../../config/database";
import { Admin } from "./admin.model";

export class AdminRepository {
  async createSuperAdmin(admin: Partial<Admin>) {
    const query = `
        INSERT INTO admins (
            username, email, password_hashed, level
        ) VALUES (
            $1, $2, $3, $4
        ) RETURNING *`;

    const values = [
      admin.username,
      admin.email,
      admin.password_hashed,
      admin.level,
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0] as Admin;
    } catch (error) {
      console.error("Error creating freelance:", error);
      throw new Error("Database error");
    }
  }

  async getAdminById(id: string): Promise<Admin | null> {
    const query = `SELECT * FROM admins WHERE id = $1`;
    try {
      const result = await db.query(query, [id]);
      return result.rows[0] as Admin | null;
    } catch (error) {
      console.error("Error fetching admin by ID:", error);
      throw new Error("Database error");
    }
  }

  async getAdminByUsername(username: string): Promise<Admin | null> {
    const query = `SELECT * FROM admins WHERE username = $1`;
    try {
      const result = await db.query(query, [username]);
      return result.rows[0] as Admin | null;
    } catch (error) {
      console.error("Error fetching admin by username:", error);
      throw new Error("Database error");
    }
  }

  async getSessionsByAdminId(adminId: string): Promise<Admin> {
    const query = `SELECT * FROM admins WHERE id = $1`;
    try {
      const result = await db.query(query, [adminId]);
      return result.rows[0] as Admin;
    } catch (error) {
      console.error("Error fetching admin by ID:", error);
      throw new Error("Database error");
    }
  }

  async updateAdminPassword(
    adminId: string,
    newPasswordHashed: string,
  ): Promise<Admin | null> {
    const query = `
        UPDATE admins
        SET password_hashed = $1
        WHERE id = $2
        RETURNING *`;

    const values = [newPasswordHashed, adminId];

    try {
      const result = await db.query(query, values);
      return result.rows[0] as Admin | null;
    } catch (error) {
      console.error("Error updating admin password:", error);
      throw new Error("Database error");
    }
  }
  async updateAdminLevel(
    adminId: string,
    newLevel: string,
  ): Promise<Admin | null> {
    const query = `
        UPDATE admins
        SET level = $1
        WHERE id = $2
        RETURNING *`;

    const values = [newLevel, adminId];

    try {
      const result = await db.query(query, values);
      return result.rows[0] as Admin | null;
    } catch (error) {
      console.error("Error updating admin level:", error);
      throw new Error("Database error");
    }
  }
  async deleteAdminById(id: string): Promise<void> {
    const query = `DELETE FROM admins WHERE id = $1`;
    try {
      await db.query(query, [id]);
    } catch (error) {
      console.error("Error deleting admin by ID:", error);
      throw new Error("Database error");
    }
  }
  async getAllAdmins(): Promise<Admin[]> {
    const query = `SELECT * FROM admins`;
    try {
      const result = await db.query(query);
      return result.rows as Admin[];
    } catch (error) {
      console.error("Error fetching all admins:", error);
      throw new Error("Database error");
    }
  }
}
