
export enum AdminLevel {
    SUPER_ADMIN = 'super_admin',
    ADMIN = 'admin',
    MODERATOR = 'moderator',
}

export interface Admin {
    id: string;
    username: string;
    email: string;
    password_hashed: string;
    level: AdminLevel;
    created_at: Date;
    updated_at: Date | null;
}
