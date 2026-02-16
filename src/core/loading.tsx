import { m } from "@/paraglide/messages";
import { useEffect, useState } from "react";

const reload_btn_reveal_time = 5000;

const Loading: React.FC = () => {
    const [showReload, setShowReload] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setShowReload(true);
        }, reload_btn_reveal_time);

        return () => {
            clearTimeout(timeout);
        };
    }, []);

    return (
        <div className={"centralize-content"}>
            <div className={"loader"}>
                <h4>{m["common.loading"]()}</h4>
            </div>
            {showReload && (
                <div>
                    <button onClick={() => window.location.reload()} className={"btn btn-primary"}>
                        {m["common.reload"]()}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Loading;
