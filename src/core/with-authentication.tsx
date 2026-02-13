import UsersAPI from "@app/api/users";
import { is_authorized } from "@app/services/api";

import useProfileStore from "@app/store/profileStore";

import { useEffect } from "react";
import Loading from "./loading";

const WithAuthentication: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const profile = useProfileStore((store) => store.twitch);
    const authorized = is_authorized();

    useEffect(() => {
        if (!profile && authorized) {
            UsersAPI.getUserProfile()
                .then((user) => {
                    useProfileStore.setState({ twitch: user.data });
                })
                .catch((err) => {
                    console.error(err);
                });
        }
    }, [authorized, profile]);

    if (!authorized) {
        return (
            <div>
                <h1>Unauthorized</h1>
                <p>Please authorize the extension to continue</p>
            </div>
        );
    }

    if (!profile) return <Loading />;

    return children;
};

export default WithAuthentication;
