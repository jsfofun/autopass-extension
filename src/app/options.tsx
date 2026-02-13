import render from "@app/core/render";
import { lazy } from "react";

export const PanelsPage = lazy(() => import("../pages/options"));
render(<PanelsPage />);
