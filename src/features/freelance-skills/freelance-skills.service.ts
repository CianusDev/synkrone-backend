import { SkillRepository } from "../skills/skill.repository";
import { FreelanceSkills } from "./freelance-skills.model";
import { FreelanceSkillsRepository } from "./freelance-skills.repository";

class FreelanceSkillsError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

class NotFoundError extends FreelanceSkillsError {
  constructor(message: string) {
    super(message, 404);
  }
}

class UnauthorizedError extends FreelanceSkillsError {
  constructor(message: string) {
    super(message, 401);
  }
}

class ValidationError extends FreelanceSkillsError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class FreelanceSkillsService {
  constructor(
    private readonly freelanceSkillsRepository: FreelanceSkillsRepository,
    private readonly skillRepository: SkillRepository,
  ) {}

  async createFreelanceSkills(
    freelanceSkills: Partial<FreelanceSkills>,
  ): Promise<FreelanceSkills> {
    const freelance_id = freelanceSkills.freelance_id || "";
    const skill_id = freelanceSkills.skill_id || "";

    const skill = await this.skillRepository.getSkillById(skill_id);

    if (!skill) {
      throw new NotFoundError("Compétence non trouvée.");
    }

    const existingFreelanceSkills =
      await this.freelanceSkillsRepository.getFreelanceSkillsByFreelanceId(
        freelance_id,
      );

    if (existingFreelanceSkills.some((skill) => skill.skill_id === skill_id)) {
      throw new ValidationError(
        "Cette compétence est déjà associée à ce freelance.",
      );
    }

    return this.freelanceSkillsRepository.createFreelanceSkills(
      freelanceSkills,
    );
  }

  async getFreelanceSkillsByFreelanceId(
    freelanceId: string,
  ): Promise<FreelanceSkills[]> {
    const freelanceSkills =
      await this.freelanceSkillsRepository.getFreelanceSkillsByFreelanceId(
        freelanceId,
      );
    for (const skill of freelanceSkills) {
      const skillDetails = await this.skillRepository.getSkillById(
        skill.skill_id,
      );
      if (!skillDetails) {
        throw new NotFoundError(
          `Compétence avec l'ID ${skill.skill_id} non trouvée.`,
        );
      }
      skill.skills?.push(skillDetails);
    }
    return freelanceSkills;
  }

  async deleteFreelanceSkills(id: string): Promise<void> {
    const freelanceSkills =
      await this.freelanceSkillsRepository.getFreelanceSkillsById(id);
    if (!freelanceSkills) {
      throw new NotFoundError("Compétence freelance non trouvée.");
    }
    await this.freelanceSkillsRepository.deleteFreelanceSkills(id);
  }
}
