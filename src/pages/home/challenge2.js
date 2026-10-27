import { WordChallengePageModel } from "./challenge2.model.js";
import { JapaneseInput } from "@/components/JapaneseInput/index.js";
import { Action } from "@/components/controls.js";
import { ChallengeProgress } from "./progress.js";

/** @param {ViewComponentProps} props */
export default function WordChallengePageView(props) {
  const vm$ = WordChallengePageModel(props);
  return View({ attributes: { n: "word-challenge-page", "data-n": "word-challenge-page" }, class: "study-page challenge-page", onUnmounted() { vm$.methods.destroy(); } }, [
    View({ attributes: { n: "word-heading", "data-n": "word-heading" }, class: "challenge-heading" }, [
      View({ attributes: { n: "word-heading-text", "data-n": "word-heading-text" } }, [
        View({ attributes: { n: "word-title", "data-n": "word-title", role: "heading", "aria-level": "1" }, class: "page-title" }, ["单词挑战"]),
        View({ attributes: { n: "word-description", "data-n": "word-description" }, class: "page-description" }, ["看中文释义，试着写出对应的日语。"]),
      ]),
      Action({ name: "word-hint", store: vm$.ui.tip$, class: "button-secondary" }, ["提示"]),
    ]),
    View({ attributes: { n: "word-practice-panel", "data-n": "word-practice-panel" }, class: "practice-panel" }, [
      View({ attributes: { n: "word-question-label", "data-n": "word-question-label" } }, ["这个词，用日语怎么说？"]),
      View({ attributes: { n: "word-question", "data-n": "word-question" } }, [vm$.state.meaning]),
      View({ attributes: { n: "word-answer", "data-n": "word-answer" } }, [
        View({ attributes: { n: "word-answer-controls", "data-n": "word-answer-controls" } }, [
          JapaneseInput({ store: vm$.ui.input$ }),
          Action({ name: "submit-word-answer", store: vm$.ui.submit$ }, ["确定"]),
        ]),
        View({ attributes: { n: "word-input-guide", "data-n": "word-input-guide" } }, ["输入罗马字转换为假名，按 Tab 选择汉字。"]),
      ]),
      View({ attributes: { n: "word-feedback", "data-n": "word-feedback", "aria-live": "polite", "data-correct": computed(vm$.state.correct, (v) => v === null ? undefined : String(v)) } }, [computed(vm$.state.correct, (v) => v === true ? "正确" : v === false ? "错误" : "")]),
    ]),
    ChallengeProgress({ state: vm$.state }),
  ]);
}
