import { ApplicationModel } from "./app.model.js";
import { RouteView } from "@/components/RouteView/index.js";

export function ApplicationView() {
  const vm$ = ApplicationModel();
  return View({
    attributes: { n: "application", "data-n": "application" }, class: "study-application",
    onMounted() { vm$.methods.init(); },
    onUnmounted() { vm$.methods.destroy(); },
  }, [
    Show({ when: computed(vm$.state.ready, (v) => !v), ok: () => [
      View({ attributes: { n: "application-loading", "data-n": "application-loading" } }, ["正在加载…"]),
    ] }),
    For({ each: vm$.state.subviews, render(view, index) {
      return RouteView({ store: view, index: index.value, children: [vm$.props.pages[view.name]({ ...vm$.props, view })] });
    } }),
    Show({ when: computed(vm$.state.tip, Boolean), ok: () => [
      View({ attributes: { n: "application-toast", "data-n": "application-toast", role: "status", "aria-live": "polite" } }, [vm$.state.tip]),
    ] }),
  ]);
}
