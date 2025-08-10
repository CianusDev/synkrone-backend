export enum Availability {
    AVAILABLE = 'available',
    UNAVAILABLE = 'unavailable',
    BUSY = 'busy'
}

export interface Freelance {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    password_hashed: string;
    photo_url?: string;
    job_title?: string;
    experience_years?: number;
    description?: string;
    portfolio_url?: string;
    cover_url?: string;
    video_url?: string;
    linkedin_url?: string;
    tjm?: number;
    availability?: Availability; 
    location?: string;
    is_verified: boolean;
    country?: string;
    phone?: string;
    block_duration: number;
    is_first_login?: boolean;
    deleted_at: Date | null;
    blocked_at: Date | null;
    created_at: Date;
    updated_at: Date | null;
}

