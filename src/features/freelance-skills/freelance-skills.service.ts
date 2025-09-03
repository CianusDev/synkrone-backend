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
    freelance_id: string,
    skill_id: string,
  ): Promise<FreelanceSkills> {
    const skill = await this.skillRepository.getSkillById(skill_id);

    if (!skill) {
      throw new NotFoundError("Compétence non trouvée.");
    }

    const existingFreelanceSkills =
      await this.freelanceSkillsRepository.getFreelanceSkillsByFreelanceId(
        freelance_id,
      );

    if (existingFreelanceSkills.some((skill) => skill.skill_id === skill_id)) {
      return existingFreelanceSkills.find(
        (skill) => skill.skill_id === skill_id,
      ) as FreelanceSkills;
    }

    return this.freelanceSkillsRepository.createFreelanceSkills({
      freelance_id,
      skill_id,
    });
  }

  async updateFreelanceSkills(
    id: string,
    skill_id: string,
    level?: string,
  ): Promise<FreelanceSkills> {
    // Vérifier que la compétence existe
    const skill = await this.skillRepository.getSkillById(skill_id);
    if (!skill) {
      throw new NotFoundError("Compétence non trouvée.");
    }

    // Vérifier que la ligne freelance_skill existe
    const freelanceSkillsArr =
      await this.freelanceSkillsRepository.getFreelanceSkillsById(id);
    const freelanceSkills = freelanceSkillsArr[0];
    if (!freelanceSkills) {
      throw new NotFoundError("Compétence freelance non trouvée.");
    }

    // Mettre à jour
    const updated = await this.freelanceSkillsRepository.updateFreelanceSkills(
      id,
      {
        skill_id,
        level,
      },
    );
    if (!updated) {
      throw new Error("Erreur lors de la mise à jour de la compétence.");
    }
    return updated;
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
