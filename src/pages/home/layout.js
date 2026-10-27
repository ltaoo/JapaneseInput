import { HomeLayoutModel } from "./layout.model.js";
import { RouteView } from "@/components/RouteView/index.js";

/** @param {ViewComponentProps} props */
export default function HomeLayoutView(props) {
  const vm$ = HomeLayoutModel(props);
  return View({ attributes: { n: "home-layout", "data-n": "home-layout" }, onUnmounted() { vm$.methods.destroy(); } }, [
    View({ attributes: { n: "home-header", "data-n": "home-header" } }, [
      View({ attributes: { n: "study-brand", "data-n": "study-brand" } }, [
        View({ attributes: { n: "study-brand-mark", "data-n": "study-brand-mark", "aria-hidden": "true" } }, ["あ"]),
        View({ attributes: { n: "study-brand-name", "data-n": "study-brand-name" } }, ["日语练习室"]),
      ]),
      View({ attributes: { n: "home-navigation", "data-n": "home-navigation", role: "navigation", "aria-label": "主导航" } }, vm$.menu.map((item) => View({
        attributes: { n: "home-navigation-item", "data-n": "home-navigation-item", role: "link", tabindex: "0", "data-route": item.name, "aria-current": computed(vm$.state.current, (v) => v === item.name ? "page" : undefined) },
        onClick() { vm$.methods.navigate(item.name); },
        onKeyDown(event) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); vm$.methods.navigate(item.name); } },
      }, [item.title]))),
    ]),
    View({ attributes: { n: "home-page-container", "data-n": "home-page-container" } }, [
      For({ each: vm$.state.subviews, render(view, index) {
        return RouteView({ store: view, index: index.value, children: [props.pages[view.name]({ ...props, view })] });
      } }),
    ]),
  ]);
}
