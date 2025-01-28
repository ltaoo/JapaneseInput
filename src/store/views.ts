import { JSXElement } from "solid-js";

import { ViewComponent } from "@/store/types";
import { HomeLayout } from "@/pages/home/layout";
import { HomeIndexPage } from "@/pages/home";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";
import { NotFoundPage } from "@/pages/notfound";
import { CanvasDrawingManagePage } from "@/pages/home/manage";
import { HiraganaChallengePage } from "@/pages/home/challenge1";
import { WordChallengePage } from "@/pages/home/challenge2";
import { ParagraphAnalysisPage } from "@/pages/home/analysis";
import { TestPage } from "@/pages/test";

import { PageKeys } from "./routes";

export const pages: Omit<Record<PageKeys, ViewComponent>, "root"> = {
  "root.home_layout": HomeLayout,
  "root.home_layout.index": HomeIndexPage,
  "root.home_layout.draw": CanvasDrawingManagePage,
  "root.home_layout.challenge1": HiraganaChallengePage,
  "root.home_layout.challenge2": WordChallengePage,
  "root.home_layout.analysis": ParagraphAnalysisPage,
  "root.test": TestPage,
  "root.login": LoginPage,
  "root.register": RegisterPage,
  "root.notfound": NotFoundPage,
};
