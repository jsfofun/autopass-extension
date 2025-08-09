import { type User } from "@app/api/users";
import { create } from "zustand";

export interface ProfileStore {
    twitch: User | null;
}

const useProfileStore = create<ProfileStore>()(() => ({
    twitch: null,
}));

export const useAppDemension = create<{
    width: number;
    height: number;
}>()(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
}));
export const init = () => {
    document.addEventListener("resize", () => {
        useAppDemension.setState({
            width: window.innerWidth,
            height: window.innerHeight,
        });
    });

    useAppDemension.setState({
        width: window.innerWidth,
        height: window.innerHeight,
    });
};

useAppDemension.subscribe((state) => {
    console.log("App demension changed", state);
});

export default useProfileStore;
