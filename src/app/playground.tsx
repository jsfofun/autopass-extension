import render from "@app/core/render";
import { lazy } from "react";

export const PlaygroundPage = lazy(() => import("../pages/playground"));
render(<PlaygroundPage />);
