import JSZip from "jszip";
import { InputCore } from "@/domains/ui/input";

/** @param {ViewComponentProps} props */
export function DrawingManagePageModel({ app, storage, view }) {
  const drawings_ = ref([...storage.get("canvas")]);
  const name$ = new InputCore({ defaultValue: "a" });
  const methods = {
    refresh() { drawings_.as([...storage.get("canvas")]); },
    clear() { storage.clear("canvas"); },
    remove(drawing) { storage.removeFrom("canvas", [drawing]); },
    async download() {
      const name = name$.value;
      if (!name) { app.tip({ text: ["请先输入名称"] }); return; }
      download$.setLoading(true);
      try {
        const zip = new JSZip();
        storage.get("canvas").forEach((data, index) => zip.file(`${name}_${index + 1}.png`, data.replace(/^data:image\/(png|jpeg);base64,/, ""), { base64: true }));
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const link = document.createElement("a");
        link.setAttribute("data-n", "drawing-download-link");
        link.href = url;
        link.download = `${name}.zip`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
      } catch (error) { app.tip({ text: [error.message] }); }
      finally { download$.setLoading(false); }
    },
    destroy() { for (const off of listeners) off(); },
  };
  const listeners = [storage.onStateChange(methods.refresh), view.onShow(methods.refresh)];
  const download$ = new Timeless.vm.ButtonCore({ onClick: methods.download });
  return { state: { drawings: drawings_ }, methods, ui: {
    name$, download$,
    clear$: new Timeless.vm.ButtonCore({ onClick: methods.clear }),
    refresh$: new Timeless.vm.ButtonCore({ onClick: methods.refresh }),
  } };
}
