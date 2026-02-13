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
                <h4>Loading...</h4>
            </div>
            {showReload && (
                <div>
                    {/* <button onClick={() => window.Twitch.ext.actions.requestIdShare()}>Authorize</button> */}
                    <button onClick={() => window.location.reload()} className={"btn btn-primary"}>
                        Reload
                    </button>
                </div>
            )}
        </div>
    );
};

export default Loading;
