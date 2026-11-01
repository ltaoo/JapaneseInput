import HomeLayout from "@/pages/home/layout.js";
import HomeIndexPage from "@/pages/home/index.js";
import LoginPage from "@/pages/login/index.js";
import RegisterPage from "@/pages/register/index.js";
import NotFoundPage from "@/pages/notfound/index.js";
import CanvasDrawingManagePage from "@/pages/home/manage.js";
import HiraganaChallengePage from "@/pages/home/challenge1.js";
import WordChallengePage from "@/pages/home/challenge2.js";
import ParagraphAnalysisPage from "@/pages/home/analysis.js";
import { ViewComponent } from "@/store/types";

import { PageKeys } from "./routes";

export const pages: Omit<Record<PageKeys, ViewComponent>, "root"> = {
  "root.home_layout": HomeLayout,
  "root.home_layout.index": HomeIndexPage,
  "root.home_layout.draw": CanvasDrawingManagePage,
  "root.home_layout.challenge1": HiraganaChallengePage,
  "root.home_layout.challenge2": WordChallengePage,
  "root.home_layout.analysis": ParagraphAnalysisPage,
  "root.login": LoginPage,
  "root.register": RegisterPage,
  "root.notfound": NotFoundPage,
};
