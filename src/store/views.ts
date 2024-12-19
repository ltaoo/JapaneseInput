import { JSXElement } from "solid-js";

import { HomeLayout } from "@/pages/home/layout";
import { HomeIndexPage } from "@/pages/home";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";
import { NotFoundPage } from "@/pages/notfound";
import { CanvasDrawingManagePage } from "@/pages/home/manage";
import { KanatanaChallengePage } from "@/pages/home/challenge1";
import { WordChallengePage } from "@/pages/home/challenge2";
import { ParagraphAnalysisPage } from "@/pages/home/analysis";
import { ViewComponent } from "@/store/types";

import { PageKeys } from "./routes";

export const pages: Omit<Record<PageKeys, ViewComponent>, "root"> = {
  "root.home_layout": HomeLayout,
  "root.home_layout.index": HomeIndexPage,
  "root.home_layout.draw": CanvasDrawingManagePage,
  "root.home_layout.challenge1": KanatanaChallengePage,
  "root.home_layout.challenge2": WordChallengePage,
  "root.home_layout.analysis": ParagraphAnalysisPage,
  "root.login": LoginPage,
  "root.register": RegisterPage,
  "root.notfound": NotFoundPage,
};
