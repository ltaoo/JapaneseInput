import { TextField } from "@/components/controls.js";
import { JapaneseInputModel } from "./index.model.js";

export function JapaneseInput(props) {
  const vm$ = JapaneseInputModel(props);
  const store = vm$.store;
  const state_ = ref({ ...store.state });
  const off = store.onChange(() => state_.as({ ...store.state }));
  return View({
    attributes: { n: "japanese-input", "data-n": "japanese-input" },
    class: "relative w-full",
    onMounted() { store.init(); },
    onUnmounted() { off(); },
    onKeyUp: vm$.keyup,
    onClick(event) { if (event.target.tagName === "TEXTAREA") store.reset(); },
  }, [
    TextField({ store: store.ui.$input, name: "japanese-input-text", multiline: true, label: "日语输入", onKeyDown: vm$.keydown }),
    Show({ when: computed(state_, (s) => s.isInputting && !s.isSelecting), ok: () => [
      View({
        attributes: { n: "composition-popup", "data-n": "composition-popup" },
        class: "fixed", style: computed(state_, vm$.popupStyle), onMouseDown(event) { event.preventDefault(); },
      }, [View({ attributes: { n: "composition-panel", "data-n": "composition-panel" }, class: "absolute min-w-[68px] min-h-[108px] p-2 rounded-md border bg-white shadow whitespace-nowrap", style: computed(state_, vm$.panelStyle) }, [
        computed(state_, (s) => s.value),
        View({ attributes: { n: "composition-caret", "data-n": "composition-caret" }, class: "inline-block w-[2px] h-4 ml-1 bg-blue-500" }),
      ])]),
    ] }),
    Show({ when: computed(state_, (s) => s.isSelecting), ok: () => [
      View({ attributes: { n: "conversion-popup", "data-n": "conversion-popup" }, class: "fixed", style: computed(state_, vm$.popupStyle), onMouseDown(event) { event.preventDefault(); } }, [
        View({ attributes: { n: "conversion-panel", "data-n": "conversion-panel" }, class: "absolute min-w-[88px] min-h-[108px] p-2 rounded-md border bg-white shadow whitespace-nowrap", style: computed(state_, vm$.panelStyle) }, [
          View({ attributes: { n: "conversion-selected", "data-n": "conversion-selected" }, class: "p-2 underline decoration-2 underline-offset-4" }, [computed(state_, (s) => s.selected)]),
          View({ attributes: { n: "conversion-options", "data-n": "conversion-options" }, class: "h-[300px] text-sm" }, [
            For({ each: computed(state_, (s) => s.kanjiResp.list), render(option, index) {
              return View({ attributes: { n: "conversion-option", "data-n": "conversion-option" }, class: combine({ state: state_, index }, (s) => `p-2 ${s.index === s.state.selectedIndex ? "bg-gray-100" : ""}`) }, [computed(index, (i) => `${i + 1}. ${option.text}`)]);
            } }),
          ]),
          Show({ when: computed(state_, (s) => s.kanjiResp.hasMore), ok: () => [
            View({ attributes: { n: "conversion-pagination", "data-n": "conversion-pagination" }, class: "flex text-gray-500" }, [
              View({ attributes: { n: "conversion-previous", "data-n": "conversion-previous", role: "button", tabindex: "0", "aria-label": "上一页候选词", "aria-disabled": computed(state_, (s) => !s.kanjiResp.canPrev) }, class: computed(state_, (s) => `p-1 border cursor-pointer ${s.kanjiResp.canPrev ? "" : "text-gray-100"}`), onClick() { store.prevPageWords(); }, onKeyDown(event) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); store.prevPageWords(); } } }, ["⌃"]),
              View({ attributes: { n: "conversion-next", "data-n": "conversion-next", role: "button", tabindex: "0", "aria-label": "下一页候选词", "aria-disabled": computed(state_, (s) => !s.kanjiResp.canNext) }, class: computed(state_, (s) => `p-1 border cursor-pointer ${s.kanjiResp.canNext ? "" : "text-gray-100"}`), onClick() { store.nextPageWords(); }, onKeyDown(event) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); store.nextPageWords(); } } }, ["⌄"]),
            ]),
          ] }),
        ]),
      ]),
    ] }),
  ]);
}
