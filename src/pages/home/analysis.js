import { AnalysisPageModel } from "./analysis.model.js";
import { Action, TextField } from "@/components/controls.js";

/** @param {ViewComponentProps} props */
export default function AnalysisPageView(props) {
  const vm$ = AnalysisPageModel(props);
  return View({ attributes: { n: "sentence-analysis-page", "data-n": "sentence-analysis-page" }, class: "study-page utility-page" }, [
    View({ attributes: { n: "sentence-analysis-heading", "data-n": "sentence-analysis-heading" }, class: "utility-heading" }, [
      View({ attributes: { n: "sentence-analysis-title", "data-n": "sentence-analysis-title", role: "heading", "aria-level": "1" }, class: "page-title" }, ["句子分析"]),
      View({ attributes: { n: "sentence-analysis-description", "data-n": "sentence-analysis-description" }, class: "page-description" }, ["输入日语句子，查看读音、分词与中文解释。"]),
    ]),
    View({ attributes: { n: "sentence-analysis-controls", "data-n": "sentence-analysis-controls" } }, [
      TextField({ store: vm$.ui.input$, name: "sentence-analysis-input", multiline: true, label: "要分析的日语句子" }),
      Action({ name: "analyze-sentence", store: vm$.ui.submit$ }, ["解析"]),
    ]),
    Show({ when: computed(vm$.state.analysis, Boolean), ok: () => [
      View({ attributes: { n: "sentence-analysis-result", "data-n": "sentence-analysis-result" } }, [
        View({ attributes: { n: "sentence-analysis-content", "data-n": "sentence-analysis-content" } }, [
          View({ attributes: { n: "sentence-segments", "data-n": "sentence-segments" } }, [
            For({ each: computed(vm$.state.analysis, (s) => s?.segments || []), render(segment) {
              return View({ attributes: { n: "sentence-segment", "data-n": "sentence-segment" }, class: vm$.methods.segmentClass(segment), style: { "min-width": `${segment.kana.length * 20}px` } }, [
                segment.kana !== segment.text ? View({ attributes: { n: "segment-reading", "data-n": "segment-reading" }, class: "absolute top-0 left-1/2 -translate-x-1/2 text-gray-500 text-[0.6em] whitespace-nowrap" }, [segment.kana]) : null,
                segment.text,
              ]);
            } }),
          ]),
          View({ attributes: { n: "sentence-translation", "data-n": "sentence-translation" }, class: "mt-4 p-2 text-gray-800" }, [computed(vm$.state.analysis, (s) => s?.explain || "")]),
        ]),
      ]),
    ] }),
  ]);
}
