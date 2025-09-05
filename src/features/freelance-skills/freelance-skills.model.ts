import { Skill } from "../skills/skill.model";

export interface FreelanceSkills {
  id: string;
  freelance_id: string;
  skill_id: string;
  level?: string;
  skills?: Skill[];
  created_at: Date;
}
