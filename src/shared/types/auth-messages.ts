/** Payload for LOGIN or REGISTER from popup to background. */
export type AuthRequest = {
    action: "LOGIN" | "REGISTER";
    username: string;
    password: string;
};

export type AuthResponse = {
    success: boolean;
    user?: { id: string; username: string };
    error?: string;
};
