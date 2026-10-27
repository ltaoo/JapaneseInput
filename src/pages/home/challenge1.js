import { HiraganaChallengePageModel } from "./challenge1.model.js";
import { HiraganaCanvas } from "@/components/HiraganaCanvas/index.js";
import { AudioView } from "@/components/Audio/index.js";
import { Action } from "@/components/controls.js";
import { ChallengeProgress } from "./progress.js";

/** @param {ViewComponentProps} props */
export default function HiraganaChallengePageView(props) {
  const vm$ = HiraganaChallengePageModel(props);
  const recognize_ = ref({ ...vm$.ui.recognize$.state });
  const off = vm$.ui.recognize$.onChange(() => {
    recognize_.as({ ...vm$.ui.recognize$.state });
  });
  return View({ attributes: { n: "hiragana-challenge-page", "data-n": "hiragana-challenge-page" }, class: "study-page challenge-page", onUnmounted() { off(); vm$.methods.destroy(); } }, [
    View({ attributes: { n: "handwriting-heading", "data-n": "handwriting-heading" }, class: "challenge-heading" }, [
      View({ attributes: { n: "handwriting-heading-text", "data-n": "handwriting-heading-text" } }, [
        View({ attributes: { n: "handwriting-title", "data-n": "handwriting-title", role: "heading", "aria-level": "1" }, class: "page-title" }, ["平假名挑战"]),
        View({ attributes: { n: "handwriting-description", "data-n": "handwriting-description" }, class: "page-description" }, ["听一听，把你听到的假名写下来。"]),
      ]),
      Action({ name: "challenge-hint", store: vm$.ui.tip$, class: "button-secondary" }, ["提示"]),
    ]),
    View({ attributes: { n: "handwriting-practice-panel", "data-n": "handwriting-practice-panel" }, class: "practice-panel" }, [
      View({ attributes: { n: "pronunciation-control", "data-n": "pronunciation-control" } }, [
        Action({ name: "play-challenge-audio", store: vm$.ui.play$, attributes: { "aria-label": "播放发音" } }, [Icon({ name: "mic", size: 28, attributes: { n: "pronunciation-icon" } })]),
        View({ attributes: { n: "pronunciation-instruction", "data-n": "pronunciation-instruction" } }, ["点击听发音"]),
        AudioView({ store: vm$.ui.audio$ }),
      ]),
      View({ attributes: { n: "handwriting-answer", "data-n": "handwriting-answer" } }, [
        View({ attributes: { n: "handwriting-surface", "data-n": "handwriting-surface" }, class: "relative w-[210px] h-[210px]" }, [HiraganaCanvas({ store: vm$.ui.recognize$ })]),
        View({ attributes: { n: "handwriting-actions", "data-n": "handwriting-actions" } }, [
          Action({ name: "recognize-handwriting", store: vm$.ui.recognize_button$ }, ["识别"]),
          Action({ name: "clear-handwriting", store: vm$.ui.clear$, class: "button-secondary" }, ["清除"]),
        ]),
        View({ attributes: { n: "recognition-text", "data-n": "recognition-text", "data-correct": computed(vm$.state.correct, (v) => v === null ? undefined : String(v)) } }, [computed(recognize_, (s) => s.text || "")]),
        View({ attributes: { n: "challenge-feedback", "data-n": "challenge-feedback", "aria-live": "polite", "data-correct": computed(vm$.state.correct, (v) => v === null ? undefined : String(v)) } }, [computed(vm$.state.correct, (v) => v === true ? "正确" : v === false ? "错误" : "")]),
      ]),
    ]),
    ChallengeProgress({ state: vm$.state }),
  ]);
}
