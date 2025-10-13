export enum UserType {
  FREELANCE = "freelance",
  COMPANY = "company",
}

export interface Evaluation {
  id: string;
  contract_id: string;
  evaluator_id: string;
  evaluated_id: string;
  evaluator_type: UserType;
  evaluated_type: UserType;
  rating: number;
  comment?: string;
  created_at: Date;
  updated_at?: Date;
  // Relations enrichies
  contract?: {
    id: string;
    project_id: string;
    project?: {
      id: string;
      title: string;
    };
  };
  evaluator?: {
    id: string;
    name: string;
    email: string;
    type: UserType;
    avatar_url?: string;
    evaluation_date: Date;
  };
  evaluated?: {
    id: string;
    name: string;
    email: string;
    type: UserType;
    avatar_url?: string;
    evaluation_date: Date;
  };
}

export interface CreateEvaluationData {
  contract_id: string;
  evaluator_id: string;
  evaluated_id: string;
  evaluator_type: UserType;
  evaluated_type: UserType;
  rating: number;
  comment?: string;
}

export interface UpdateEvaluationData {
  rating?: number;
  comment?: string;
}

export interface EvaluationStats {
  user_id: string;
  user_type: UserType;
  total_evaluations: number;
  average_rating: number;
  rating_distribution: {
    rating_1: number;
    rating_2: number;
    rating_3: number;
    rating_4: number;
    rating_5: number;
  };
}

export interface EvaluationFilters {
  evaluator_id?: string;
  evaluated_id?: string;
  evaluator_type?: UserType;
  evaluated_type?: UserType;
  rating?: number;
  contract_id?: string;
  project_id?: string;
}
