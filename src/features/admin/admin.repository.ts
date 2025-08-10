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
}
