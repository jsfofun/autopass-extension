import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";

import "../index.css";
// import "@app/style/font.css";
import Loading from "./loading";
import ErrorBoundary from "./error-boundary";
// import WithI18n from "./WithI18n";
// import WithAuthentication from "./WithAuthentication";
// import { auth, is_authorized } from "@app/services/api";

const render = (node: React.ReactNode) => {
    const app = document.getElementById("root");

    return createRoot(app!).render(
        <React.StrictMode>
            <ErrorBoundary>
                <Suspense fallback={<Loading />}>
                    {node}
                    {/* <WithAuthentication> */}
                    {/* <WithI18n children={node} /> */}
                    {/* </WithAuthentication> */}
                </Suspense>
            </ErrorBoundary>
        </React.StrictMode>,
    );
};

export default render;
