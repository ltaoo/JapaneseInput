import { createSignal, For, onMount } from "solid-js";
import JSZip from "jszip";

import { ViewComponentProps } from "@/store/types";
import { Button, Input, ScrollView } from "@/components/ui";
import { ButtonCore, InputCore, ScrollViewCore } from "@/domains/ui";

export function CanvasDrawingManagePage(props: ViewComponentProps) {
  const { app, storage, view } = props;

  const $scroll = new ScrollViewCore({});
  const $name = new InputCore({
    defaultValue: "a",
  });
  const $download = new ButtonCore({
    async onClick() {
      const name = $name.value;
      if (!name) {
        app.tip({
          text: ["请先输入名称"],
        });
        return;
      }
      const zip = new JSZip();
      const drawings = storage.get("canvas");
      drawings.forEach((dataURL, index) => {
        // 处理 dataURL，去除前缀并获取纯数据
        const base64Data = dataURL.replace(/^data:image\/(png|jpeg);base64,/, "");
        zip.file(`${name}_${index + 1}.png`, base64Data, { base64: true });
      });
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `${name}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    },
  });
  const $clear = new ButtonCore({
    onClick() {
      storage.clear("canvas");
    },
  });
  const $refresh = new ButtonCore({
    onClick() {
      setList(storage.get("canvas"));
    },
  });
  storage.onStateChange((v) => {
    setList(v.values.canvas);
  });

  const [list, setList] = createSignal(storage.get("canvas"));

  view.onShow(() => {
    setList(storage.get("canvas"));
  });

  return (
    <ScrollView store={$scroll} class="p-4">
      <div>共{list().length}条记录</div>
      <div class="flex space-x-2">
        <div class="flex space-x-1">
          <Input store={$name} />
          <Button store={$download}>下载</Button>
        </div>
        <Button store={$clear}>删除</Button>
        <Button store={$refresh}>刷新</Button>
      </div>
      <div class="flex flex-wrap gap-2">
        <For each={list()}>
          {(drawing) => {
            return (
              <div>
                <img class="w-[210px] h-[210px]" src={drawing} />
                <div
                  onClick={() => {
                    storage.removeFrom("canvas", [drawing]);
                  }}
                >
                  删除
                </div>
              </div>
            );
          }}
        </For>
      </div>
    </ScrollView>
  );
}
