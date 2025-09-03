export interface ProjectCategory {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date | null;
}
