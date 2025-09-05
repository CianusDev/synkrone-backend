import { Skill } from "./skill.model";
import { SkillRepository } from "./skill.repository";

class SkillNotFoundError extends Error {
  statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = "SkillNotFoundError";
    this.statusCode = 404;
  }
}

export class SkillService {
  constructor(private readonly skillRepository = new SkillRepository()) {}

  async createSkill(skillData: Partial<Skill>): Promise<Skill> {
    if (!skillData.name || !skillData.category_id) {
      throw new Error("Le nom et la catégorie sont requis.");
    }
    return this.skillRepository.createSkill(skillData);
  }

  async getSkillById(id: string): Promise<Skill> {
    const skill = await this.skillRepository.getSkillById(id);
    if (!skill) {
      throw new SkillNotFoundError("Compétence non trouvée.");
    }
    return skill;
  }

  async getAllSkills(
    filter: { name?: string; category_id?: string } = {},
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{ data: Skill[]; total: number }> {
    return this.skillRepository.getAllSkills(filter, pagination);
  }

  async updateSkill(id: string, skillData: Partial<Skill>): Promise<Skill> {
    const updated = await this.skillRepository.updateSkill(id, skillData);
    if (!updated) {
      throw new SkillNotFoundError("Compétence non trouvée pour mise à jour.");
    }
    return updated;
  }

  async deleteSkill(id: string): Promise<void> {
    const skill = await this.skillRepository.getSkillById(id);
    if (!skill) {
      throw new SkillNotFoundError("Compétence non trouvée pour suppression.");
    }
    await this.skillRepository.deleteSkill(id);
  }
}
