export interface ProjectSkill {
  id: string;
  projectId: string;
  skillId: string;
}

export interface ProjectSkillWithDetails {
  id: string;
  projectId: string;
  skillId: string;
  skill: {
    id: string;
    name: string;
    description?: string;
    categoryId: string;
  };
}
