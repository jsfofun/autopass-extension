import render from "@app/core/render";
import { lazy } from "react";

export const PanelsPage = lazy(() => import("../pages/popup"));
render(<PanelsPage />);
