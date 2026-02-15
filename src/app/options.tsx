import render from "@app/core/render";
import "@app/index.css";
import { lazy } from "react";

export const PanelsPage = lazy(() => import("../pages/options"));
render(<PanelsPage />);
