export enum CompanySize {
  STARTUP = "startup",
  SME = "sme",
  LARGE_COMPANY = "large_company",
}

export interface Company {
  id: string;
  company_name: string;
  company_email: string;
  password_hashed: string;
  logo_url?: string;
  company_description?: string;
  industry?: string;
  website_url?: string;
  address?: string;
  company_size?: CompanySize;
  certification_doc_url?: string;
  is_certified?: boolean;
  is_verified: boolean;
  block_duration?: number;
  country?: string;
  city?: string;
  company_phone?: string;
  is_first_login?: boolean;
  deleted_at?: Date | null;
  blocked_at?: Date | null;
  created_at: Date;
  updated_at: Date | null;
}
