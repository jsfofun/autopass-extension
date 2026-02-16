import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";

import "../index.css";
import Loading from "./loading";
import ErrorBoundary from "./error-boundary";
// import WithI18n from "./WithI18n";
// import WithAuthentication from "./WithAuthentication";
// import { auth, is_authorized } from "@app/services/api";
import { TooltipProvider } from "@/components/ui/tooltip";
const render = (node: React.ReactNode) => {
    const app = document.getElementById("root");

    return createRoot(app!).render(
        <React.StrictMode>
            <ErrorBoundary>
                <Suspense fallback={<Loading />}>
                    <TooltipProvider>{node}</TooltipProvider>
                </Suspense>
            </ErrorBoundary>
        </React.StrictMode>,
    );
};

export default render;
