import { createSignal, For, JSX } from "solid-js";

import { CanvasCore } from "@/biz/canvas";
import { connect, connectLayer } from "@/biz/canvas/connect.web";

export function Canvas(props: { store: CanvasCore } & JSX.HTMLAttributes<HTMLDivElement>) {
  const { store: $$canvas } = props;
  //   const $$canvas = CanvasCore({});

  const [layers] = createSignal($$canvas.layerList);

  return (
    <div
      // class={props.class}
      classList={{
        "__a relative w-full h-full": true,
      }}
      style={props.style}
      onAnimationEnd={(event) => {
        connect($$canvas, event.currentTarget);
      }}
    >
      <For each={layers()}>
        {(layer) => {
          return (
            <canvas
              classList={{
                "__a absolute inset-0 w-full h-full": true,
                "pointer-events-none": layer.disabled,
              }}
              style={{ "z-index": layer.zIndex }}
              onAnimationEnd={(event) => {
                const $canvas = event.currentTarget as HTMLCanvasElement;
                const ctx = $canvas.getContext("2d");
                if (!ctx) {
                  return;
                }
                connectLayer(layer, $$canvas, $canvas, ctx);
              }}
            />
          );
        }}
      </For>
    </div>
  );
}
