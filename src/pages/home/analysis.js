import { AnalysisPageModel } from "./analysis.model.js";
import { Action, TextField } from "@/components/controls.js";

/** @param {ViewComponentProps} props */
export default function AnalysisPageView(props) {
  const vm$ = AnalysisPageModel(props);
  return View({ attributes: { n: "sentence-analysis-page", "data-n": "sentence-analysis-page" }, class: "study-page utility-page", onUnmounted() { vm$.methods.destroy(); } }, [
    View({ attributes: { n: "sentence-analysis-heading", "data-n": "sentence-analysis-heading" }, class: "utility-heading" }, [
      View({ attributes: { n: "sentence-analysis-title", "data-n": "sentence-analysis-title", role: "heading", "aria-level": "1" }, class: "page-title" }, ["句子分析"]),
      View({ attributes: { n: "sentence-analysis-description", "data-n": "sentence-analysis-description" }, class: "page-description" }, ["输入日语句子，查看读音、分词、语法与同句式例句。"]),
    ]),
    View({ attributes: { n: "sentence-analysis-controls", "data-n": "sentence-analysis-controls" } }, [
      TextField({ store: vm$.ui.input$, name: "sentence-analysis-input", multiline: true, label: "要分析的日语句子" }),
      Action({ name: "analyze-sentence", store: vm$.ui.submit$ }, ["解析"]),
    ]),
    View({ attributes: { n: "analysis-status", "data-n": "analysis-status", role: "status", "aria-live": "polite" } }, [computed(vm$.state.loading, (loading) => loading ? "正在分析并生成例句…" : "")]),
    View({ attributes: { n: "analysis-error", "data-n": "analysis-error", role: "alert" } }, [vm$.state.error]),
    View({ attributes: { n: "analysis-legend", "data-n": "analysis-legend", "aria-label": "词性图例" } }, [
      "词性图例：", ...["名词", "动词", "副词", "助词", "助动词"].map((type) => View({ attributes: { n: "legend-item", "data-n": "legend-item" }, class: vm$.methods.segmentClass({ type }) }, [type])),
    ]),
    Show({ when: computed(vm$.state.analysis, Boolean), ok: () => [
      View({ attributes: { n: "sentence-analysis-result", "data-n": "sentence-analysis-result" } }, [
        View({ attributes: { n: "sentence-analysis-content", "data-n": "sentence-analysis-content" } }, [
          View({ attributes: { n: "sentence-segments", "data-n": "sentence-segments" } }, [
            For({ each: computed(vm$.state.analysis, (s) => s?.segments || []), render(segment) {
              return View({ attributes: { n: "sentence-segment", "data-n": "sentence-segment" }, class: vm$.methods.segmentClass(segment), style: { "min-width": `${(segment.kana || "").length * 20}px` } }, [
                segment.kana !== segment.text ? View({ attributes: { n: "segment-reading", "data-n": "segment-reading" }, class: "absolute top-0 left-1/2 -translate-x-1/2 text-gray-500 text-[0.6em] whitespace-nowrap" }, [segment.kana]) : null,
                View({ attributes: { n: "segment-text", "data-n": "segment-text", title: [segment.meaning, segment.desc].filter(Boolean).join("：") } }, [segment.text]),
                segment.original || segment.conjugation ? View({ attributes: { n: "segment-conjugation", "data-n": "segment-conjugation" } }, [[segment.original, segment.conjugation].filter(Boolean).join(" · ")]) : null,
              ]);
            } }),
          ]),
          View({ attributes: { n: "sentence-translation", "data-n": "sentence-translation" }, class: "mt-4 p-2 text-gray-800" }, [computed(vm$.state.analysis, (s) => s?.explain || "")]),
        ]),
        View({ attributes: { n: "analysis-details", "data-n": "analysis-details" } }, [
          ...[["tense", "时态"], ["aspect", "体态"], ["pattern", "句式结构"], ["conclusion", "使用结论"]].map(([field, label]) => Show({
            when: computed(vm$.state.analysis, (s) => Boolean(s?.[field])), ok: () => [
              View({ attributes: { n: `analysis-${field}`, "data-n": `analysis-${field}` } }, [
                View({ attributes: { n: "analysis-detail-label", "data-n": "analysis-detail-label" } }, [label]),
                View({ attributes: { n: "analysis-detail-value", "data-n": "analysis-detail-value" } }, [computed(vm$.state.analysis, (s) => s?.[field] || "")]),
              ]),
            ],
          })),
        ]),
        Show({ when: computed(vm$.state.examples, (items) => items.length > 0), ok: () => [
          View({ attributes: { n: "analysis-examples", "data-n": "analysis-examples" } }, [
            View({ attributes: { n: "analysis-examples-title", "data-n": "analysis-examples-title", role: "heading", "aria-level": "2" } }, ["句型例句"]),
            For({ each: vm$.state.examples, render(example) {
              return View({ attributes: { n: "analysis-example", "data-n": "analysis-example" } }, [
                View({ attributes: { n: "example-japanese", "data-n": "example-japanese", lang: "ja" } }, [example.japanese]),
                View({ attributes: { n: "example-chinese", "data-n": "example-chinese" } }, [example.chinese]),
              ]);
            } }),
          ]),
        ] }),
      ]),
    ] }),
  ]);
}
