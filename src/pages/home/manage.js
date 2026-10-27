import { DrawingManagePageModel } from "./manage.model.js";
import { Action, TextField } from "@/components/controls.js";

/** @param {ViewComponentProps} props */
export default function DrawingManagePageView(props) {
  const vm$ = DrawingManagePageModel(props);
  return View({ attributes: { n: "drawing-manage-page", "data-n": "drawing-manage-page" }, class: "study-page utility-page", onUnmounted() { vm$.methods.destroy(); } }, [
    View({ attributes: { n: "drawing-heading", "data-n": "drawing-heading" }, class: "utility-heading" }, [
      View({ attributes: { n: "drawing-title", "data-n": "drawing-title", role: "heading", "aria-level": "1" }, class: "page-title" }, ["绘图记录"]),
      View({ attributes: { n: "drawing-count", "data-n": "drawing-count" }, class: "page-description" }, [computed(vm$.state.drawings, (v) => `共${v.length}条记录`)]),
    ]),
    View({ attributes: { n: "drawing-controls", "data-n": "drawing-controls" } }, [
      TextField({ name: "drawing-export-name", store: vm$.ui.name$, label: "绘图导出名称" }),
      Action({ name: "download-drawings", store: vm$.ui.download$ }, ["下载"]),
      Action({ name: "clear-drawings", store: vm$.ui.clear$, class: "button-danger" }, ["删除"]),
      Action({ name: "refresh-drawings", store: vm$.ui.refresh$, class: "button-secondary" }, ["刷新"]),
    ]),
    Show({ when: computed(vm$.state.drawings, (drawings) => !drawings.length), ok: () => [
      View({ attributes: { n: "drawing-empty", "data-n": "drawing-empty" } }, [
        View({ attributes: { n: "drawing-empty-symbol", "data-n": "drawing-empty-symbol", "aria-hidden": "true" } }, ["あ"]),
        View({ attributes: { n: "drawing-empty-title", "data-n": "drawing-empty-title" } }, ["这里还没有绘图记录"]),
        View({ attributes: { n: "drawing-empty-description", "data-n": "drawing-empty-description" } }, ["已有记录会显示在这里，可下载或单独删除。"]),
      ]),
    ] }),
    View({ attributes: { n: "drawing-list", "data-n": "drawing-list" } }, [
      For({ each: vm$.state.drawings, render(drawing) {
        return View({ attributes: { n: "drawing-record", "data-n": "drawing-record" } }, [
          Img({ attributes: { n: "drawing-preview", "data-n": "drawing-preview" }, class: "w-[210px] h-[210px]", src: drawing, alt: "手写绘图记录" }),
          View({ attributes: { n: "delete-drawing", "data-n": "delete-drawing", role: "button", tabindex: "0" }, class: "cursor-pointer", onClick() { vm$.methods.remove(drawing); }, onKeyDown(event) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); vm$.methods.remove(drawing); } } }, ["删除"]),
        ]);
      } }),
    ]),
  ]);
}
