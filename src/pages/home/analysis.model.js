import { InputCore } from "@/domains/ui/input";
import { analysis_example } from "./analysis.data.js";

/** @param {ViewComponentProps} props */
export function AnalysisPageModel(props) {
  const analysis_ = ref(null);
  const input$ = new InputCore({ defaultValue: "" });
  const methods = {
    submit() {
      if (!input$.value) { props.app.tip({ text: ["请先输入要分析的内容"] }); return; }
      // The original page uses this fixed example for every submitted sentence.
      analysis_.as({ segments: analysis_example.texts, explain: analysis_example.explain });
    },
    segmentClass(segment) {
      const classes = {
        名词: "underline decoration-solid decoration-2 decoration-green-400",
        动词: "underline decoration-wavy decoration-2 decoration-blue-400",
        副词: "text-red-800",
        助词: "underline decoration-dashed decoration-2",
        助动词: "underline decoration-dotted decoration-2",
      };
      return `relative inline-block p-2 pt-8 text-center ${classes[segment.type] || ""}`;
    },
  };
  return { state: { analysis: analysis_ }, methods, ui: { input$, submit$: new Timeless.vm.ButtonCore({ onClick: methods.submit }) } };
}
