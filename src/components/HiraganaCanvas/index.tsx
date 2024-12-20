import { createSignal, For, Show } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";

import { Canvas } from "@/components/Canvas";
import { RecognizeCore } from "@/biz/recognize";

export function HiraganaCanvas(props: { store: RecognizeCore } & JSX.HTMLAttributes<HTMLDivElement>) {
  const { store: $recognize } = props;

  const [state, setState] = createSignal($recognize.state);
  $recognize.onChange((v) => setState(v));

  return (
    <div class="w-full h-full">
      <div class={props.class} classList={{ relative: true, "w-full h-full": true }} style={{ "z-index": 10 }}>
        <Canvas store={$recognize.$canvas} />
      </div>
      <Show when={state().finish && state().result.length === 0}>
        <div class="p-2 text-center text-gray-800 bg-100">没有识别出结果</div>
      </Show>
      <Show when={state().finish && state().result.length !== 1}>
        <div class="absolute bottom-4 left-1/2 -translate-x-1/2" style={{ "z-index": 20 }}>
          <div class="flex space-x-2">
            <For each={state().result}>
              {(text) => {
                return (
                  <div
                    class="p-2 rounded-md bg-gray-100 cursor-pointer hover:bg-gray-200"
                    onClick={() => {
                      $recognize.select(text);
                    }}
                  >
                    <div>{text}</div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}
