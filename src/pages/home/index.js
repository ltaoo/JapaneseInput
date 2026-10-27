import { HomePageModel } from "./index.model.js";
import { AudioView } from "@/components/Audio/index.js";

/** @param {ViewComponentProps} props */
export default function HomePageView(props) {
  const vm$ = HomePageModel(props);
  return View({ attributes: { n: "kana-chart-page", "data-n": "kana-chart-page" }, class: "study-page kana-page" }, [
    AudioView({ store: vm$.ui.audio$ }),
    View({ attributes: { n: "kana-introduction", "data-n": "kana-introduction" } }, [
      View({ attributes: { n: "kana-page-title", "data-n": "kana-page-title", role: "heading", "aria-level": "1" }, class: "page-title" }, ["五十音图"]),
      View({ attributes: { n: "kana-page-description", "data-n": "kana-page-description" }, class: "page-description" }, ["从一个音开始，\n慢慢读懂日语。"]),
      View({ attributes: { n: "kana-listening-guide", "data-n": "kana-listening-guide" } }, [
        View({ attributes: { n: "kana-listening-guide-title", "data-n": "kana-listening-guide-title" } }, ["点一下，听发音"]),
        View({ attributes: { n: "kana-listening-guide-description", "data-n": "kana-listening-guide-description" } }, ["先听，再跟读。字形下方的罗马字，可以帮助你记住读音。"]),
      ]),
    ]),
    View({ attributes: { n: "kana-chart-container", "data-n": "kana-chart-container" } }, [
      View({ attributes: { n: "kana-chart-tabs", "data-n": "kana-chart-tabs", role: "tablist", "aria-label": "假名分类" } }, vm$.tables.map((table, index) => View({
        attributes: { n: "kana-chart-tab", "data-n": "kana-chart-tab", role: "tab", tabindex: "0", "aria-selected": computed(vm$.state.table, (v) => v === index) },
        onClick() { vm$.methods.selectTable(index); },
        onKeyDown(event) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); vm$.methods.selectTable(index); } },
      }, [table.title]))),
      ...vm$.tables.map((table, index) => View({
        attributes: { n: "kana-chart", "data-n": "kana-chart", role: "tabpanel" },
        style: { display: computed(vm$.state.table, (v) => v === index ? "grid" : "none"), "grid-template-columns": `repeat(${table.columns}, 1fr)` },
      }, table.chars.map((char) => View({
        attributes: { n: "kana-chart-character", "data-n": "kana-chart-character", "data-placeholder": char.placeholder ? "true" : undefined, role: "button", tabindex: char.placeholder ? "-1" : "0", "aria-disabled": !!char.placeholder, "aria-label": `${char.hiragana} ${char.rōmaji}` },
        onClick() { vm$.methods.play(char); },
        onKeyDown(event) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); vm$.methods.play(char); } },
      }, [
        View({ attributes: { n: "kana-character", "data-n": "kana-character" } }, [char.hiragana]),
        View({ attributes: { n: "kana-romaji", "data-n": "kana-romaji" } }, [char.rōmaji]),
      ])))),
    ]),
  ]);
}
