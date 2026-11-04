import { InputCore } from "@/domains/ui/input";
import { analyze_paragraph, get_examples } from "@/biz/analysis";
import { analysis_example, example_sentences } from "./analysis.data.js";

/** @param {ViewComponentProps} props */
export function AnalysisPageModel(props) {
  const analysis_ = ref({ ...analysis_example, segments: analysis_example.texts });
  const examples_ = ref(example_sentences);
  const loading_ = ref(false);
  const error_ = ref("");
  const input$ = new InputCore({ defaultValue: "" });
  let disposed = false;
  const methods = {
    async submit() {
      const text = input$.value.trim();
      if (disposed || loading_.value) return;
      if (!text) { props.app.tip({ text: ["请先输入要分析的内容"] }); return; }
      loading_.as(true);
      error_.as("");
      examples_.as([]);
      submit$.setLoading(true);
      try {
        const result = await analyze_paragraph(text);
        if (disposed) return;
        analysis_.as({ ...result, segments: result.texts });
        try {
          const examples = await get_examples(text, result.pattern);
          if (!disposed) examples_.as(examples.examples);
        } catch (error) {
          if (!disposed) error_.as(`分析已完成，例句生成失败：${error.message}`);
        }
      } catch (error) {
        if (!disposed) {
          error_.as(`分析失败：${error.message}`);
          props.app.tip({ text: [error_.value] });
        }
      } finally {
        if (!disposed) { loading_.as(false); submit$.setLoading(false); }
      }
    },
    segmentClass(segment) {
      const classes = {
        名词: "underline decoration-solid decoration-2 decoration-green-400",
        动词: "underline decoration-wavy decoration-2 decoration-blue-400",
        副词: "text-red-800",
        助词: "underline decoration-dashed decoration-2",
        助动词: "underline decoration-dotted decoration-2",
      };
      return `relative inline-block p-2 pt-8 pb-6 text-center ${classes[segment.type] || ""}`;
    },
    destroy() { disposed = true; },
  };
  const submit$ = new Timeless.vm.ButtonCore({ onClick: methods.submit });
  return { state: { analysis: analysis_, examples: examples_, loading: loading_, error: error_ }, methods, ui: { input$, submit$ } };
}
