import api from "@app/services/api";

export interface User {
    id: string;

    type: string;
    login: string;

    view_count: number;
    created_at: string;
    description: string;
    display_name: string;
    broadcaster_type: string;

    offline_image_url: string;
    profile_image_url: string;
}

const UsersAPI = {
    getUserProfile: async () => {
        const req = await api.post("/profile");
        if (req.status === 200) {
            return (await req.json()) as Promise<{
                error: boolean;
                data: User;
            }>;
        }
        throw new Error("Failed to get user profile");
    },
};

export default UsersAPI;
