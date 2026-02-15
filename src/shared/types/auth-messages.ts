/** Payload for LOGIN or REGISTER from popup to background. */
export type AuthRequest = {
    action: "LOGIN" | "REGISTER";
    username: string;
    password: string;
    /** For adding device: Secret Key from backup. Must be set before LOGIN. */
    secretKey?: string;
};

export type AuthResponse = {
    success: boolean;
    user?: { id: string; username: string };
    /** On REGISTER: Secret Key to save. User must backup. */
    secretKey?: string;
    error?: string;
};
