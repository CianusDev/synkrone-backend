
export  enum OtpType {
    EMAIL_VERIFICATION = 'email_verification',
    PASSWORD_RESET = 'password_reset'
}

export interface OTP {
    id: string;
    email: string;
    type: OtpType;
    code: string;
    expiresAt: Date;
    createdAt: Date;
    attempts: number; // Number of attempts made to use this OTP
    usedAt?: Date | null; // Nullable to allow for unused OTPs
    isActive: boolean; // Indicates if the OTP is still valid
}