import { envConfig } from "../../config/env.config";
import { AdminLevel } from "../../features/admin/admin.model";
import { AdminRepository } from "../../features/admin/admin.repository";
import { hashPassword } from "../../utils/utils";

async function createSuperAdmin() {
  const adminRepository = new AdminRepository();
  const username = envConfig.rootName!;
  const password = envConfig.rootPassword!;
  const level = AdminLevel.SUPER_ADMIN;
  const password_hashed = await hashPassword(password);

  try {
    await adminRepository.createSuperAdmin({
      username,
      password_hashed,
      level,
    });
  } catch (error: any) {
    throw new Error(error);
  }
}

createSuperAdmin();
