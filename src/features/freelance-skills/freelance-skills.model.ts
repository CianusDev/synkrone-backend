import { Skill } from "../skills/skill.model";

export interface FreelanceSkills {
  freelance_id: string;
  skill_id: string;
  level?: string;
  skills?: Skill[];
  created_at: Date;
}
