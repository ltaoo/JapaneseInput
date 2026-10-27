import { CanvasView } from "@/components/Canvas/index.js";

export function HiraganaCanvas({ store }) {
  const state_ = ref({ ...store.state });
  const off = store.onChange(() => state_.as({ ...store.state }));
  return View({
    attributes: { n: "handwriting-recognition", "data-n": "handwriting-recognition" },
    class: "relative w-full h-full",
    onUnmounted() { off(); },
  }, [
    CanvasView({ store: store.$canvas }),
    Show({ when: computed(state_, (s) => s.finish && !s.result.length), ok: () => [
      View({ attributes: { n: "recognition-empty", "data-n": "recognition-empty" }, class: "p-2 text-center" }, ["没有识别出结果"]),
    ] }),
    View({ attributes: { n: "recognition-candidates", "data-n": "recognition-candidates" }, class: "absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2", style: { "z-index": 1000 } }, [
      For({ each: computed(state_, (s) => s.finish && s.result.length !== 1 ? s.result : []), render(text) {
        return View({
          attributes: { n: "recognition-candidate", "data-n": "recognition-candidate", role: "button", tabindex: "0" },
          class: "p-2 rounded-md bg-gray-100 cursor-pointer hover:bg-gray-200",
          onClick() { store.select(text); },
          onKeyDown(event) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); store.select(text); } },
        }, [text]);
      } }),
    ]),
  ]);
}
